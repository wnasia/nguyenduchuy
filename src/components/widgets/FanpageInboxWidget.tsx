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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw, Send, Plus, Settings2, Trash2, MessageSquare, MessagesSquare, ArrowLeft, Bell, BellOff } from "lucide-react";

type Page = {
  id: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
  assigned_user_id: string | null;
};

type StaffOption = {
  id: string;
  full_name: string | null;
  email: string | null;
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
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [deletingPage, setDeletingPage] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visibleMessages, setVisibleMessages] = useState(30);
  const [visibleConversations, setVisibleConversations] = useState(12);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
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

  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  const loadPages = useCallback(async () => {
    const { data } = await supabase
      .from("fb_pages")
      .select("id, page_id, page_name, is_active, assigned_user_id")
      .order("created_at", { ascending: true });
    setPages((data as Page[]) ?? []);
  }, []);

  const loadStaff = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("account_status", "active")
      .order("full_name", { ascending: true });
    setStaffList((data as StaffOption[]) ?? []);
  }, []);

  const handleAssign = async (pageId: string, userId: string) => {
    const { error } = await supabase
      .from("fb_pages")
      .update({ assigned_user_id: userId || null })
      .eq("id", pageId);
    if (error) {
      toast({ title: "Không phân bổ được", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã cập nhật phân bổ" });
    loadPages();
  };

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
    (async () => {
      await Promise.all([loadPages(), loadConversations(), ...(isAdmin ? [loadStaff()] : [])]);
      setLoading(false);
    })();
  }, [isAdmin, loadPages, loadConversations, loadStaff]);

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
    if (pages.length === 0) return;
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
  }, [pages.length, loadConversations, loadMessages, notifyNew, checkRecentMessages]);

  // Reconcile gaps after reconnect and while the webhook is delayed.
  useEffect(() => {
    if (pages.length === 0) return;
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

  // Messenger-style: keep the newest message in view, composer stays pinned at the bottom.
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
  }, [messages, activeId, visibleMessages]);

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

  const handleRemovePage = async () => {
    if (!deleteTarget || deletingPage) return;
    setDeletingPage(true);
    const { error } = await supabase.from("fb_pages").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({
        title: "Không gỡ được fanpage",
        description: error.message,
        variant: "destructive",
      });
      setDeletingPage(false);
      return;
    }
    toast({ title: `Đã gỡ fanpage ${deleteTarget.page_name}` });
    if (activePageFilter === deleteTarget.id) setActivePageFilter("all");
    if (active && active.page_ref === deleteTarget.id) setActiveId(null);
    setDeleteTarget(null);
    setDeletingPage(false);
    await Promise.all([loadPages(), loadConversations()]);
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

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && pages.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Bạn chưa được phân bổ quản lý fanpage nào. Hãy liên hệ quản trị viên.
      </div>
    );
  }

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);
  const initials = (n: string | null) =>
    (n || "K").split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[520px] max-h-[860px] min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card" onPointerDown={enableAlerts}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-sans text-base font-semibold">Hộp thư Fanpage</h2>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${live ? "bg-primary" : "bg-muted-foreground"}`} />
              {live ? "Trực tiếp" : "Đang kết nối"}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{conversations.length} hội thoại · {totalUnread} chưa đọc</p>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title={soundEnabled ? "Tắt âm báo" : "Bật âm báo"} aria-label={soundEnabled ? "Tắt âm báo" : "Bật âm báo"} onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Làm mới" aria-label="Làm mới" onClick={handleSync} disabled={syncing || pages.length === 0}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" title="Quản lý fanpage" aria-label="Quản lý fanpage">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[85dvh] max-w-2xl flex-col overflow-hidden p-0">
              <DialogHeader className="shrink-0 border-b border-border p-5">
                <DialogTitle>Quản lý fanpage</DialogTitle>
                <DialogDescription>Kết nối trang và phân công nhân viên phụ trách.</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Kết nối fanpage mới</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Dán Page Access Token" className="min-w-0 flex-1 font-mono text-xs" />
                    <Button onClick={handleAddPage} disabled={addingPage || !tokenInput.trim()} className="shrink-0">
                      {addingPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                      Kết nối
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Fanpage đã kết nối</p>
                    <Button variant="outline" size="sm" onClick={handleDiagnose} disabled={checking || pages.length === 0}>
                      {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Kiểm tra kết nối
                    </Button>
                  </div>
                  {pages.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Chưa có fanpage nào.</p> : pages.map((p) => (
                    <div key={p.id} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[minmax(0,1fr)_220px_36px] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.page_name}</p>
                        <p className="truncate text-xs text-muted-foreground">ID {p.page_id}</p>
                      </div>
                      <select aria-label={`Nhân viên phụ trách ${p.page_name}`} value={p.assigned_user_id ?? ""} onChange={(e) => handleAssign(p.id, e.target.value)} className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm">
                        <option value="">Chưa phân bổ</option>
                        {staffList.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email || s.id.slice(0, 8)}</option>)}
                      </select>
                      <Button variant="ghost" size="icon" className="h-9 w-9 justify-self-end" onClick={() => setDeleteTarget(p)} aria-label={`Gỡ ${p.page_name}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              className="h-8 max-w-[200px] shrink-0 gap-2 px-3 text-xs"
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 text-center">
          <MessagesSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Chưa có fanpage nào</p>
          <p className="mt-1 text-sm text-muted-foreground">Mở phần quản lý fanpage để kết nối trang đầu tiên.</p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <div className={`min-w-0 lg:border-r border-border flex flex-col ${active ? "hidden lg:flex" : "flex"}`}>
            <div className="flex h-11 shrink-0 items-center border-b border-border px-4 text-sm font-semibold">Hội thoại <span className="ml-1 font-normal text-muted-foreground">({filtered.length})</span></div>
            <div className="flex-1 overflow-y-auto min-h-0">
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
            </div>
            {filtered.length > visibleConversations && (
              <Button variant="ghost" className="w-full rounded-none border-t shrink-0" onClick={() => setVisibleConversations((n) => n + 12)}>Xem thêm hội thoại</Button>
            )}
          </div>

          <div className={`min-w-0 flex flex-col h-full ${active ? "flex" : "hidden lg:flex"}`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <MessagesSquare className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm">Chọn một hội thoại để trả lời</p>
              </div>
            ) : (
              <>
                <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-5">
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

                <div ref={messagesScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-muted/20 p-3 sm:p-5">
                  {messages.length > visibleMessages && (
                    <div className="text-center"><Button variant="outline" size="sm" onClick={() => setVisibleMessages((n) => n + 30)}>Xem tin cũ hơn</Button></div>
                  )}
                  {messages.slice(-visibleMessages).map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          m.direction === "out"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-card text-foreground border border-border rounded-bl-md"
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

                <div className="shrink-0 border-t border-border bg-card p-2.5 sm:p-3">
                  {pastSevenDays && <p className="mb-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Tin cuối đã quá 7 ngày. Cần chờ khách nhắn lại.</p>}
                  {needsHumanAgent && <p className="mb-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Tin cuối đã quá 24 giờ. Meta chỉ cho phép gửi khi trang có quyền HUMAN_AGENT.</p>}
                  <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void handleReply(); }}>
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
                      rows={1}
                      className="max-h-28 min-h-10 min-w-0 resize-none rounded-md py-2.5 text-sm"
                    />
                    <Button type="submit" title="Gửi tin nhắn" aria-label="Gửi tin nhắn" disabled={sending || !reply.trim() || pastSevenDays} className="h-10 w-10 shrink-0 p-0">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deletingPage) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ fanpage?</AlertDialogTitle>
            <AlertDialogDescription>
              Fanpage “{deleteTarget?.page_name}” cùng toàn bộ hội thoại và tin nhắn đã lưu sẽ bị xóa khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPage}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleRemovePage(); }} disabled={deletingPage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gỡ fanpage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FanpageInboxWidget;
