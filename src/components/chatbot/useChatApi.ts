import { useCallback, useEffect, useRef, useState } from "react";
import { chatConfig, type ChatMessage } from "./chatConfig";

const uid = () => Math.random().toString(36).slice(2);
const SID_KEY = "huy-chatbot-session";
const getSessionId = () => {
  let s = localStorage.getItem(SID_KEY);
  if (!s) { s = crypto.randomUUID(); localStorage.setItem(SID_KEY, s); }
  return s;
};

const load = (): ChatMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(chatConfig.storageKey) || "[]");
  } catch {
    return [];
  }
};

export function useChatApi() {
  const [messages, setMessages] = useState<ChatMessage[]>(load);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(chatConfig.storageKey, JSON.stringify(messages.filter((m) => m.content)));
  }, [messages]);

  const run = useCallback(async (history: ChatMessage[]) => {
    const botId = uid();
    setMessages([...history, { id: botId, role: "assistant", content: "" }]);
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let text = "";
    try {
      const res = await fetch(chatConfig.apiUrl, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(chatConfig.apiKey ? { Authorization: `Bearer ${chatConfig.apiKey}`, apikey: chatConfig.apiKey } : {}),
        },
        body: JSON.stringify({
          sessionId: getSessionId(),
          messages: history.filter((m) => !m.error && m.content).slice(-20).map(({ role, content }) => ({ role, content })),
          stream: true,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không kết nối được trợ lý.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, content: text } : m)));
      }
      if (!text) throw new Error("Trợ lý chưa trả lời được, vui lòng thử lại.");
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setMessages((prev) => prev.filter((m) => m.id !== botId || m.content));
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: text || (e as Error).message, error: !text } : m)),
        );
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  const send = useCallback(
    (content: string) => {
      const t = content.trim();
      if (!t || loading) return;
      run([...messages.filter((m) => !m.error), { id: uid(), role: "user", content: t }]);
    },
    [messages, loading, run],
  );

  const retry = useCallback(() => run(messages.filter((m) => !m.error)), [messages, run]);
  const stop = useCallback(() => abortRef.current?.abort(), []);
  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return { messages, loading, send, retry, stop, clear };
}
