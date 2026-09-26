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

  // realtime updates
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("fanpage-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "fb_conversations" }, () => {
        loadConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "fb_messages" }, (payload) => {
        const row = payload.new as { conversation_id: string };
        if (row.conversation_id === activeId) loadMessages(activeId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, activeId, loadConversations, loadMessages]);

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          <button
            onClick={() => setActivePageFilter("all")}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              activePageFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Tất cả
          </button>
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePageFilter(p.id)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors truncate max-w-[180px] ${
                activePageFilter === p.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.page_name}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || pages.length === 0}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Tải tin nhắn</span>
        </Button>

        <Button variant="outline" size="sm" onClick={handleDiagnose} disabled={checking || pages.length === 0}>
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Kiểm tra kết nối</span>
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Thêm fanpage</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Kết nối fanpage</DialogTitle>
              <DialogDescription>
                Dán Page Access Token của fanpage. Hệ thống sẽ tự nhận tên trang và bật nhận tin nhắn,
                bình luận mới.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="EAAG..."
              className="font-mono text-xs"
            />
            <Button onClick={handleAddPage} disabled={addingPage || !tokenInput.trim()}>
              {addingPage && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Kết nối
            </Button>

            {pages.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Settings2 className="h-3.5 w-3.5" /> Fanpage đã kết nối
                </div>
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

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-14 text-center">
          <MessagesSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Chưa có fanpage nào</p>
          <p className="text-sm text-muted-foreground mt-1">
            Bấm “Thêm fanpage” và dán Page Access Token để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Conversation list */}
          <div className="rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                Chưa có hội thoại nào.
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    c.id === activeId ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] truncate flex-1">
                      {c.customer_name || "Khách"}
                    </span>
                    {c.unread_count > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 justify-center">{c.unread_count}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="truncate">{pageName(c.page_ref)}</span>
                    <span>·</span>
                    <span>{c.thread_type === "comment" ? "Bình luận" : "Tin nhắn"}</span>
                    <span>·</span>
                    <span>{timeAgo(c.last_message_at)}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground truncate mt-1">
                    {c.last_message_text}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Thread */}
          <div className="rounded-2xl border border-border/60 flex flex-col min-h-[420px]">
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-16">
                <MessageSquare className="h-7 w-7" />
                <p className="text-sm">Chọn một hội thoại để trả lời</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border/60">
                  <p className="font-semibold">{active.customer_name || "Khách"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {pageName(active.page_ref)} ·{" "}
                    {active.thread_type === "comment" ? "Bình luận bài viết" : "Messenger"}
                  </p>
                </div>

                <div className="flex-1 p-4 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                          m.direction === "out"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}
                      >
                        {m.message}
                        <div
                          className={`text-[10px] mt-1 ${
                            m.direction === "out" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {new Date(m.sent_at).toLocaleString("vi-VN")}
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
                    placeholder="Nhập câu trả lời..."
                    rows={2}
                    className="resize-none text-[15px]"
                  />
                  <Button onClick={handleReply} disabled={sending || !reply.trim()} className="h-10">
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
