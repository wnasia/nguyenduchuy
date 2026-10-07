// Endpoint can be overridden (e.g. a self-hosted FastAPI/Ollama server) via VITE_CHAT_API_URL.
// Expected contract: POST { messages:[{role,content}], stream:true } -> text stream of answer chunks.
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export const chatConfig = {
  apiUrl: (import.meta.env.VITE_CHAT_API_URL as string | undefined) ||
    `https://${projectId}.supabase.co/functions/v1/ai-chat`,
  apiKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined,
  botName: "Trợ lý AI",
  storageKey: "huy-chatbot-history",
  welcome:
    "Xin chào! 👋 Mình là trợ lý AI. Mình có thể tư vấn **thiết kế website**, **dịch vụ công nghệ thông tin** và **quảng cáo Google / Facebook**. Bạn cần hỗ trợ gì?",
  suggestions: ["Tư vấn dịch vụ", "Bảng giá", "Liên hệ hỗ trợ"],
};

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; error?: boolean };
