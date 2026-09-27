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
import { Loader2, RefreshCw, Send, Plus, Settings2, Trash2, MessageSquare, MessagesSquare } from "lucide-react";

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
  const bottomRef = useRef<HTMLDivElement>(null);

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
      .order("sent_at", { ascending: true })
      .limit(200);
    setMessages((data as Message[]) ?? []);
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
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.35);
      } catch {
        /* ignore */
      }
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        new Notification(`Tin mới từ ${who}`, { body: text.slice(0, 120) });
      }
    },
    [toast],
  );

  // realtime updates
  useEffect(() => {
    if (!isAdmin) return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => undefined);
    }
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
        if (row.conversation_id === activeIdRef.current) loadMessages(row.conversation_id);
        const fresh = Date.now() - new Date(row.sent_at).getTime() < 10 * 60 * 1000;
        if (row.direction === "in" && fresh) notifyNew(row);
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, loadConversations, loadMessages, notifyNew]);

  // Background auto-sync (fallback when Facebook webhook is delayed)
  useEffect(() => {
    if (!isAdmin || pages.length === 0) return;
    const tick = () => {
      if (document.hidden) return;
      callFn({ action: "sync" }).catch(() => undefined);
    };
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, [isAdmin, pages.length, callFn]);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const filtered = useMemo(
    () =>
      activePageFilter === "all"
        ? conversations
        : conversations.filter((c) => c.page_ref === activePageFilter),
    [conversations, activePageFilter],
  );

  const active = filtered.find((c) => c.id === activeId) ?? null;
  const pageName = (ref: string) => pages.find((p) => p.id === ref)?.page_name ?? "Fanpage";

  const handleSelect = async (conv: Conversation) => {
    setActiveId(conv.id);
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
    if (!activeId || !reply.trim()) return;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground p-5 flex flex-wrap items-center gap-4 shadow-lg">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Hộp thư Fanpage</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[11px] font-semibold">
              <span className={`h-2 w-2 rounded-full ${live ? "bg-primary-foreground animate-pulse" : "bg-primary-foreground/40"}`} />
              {live ? "Trực tiếp" : "Đang kết nối..."}
            </span>
          </div>
          <p className="text-sm text-primary-foreground/80 mt-1">
            {pages.length} fanpage · {conversations.length} hội thoại ·{" "}
            <b>{totalUnread}</b> chưa đọc — tin mới tự hiện và báo chuông.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing || pages.length === 0}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Làm mới</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDiagnose} disabled={checking || pages.length === 0}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Kiểm tra</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
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
            <button
              key={p.id}
              onClick={() => setActivePageFilter(p.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all max-w-[220px] ${
                on ? "bg-foreground text-background shadow" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate">{p.page_name}</span>
              {count > 0 && (
                <span className="rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 min-w-[18px] text-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <MessagesSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Chưa có fanpage nào</p>
          <p className="text-sm text-muted-foreground mt-1">Bấm “Thêm fanpage” và dán Page Access Token để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-8 text-sm text-muted-foreground text-center">Chưa có hội thoại nào.</div>
            ) : (
              filtered.map((c) => {
                const unread = c.unread_count > 0;
                const sel = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left px-4 py-3 flex gap-3 border-b border-border/50 last:border-0 border-l-4 transition-all ${
                      sel ? "bg-primary/10 border-l-primary" : unread ? "border-l-primary/60 hover:bg-muted/60" : "border-l-transparent hover:bg-muted/60"
                    } ${flashId === c.id ? "animate-pulse bg-primary/15" : ""}`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold text-sm">
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
                  </button>
                );
              })
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card flex flex-col min-h-[460px] shadow-sm">
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 py-16">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessagesSquare className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm">Chọn một hội thoại để trả lời</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {initials(active.customer_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{active.customer_name || "Khách"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {pageName(active.page_ref)} · {active.thread_type === "comment" ? "Bình luận bài viết" : "Messenger"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-4 space-y-2 bg-muted/30">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex animate-fade-in ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                          m.direction === "out"
                            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-br-md"
                            : "bg-background text-foreground border border-border/60 rounded-bl-md"
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{m.message}</div>
                        <div className={`text-[10px] mt-1 ${m.direction === "out" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.sent_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="p-3 border-t border-border/60 flex items-end gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                    placeholder="Nhập câu trả lời... (Enter để gửi, Shift+Enter xuống dòng)"
                    rows={2}
                    className="resize-none text-[15px] rounded-xl"
                  />
                  <Button onClick={handleReply} disabled={sending || !reply.trim()} className="h-11 w-11 rounded-full p-0 shrink-0">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
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
