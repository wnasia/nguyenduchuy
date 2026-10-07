import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { MessageCircle, Minus, RotateCcw, Send, Square, Trash2, X } from "lucide-react";
import { chatConfig } from "./chatConfig";
import { useChatApi } from "./useChatApi";
import { cn } from "@/lib/utils";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, loading, send, retry, stop, clear } = useChatApi();
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    if (open) taRef.current?.focus();
  }, [open, loading]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const submit = (text = input) => {
    if (!text.trim() || loading) return;
    send(text);
    setInput("");
  };

  const last = messages[messages.length - 1];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Mở trợ lý AI"
          className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground shadow-lg transition-transform hover:scale-110"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          <MessageCircle className="relative h-6 w-6" />
          <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-card text-card-foreground sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl">
          <div className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-primary to-blue-500 px-4 py-3 text-primary-foreground">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20 font-bold">
              H
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-primary bg-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{chatConfig.botName}</p>
              <p className="text-xs opacity-80">Đang trực tuyến</p>
            </div>
            <button onClick={clear} aria-label="Xóa lịch sử" className="rounded p-1.5 hover:bg-primary-foreground/20">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} aria-label="Thu nhỏ" className="hidden rounded p-1.5 hover:bg-primary-foreground/20 sm:block">
              <Minus className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} aria-label="Đóng" className="rounded p-1.5 hover:bg-primary-foreground/20">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-muted/30 p-4">
            <Bubble role="assistant" content={chatConfig.welcome} />
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {chatConfig.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border border-primary/40 bg-background px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m) =>
              m.role === "assistant" && !m.content ? (
                <div key={m.id} className="flex gap-1 px-2 py-3">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              ) : (
                <Bubble key={m.id} role={m.role} content={m.content} error={m.error} />
              ),
            )}
            {last?.error && !loading && (
              <button onClick={retry} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <RotateCcw className="h-3.5 w-3.5" /> Thử lại
              </button>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-card p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Nhập câu hỏi..."
                className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {loading ? (
                <button onClick={stop} aria-label="Dừng" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <Square className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => submit()}
                  disabled={!input.trim()}
                  aria-label="Gửi"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Enter để gửi · Shift+Enter xuống dòng</p>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ role, content, error }: { role: "user" | "assistant"; content: string; error?: boolean }) {
  const mine = role === "user";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-border bg-background",
          error && "border-destructive/50 text-destructive",
        )}
      >
        {mine ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-pre:my-2 prose-pre:p-0 prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}
              components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
