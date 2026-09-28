import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Send, Plus, Settings2, Trash2, MessageSquare, MessagesSquare, ArrowLeft, Bell, BellOff } from "lucide-react";

type Page = {
  id: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
};

type Conversation = {
  id: string;
  page_ref: string;
  thread_type: "message" | "comment";
  thread_key: string;
  customer_name: string | null;
  last_message_text: string | null;
  last_message_at: string;
  unread_count: number;
  is_resolved: boolean;
};

type Message = {
  id: string;
  direction: "in" | "out";
  sender_name: string | null;
  message: string | null;
  sent_at: string;
};

const FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
};

const FanpageInboxWidget = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === "admin";

  const [pages, setPages] = useState<Page[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activePageFilter, setActivePageFilter] = useState<string>("all");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [addingPage, setAddingPage] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState(30);
  const [visibleConversations, setVisibleConversations] = useState(12);
  const chatRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const alertsActivated = useRef(false);

  const callFn = useCallback(async (body: Record<string, unknown>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const res = await fetch(`${FUNCTIONS_URL}/fb-inbox`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || json?.error) throw new Error(json?.error || "Yêu cầu thất bại");
    return json;
  }, []);

  const loadPages = useCallback(async () => {
    const { data } = await supabase
      .from("fb_pages")
      .select("id, page_id, page_name, is_active")
      .order("created_at", { ascending: true });
    setPages((data as Page[]) ?? []);
  }, []);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("fb_conversations")
      .select("id, page_ref, thread_type, thread_key, customer_name, last_message_text, last_message_at, unread_count, is_resolved")
      .order("last_message_at", { ascending: false })
      .limit(100);
    setConversations((data as Conversation[]) ?? []);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from("fb_messages")
      .select("id, direction, sender_name, message, sent_at")
      .eq("conversation_id", conversationId)
      .order("sent_at", { ascending: false })
      .limit(100);
    setMessages(((data as Message[]) ?? []).reverse());
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      await Promise.all([loadPages(), loadConversations()]);
      setLoading(false);
    })();
  }, [isAdmin, loadPages, loadConversations]);

  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;
  const [live, setLive] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);

  const notifyNew = useCallback(
    (row: { conversation_id: string; sender_name: string | null; message: string | null }) => {
      const who = row.sender_name || "Khách";
      const text = row.message || "(tệp đính kèm)";
      toast({ title: `Tin mới từ ${who}`, description: text.slice(0, 120) });
      setFlashId(row.conversation_id);
      setTimeout(() => setFlashId(null), 4000);
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
        new Notification(`Tin mới từ ${who}`, { body: text.slice(0, 120) });
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

  const checkRecentMessages = useCallback(async (announce: boolean) => {
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data } = await supabase.from("fb_messages")
      .select("id, conversation_id, sender_name, message, sent_at")
      .eq("direction", "in").gte("sent_at", since)
      .order("sent_at", { ascending: true }).limit(100);
    for (const row of data ?? []) {
      if (seenIds.current.has(row.id)) continue;
      seenIds.current.add(row.id);
      if (announce && initialized.current) notifyNew(row);
    }
    if (seenIds.current.size > 500) seenIds.current.clear();
  }, [notifyNew]);

  // realtime updates
  useEffect(() => {
    if (!isAdmin) return;
    void checkRecentMessages(false);
    const channel = supabase
      .channel("fanpage-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "fb_conversations" }, () => {
        loadConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fb_messages" }, (payload) => {
        const row = payload.new as {
          conversation_id: string;
          direction: string;
          sender_name: string | null;
          message: string | null;
          sent_at: string;
        };
        const id = String(payload.new.id ?? "");
        if (seenIds.current.has(id)) return;
        seenIds.current.add(id);
        if (seenIds.current.size > 500) seenIds.current.clear();
        loadConversations();
        if (row.conversation_id === activeIdRef.current) loadMessages(row.conversation_id);
        const fresh = Date.now() - new Date(row.sent_at).getTime() < 10 * 60 * 1000;
        if (row.direction === "in" && fresh && initialized.current) notifyNew(row);
      })
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") {
          initialized.current = true;
          loadConversations();
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, loadConversations, loadMessages, notifyNew, checkRecentMessages]);

  // Reconcile gaps after reconnect and while the webhook is delayed.
  useEffect(() => {
    if (!isAdmin || pages.length === 0) return;
    const tick = () => {
      callFn({ action: "sync" }).then(() => {
        loadConversations();
        if (activeIdRef.current) loadMessages(activeIdRef.current);
        void checkRecentMessages(true);
      }).catch(() => undefined);
    };
    const id = window.setInterval(tick, 20000);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [isAdmin, pages.length, callFn, loadConversations, loadMessages, checkRecentMessages]);

  // Unread count in tab title
  useEffect(() => {
    const total = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = total > 0 ? `(${total}) ${base}` : base;
    return () => {
      document.title = document.title.replace(/^\(\d+\)\s*/, "");
    };
  }, [conversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  const filtered = useMemo(
    () =>
      activePageFilter === "all"
        ? conversations
        : conversations.filter((c) => c.page_ref === activePageFilter),
    [conversations, activePageFilter],
  );

  const active = filtered.find((c) => c.id === activeId) ?? null;
  const pageName = (ref: string) => pages.find((p) => p.id === ref)?.page_name ?? "Fanpage";
  const lastIncoming = [...messages].reverse().find((m) => m.direction === "in");
  const messageAge = lastIncoming ? Date.now() - new Date(lastIncoming.sent_at).getTime() : 0;
  const pastSevenDays = active?.thread_type === "message" && messageAge >= 7 * 24 * 60 * 60 * 1000;
  const needsHumanAgent = active?.thread_type === "message" && messageAge >= 24 * 60 * 60 * 1000 && !pastSevenDays;

  const handleSelect = async (conv: Conversation) => {
    enableAlerts();
    setVisibleMessages(30);
    setActiveId(conv.id);
    requestAnimationFrame(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    if (conv.unread_count > 0) {
      await supabase.from("fb_conversations").update({ unread_count: 0 }).eq("id", conv.id);
      loadConversations();
    }
  };

  const handleAddPage = async () => {
    if (!tokenInput.trim()) return;
    setAddingPage(true);
    try {
      const info = await callFn({ action: "verify_page", access_token: tokenInput.trim() });
      const { error } = await supabase.from("fb_pages").upsert(
        {
          page_id: info.page_id,
          page_name: info.page_name,
          access_token: tokenInput.trim(),
          is_active: true,
        },
        { onConflict: "page_id" },
      );
      if (error) throw error;
      toast({
        title: `Đã kết nối ${info.page_name}`,
        description: info.subscribed
          ? "Tin nhắn và bình luận mới sẽ tự động về đây."
          : `Đã lưu trang, nhưng chưa đăng ký nhận tin tự động: ${info.subscribe_error ?? "kiểm tra lại quyền của token"}`,
      });
      setTokenInput("");
      setDialogOpen(false);
      loadPages();
    } catch (e) {
      toast({
        title: "Không kết nối được",
        description: e instanceof Error ? e.message : "Vui lòng kiểm tra lại token",
        variant: "destructive",
      });
    } finally {
      setAddingPage(false);
    }
  };

  const handleRemovePage = async (id: string) => {
    await supabase.from("fb_pages").delete().eq("id", id);
    loadPages();
    loadConversations();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await callFn({ action: "sync" });
      toast({ title: "Đã tải tin nhắn", description: `${res.imported} tin nhắn được cập nhật.` });
      await loadConversations();
      if (activeId) loadMessages(activeId);
    } catch (e) {
      toast({
        title: "Tải tin nhắn thất bại",
        description: e instanceof Error ? e.message : "Lỗi không xác định",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDiagnose = async () => {
    setChecking(true);
    try {
      const result = await callFn({ action: "diagnose" });
      const failed = (result.results ?? []).find(
        (item: { subscribed: boolean; token_valid: boolean; conversations_access: boolean }) =>
          !item.subscribed || !item.token_valid || !item.conversations_access,
      );
      if (failed) {
        throw new Error(
          failed.subscribe_error || failed.conversations_error || "Token hoặc đăng ký sự kiện chưa hợp lệ.",
        );
      }
      toast({
        title: "Kết nối Facebook hoạt động",
        description: "Token, đăng ký sự kiện và quyền đọc hội thoại đều hợp lệ.",
      });
    } catch (e) {
      toast({
        title: "Kết nối Facebook chưa hoàn tất",
        description: e instanceof Error ? e.message : "Không thể kiểm tra kết nối.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleReply = async () => {
    if (!activeId || !reply.trim() || pastSevenDays || sending) return;
    setSending(true);
    try {
      await callFn({ action: "reply", conversation_id: activeId, message: reply.trim() });
      setReply("");
      await loadMessages(activeId);
      loadConversations();
    } catch (e) {
      toast({
        title: "Không gửi được",
        description: e instanceof Error ? e.message : "Lỗi không xác định",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Tính năng này chỉ dành cho quản trị viên.
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

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const initials = (n: string | null) =>
    (n || "K").split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="space-y-3 min-w-0" onPointerDown={enableAlerts}>
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold font-sans">Hộp thư Fanpage</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${live ? "bg-primary" : "bg-muted-foreground"}`} />
              {live ? "Trực tiếp" : "Đang kết nối..."}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {pages.length} fanpage · {conversations.length} hội thoại · <strong className="text-foreground">{totalUnread} chưa đọc</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" title={soundEnabled ? "Tắt âm báo" : "Bật âm báo"} aria-label={soundEnabled ? "Tắt âm báo" : "Bật âm báo"} onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" title="Tải tin nhắn" onClick={handleSync} disabled={syncing || pages.length === 0}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Làm mới</span>
          </Button>
          <Button variant="outline" size="sm" title="Kiểm tra kết nối" onClick={handleDiagnose} disabled={checking || pages.length === 0}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Kiểm tra</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" title="Thêm fanpage">
                <Plus className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Thêm fanpage</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Kết nối fanpage</DialogTitle>
                <DialogDescription>
                  Dán Page Access Token của fanpage. Hệ thống sẽ tự nhận tên trang và bật nhận tin nhắn, bình luận mới.
                </DialogDescription>
              </DialogHeader>
              <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="EAAG..." className="font-mono text-xs" />
              <Button onClick={handleAddPage} disabled={addingPage || !tokenInput.trim()}>
                {addingPage && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Kết nối
              </Button>
              {pages.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fanpage đã kết nối</div>
                  {pages.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{p.page_name}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRemovePage(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Page filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[{ id: "all", page_name: "Tất cả" }, ...pages].map((p) => {
          const count = p.id === "all" ? totalUnread : conversations.filter((c) => c.page_ref === p.id).reduce((s, c) => s + c.unread_count, 0);
          const on = activePageFilter === p.id;
          return (
            <Button
              type="button"
              variant={on ? "default" : "ghost"}
              size="sm"
              key={p.id}
              onClick={() => setActivePageFilter(p.id)}
              className="max-w-[220px] gap-2"
            >
              <span className="truncate">{p.page_name}</span>
              {count > 0 && (
                <span className="rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 min-w-[18px] text-center">
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {pages.length === 0 ? (
        <div className="border border-dashed border-border rounded-md py-14 text-center">
          <MessagesSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Chưa có fanpage nào</p>
          <p className="text-sm text-muted-foreground mt-1">Bấm “Thêm fanpage” và dán Page Access Token để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)] gap-0 border border-border rounded-md bg-card items-start">
          <div className={`min-w-0 lg:border-r border-border ${active ? "hidden lg:block" : "block"}`}>
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">Hội thoại <span className="text-muted-foreground font-normal">({filtered.length})</span></div>
            {filtered.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground text-center">Chưa có hội thoại nào.</div>
            ) : (
              filtered.slice(0, visibleConversations).map((c) => {
                const unread = c.unread_count > 0;
                const sel = c.id === activeId;
                return (
                  <Button
                    type="button"
                    variant="ghost"
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`h-auto w-full justify-start text-left rounded-none px-3 py-3 flex gap-3 border-b border-border/50 border-l-2 transition-colors ${
                      sel ? "bg-primary/10 border-l-primary" : unread ? "border-l-primary/60 hover:bg-muted/60" : "border-l-transparent hover:bg-muted/60"
                    } ${flashId === c.id ? "animate-pulse bg-primary/15" : ""}`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {initials(c.customer_name)}
                      </div>
                      {c.thread_type === "comment" && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center">
                          <MessageSquare className="h-3 w-3 text-primary" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[15px] truncate flex-1 ${unread ? "font-bold" : "font-semibold"}`}>
                          {c.customer_name || "Khách"}
                        </span>
                        <span className={`text-[11px] shrink-0 ${unread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          {timeAgo(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-[13px] truncate flex-1 ${unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                          {c.last_message_text}
                        </p>
                        {unread && <Badge className="h-5 min-w-5 px-1.5 justify-center">{c.unread_count}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {pageName(c.page_ref)} · {c.thread_type === "comment" ? "Bình luận" : "Messenger"}
                      </p>
                    </div>
                  </Button>
                );
              })
            )}
            {filtered.length > visibleConversations && <Button variant="ghost" className="w-full rounded-none" onClick={() => setVisibleConversations((n) => n + 12)}>Xem thêm hội thoại</Button>}
          </div>

          <div ref={chatRef} className={`min-w-0 scroll-mt-20 ${active ? "block" : "hidden lg:block"}`}>
            {!active ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-3 min-h-[400px]">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <MessagesSquare className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm">Chọn một hội thoại để trả lời</p>
              </div>
            ) : (
              <>
                <div className="px-3 sm:px-5 py-3 border-b border-border flex items-center gap-3 bg-card">
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0" aria-label="Quay lại hội thoại" onClick={() => setActiveId(null)}><ArrowLeft className="h-5 w-5" /></Button>
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {initials(active.customer_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-sm">{active.customer_name || "Khách"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {pageName(active.page_ref)} · {active.thread_type === "comment" ? "Bình luận bài viết" : "Messenger"}
                    </p>
                  </div>
                </div>

                <form className="p-3 sm:p-4 border-b border-border bg-card flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void handleReply(); }}>
                  <Textarea
                    aria-label="Nhập câu trả lời"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        void handleReply();
                      }
                    }}
                    placeholder={pastSevenDays ? "Đã quá hạn trả lời qua Facebook" : "Nhập câu trả lời..."}
                    disabled={pastSevenDays}
                    rows={2}
                    className="resize-none text-sm rounded-md min-w-0"
                  />
                  <Button type="submit" title="Gửi tin nhắn" aria-label="Gửi tin nhắn" disabled={sending || !reply.trim() || pastSevenDays} className="h-10 w-10 p-0 shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
                {pastSevenDays && <p className="px-4 py-2 text-sm text-muted-foreground border-b border-border">Tin cuối của khách đã quá 7 ngày; cần chờ khách nhắn lại để tiếp tục trò chuyện.</p>}
                {needsHumanAgent && <p className="px-4 py-2 text-sm text-muted-foreground border-b border-border">Tin cuối đã quá 24 giờ. Chỉ gửi được nếu trang có quyền HUMAN_AGENT từ Meta.</p>}

                <div className="p-3 sm:p-5 space-y-3 bg-muted/20 min-h-[260px]">
                  {messages.length > visibleMessages && (
                    <div className="text-center"><Button variant="outline" size="sm" onClick={() => setVisibleMessages((n) => n + 30)}>Xem tin cũ hơn</Button></div>
                  )}
                  {messages.slice(-visibleMessages).map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] sm:max-w-[75%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                          m.direction === "out"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground border border-border"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.message}</div>
                        <div className={`text-[10px] mt-1 ${m.direction === "out" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.sent_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FanpageInboxWidget;
