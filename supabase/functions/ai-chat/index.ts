import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const SYSTEM = `Bạn là "Trợ lý AI" của Huy Blogs / Web Nhanh — chuyên gia tư vấn:
- Thiết kế website (giới thiệu doanh nghiệp, bán hàng, landing page, blog), tên miền, hosting, bảo trì.
- Dịch vụ công nghệ thông tin cho doanh nghiệp nhỏ.
- Quảng cáo Google Ads và Facebook Ads (target, ngân sách, tối ưu chuyển đổi).
Trả lời bằng ngôn ngữ của khách (mặc định tiếng Việt), ngắn gọn, thân thiện, dùng markdown khi cần.
Không bịa giá cố định: nếu khách hỏi bảng giá, đưa khoảng tham khảo và mời liên hệ để báo giá chính xác.
Kênh liên hệ duy nhất: Telegram https://t.me/tkwni. Không đưa email hay số điện thoại.`;

const Body = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(8000),
  })).min(1).max(40),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const err = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  let parsed;
  try { parsed = Body.safeParse(await req.json()); } catch { return err(400, 'Dữ liệu không hợp lệ.'); }
  if (!parsed.success) return err(400, 'Dữ liệu không hợp lệ.');

  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return err(500, 'Chưa cấu hình AI.');

  const upstream = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
    method: 'POST',
    signal: req.signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Lovable-API-Key': key,
      'X-Lovable-AIG-SDK': 'fetch',
    },
    body: JSON.stringify({
      model: 'openai/gpt-6-astra',
      instructions: SYSTEM,
      input: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
      reasoning: { effort: 'low' },
      store: false,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    console.error('ai-chat upstream', upstream.status, text.slice(0, 500));
    const msg = upstream.status === 429 ? 'Hệ thống đang bận, thử lại sau ít giây.'
      : upstream.status === 402 || upstream.status === 403 ? 'Trợ lý AI tạm hết hạn mức sử dụng.'
      : 'Không kết nối được trợ lý AI.';
    return err(upstream.status, msg);
  }

  // Convert Responses SSE into a plain text stream of deltas.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  const stream = upstream.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctrl) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const ev = JSON.parse(data);
          if (ev.type === 'response.output_text.delta' && ev.delta) ctrl.enqueue(encoder.encode(ev.delta));
        } catch { /* ignore partial */ }
      }
    },
  }));

  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' };
  upstream.headers.forEach((v, k) => { if (k.toLowerCase().startsWith('x-lovable-aig-')) headers[k] = v; });
  return new Response(stream, { headers });
});
