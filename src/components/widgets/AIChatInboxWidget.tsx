import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, MessageSquare, MessagesSquare, ArrowLeft, Bot, Bell, BellOff, RefreshCw } from "lucide-react";

type Session = {
  id: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_telegram: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
};

type ChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const timeAgo = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
};

const contactLabel = (s: Session) =>
  s.contact_email || (s.contact_telegram ? `@${s.contact_telegram}` : s.contact_phone) || "Khách ẩn danh";

const AIChatInboxWidget = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === "admin";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState(50);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const alertsActivated = useRef(false);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const loadSessions = useCallback(async () => {
    const { data } = await supabase
      .from("ai_chat_sessions")
      .select("id, contact_email, contact_phone, contact_telegram, last_message, last_message_at, unread_count, created_at")
      .order("last_message_at", { ascending: false })
      .limit(100);
    setSessions((data as Session[]) ?? []);
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("ai_chat_messages")
      .select("id, session_id, role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(300);
    setMessages((data as ChatMessage[]) ?? []);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      await loadSessions();
      setLoading(false);
    })();
  }, [isAdmin, loadSessions]);

  const notifyNew = useCallback(
    (row: ChatMessage) => {
      toast({ title: "Khách vừa nhắn với AI", description: row.content.slice(0, 120) });
      if (soundEnabled && audioRef.current?.state === "running") {
        const ctx = audioRef.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.3);
      }
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        new Notification("Khách vừa nhắn với AI", { body: row.content.slice(0, 120) });
      }
    },
    [toast, soundEnabled],
  );

  const enableAlerts = () => {
    if (alertsActivated.current) return;
    alertsActivated.current = true;
    if (soundEnabled) {
      try {
        audioRef.current ??= new AudioContext();
        void audioRef.current.resume();
      } catch { /* browser does not support audio */ }
    }
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  };

  useEffect(() => () => { void audioRef.current?.close(); }, []);

  // Realtime: new AI chat messages and session updates
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("ai-chat-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_chat_messages" },
        (payload) => {
          const row = payload.new as ChatMessage;
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);
          if (seenIds.current.size > 500) seenIds.current.clear();
          loadSessions();
          if (row.session_id === activeIdRef.current) {
            loadMessages(row.session_id);
            void supabase.from("ai_chat_sessions").update({ unread_count: 0 }).eq("id", row.session_id);
          }
          if (row.role === "user" && initialized.current) notifyNew(row);
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_chat_sessions" }, () => loadSessions())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") initialized.current = true;
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, loadSessions, loadMessages, notifyNew]);

  // Unread count in tab title
  useEffect(() => {
    const total = sessions.reduce((s, c) => s + (c.unread_count || 0), 0);
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = total > 0 ? `(${total}) ${base}` : base;
    return () => {
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
    };
  }, [sessions]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  // Messenger-style: newest message in view, chat panel scrolls internally only.
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [messages, activeId, visibleMessages]);

  const handleSelect = async (session: Session) => {
    enableAlerts();
    setVisibleMessages(50);
    setActiveId(session.id);
    if (session.unread_count > 0) {
      await supabase.from("ai_chat_sessions").update({ unread_count: 0 }).eq("id", session.id);
      loadSessions();
    }
  };

  const copyContact = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Đã sao chép", description: value });
    } catch {
      toast({ title: "Không sao chép được", variant: "destructive" });
    }
  };

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const shownMessages = useMemo(() => messages.slice(-visibleMessages), [messages, visibleMessages]);

  if (!isAdmin) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Chỉ quản trị viên mới xem được các phiên chat AI.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalUnread = sessions.reduce((s, c) => s + (c.unread_count || 0), 0);

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[520px] max-h-[860px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <MessagesSquare className="h-5 w-5 text-primary" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">Chat AI</h2>
            <Badge variant="secondary" className="text-[10px]">Trực tiếp</Badge>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {sessions.length} phiên chat · {totalUnread} chưa đọc
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSoundEnabled((v) => !v)}
            aria-label={soundEnabled ? "Tắt âm báo" : "Bật âm báo"}
          >
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => loadSessions()}
            aria-label="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body: session list + chat panel */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        {/* Session list */}
        <div className={`flex min-h-0 flex-col border-r border-border ${activeId ? "hidden lg:flex" : "flex"}`}>
          <div className="flex h-11 shrink-0 items-center border-b border-border px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Khách chat
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-40" />
                <p className="text-sm">Chưa có phiên chat nào.</p>
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className={`flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      isActive ? "bg-muted" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      {contactLabel(s).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${s.unread_count > 0 ? "font-semibold" : "font-medium"}`}>
                          {contactLabel(s)}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {timeAgo(s.last_message_at)}
                        </span>
                      </div>
                      <p className={`truncate text-xs ${s.unread_count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.last_message || "—"}
                      </p>
                    </div>
                    {s.unread_count > 0 && (
                      <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                        {s.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex min-h-0 flex-col ${activeId ? "flex" : "hidden lg:flex"}`}>
          {active ? (
            <>
              {/* Chat header */}
              <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 lg:hidden"
                  onClick={() => setActiveId(null)}
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {contactLabel(active).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{contactLabel(active)}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Bắt đầu {timeAgo(active.created_at)} trước
                  </p>
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  {active.contact_email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => copyContact(active.contact_email!)}
                    >
                      <Copy className="h-3 w-3" /> Email
                    </Button>
                  )}
                  {active.contact_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => copyContact(active.contact_phone!)}
                    >
                      <Copy className="h-3 w-3" /> {active.contact_phone}
                    </Button>
                  )}
                  {active.contact_telegram && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => copyContact(`https://t.me/${active.contact_telegram}`)}
                    >
                      <Copy className="h-3 w-3" /> @{active.contact_telegram}
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                {messages.length > visibleMessages && (
                  <div className="mb-3 flex justify-center">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setVisibleMessages((v) => v + 50)}>
                      Xem tin cũ hơn
                    </Button>
                  </div>
                )}
                <div className="mx-auto flex max-w-3xl flex-col gap-3">
                  {shownMessages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${isUser ? "justify-start" : "justify-end"}`}>
                        {isUser && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                            {contactLabel(active).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                            isUser
                              ? "rounded-bl-sm bg-muted text-foreground"
                              : "rounded-br-sm bg-primary text-primary-foreground"
                          }`}
                        >
                          {m.content}
                        </div>
                        {!isUser && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-center text-[10px] text-muted-foreground">
                    Trợ lý AI trả lời tự động — nhân viên liên hệ khách qua thông tin ở trên.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground lg:flex">
              <MessageSquare className="h-10 w-10 opacity-40" />
              <p className="text-sm">Chọn một phiên chat để xem nội dung.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChatInboxWidget;
