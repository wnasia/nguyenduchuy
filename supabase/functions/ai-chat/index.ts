import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const SYSTEM = `Bạn là "Trợ lý AI" của Huy Blogs / Web Nhanh — chuyên gia tư vấn:
- Thiết kế website (giới thiệu doanh nghiệp, bán hàng, landing page, blog), tên miền, hosting, bảo trì.
- Dịch vụ công nghệ thông tin cho doanh nghiệp nhỏ.
- Quảng cáo Google Ads và Facebook Ads (target, ngân sách, tối ưu chuyển đổi).
Trả lời bằng ngôn ngữ của khách (mặc định tiếng Việt), ngắn gọn, thân thiện, dùng markdown khi cần.
Không bịa giá cố định: nếu khách hỏi bảng giá, đưa khoảng tham khảo và mời liên hệ để báo giá chính xác.
Khuyến khích khách để lại email hoặc số Zalo/Telegram để được tư vấn viên liên hệ lại.
Kênh liên hệ duy nhất của chúng tôi: Telegram https://t.me/tkwni. Không đưa email hay số điện thoại của chúng tôi.`;

const Body = z.object({
  sessionId: z.string().uuid().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(8000),
  })).min(1).max(40),
});

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

function extractContacts(text: string) {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0]?.toLowerCase();
  const phone = text.match(/(?:\+?84|0)(?:[\s.-]?\d){8,10}/)?.[0]?.replace(/[\s.-]/g, '');
  const telegram = text.match(/(?:t\.me\/|@)([a-zA-Z][\w]{4,31})\b/)?.[1];
  return { email, phone, telegram: telegram && !email?.includes(telegram) ? telegram : undefined };
}

async function sendWelcomeEmail(to: string) {
  const user = Deno.env.get('SMTP_USER'), pass = Deno.env.get('SMTP_PASS');
  if (!user || !pass) return false;
  try {
    const { default: nodemailer } = await import('npm:nodemailer@6.9.16');
    const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 587, secure: false, auth: { user, pass } });
    await t.sendMail({
      from: `WebNhanh <${user}>`, to,
      subject: 'Cảm ơn bạn đã liên hệ Web Nhanh',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
        <div style="background:linear-gradient(90deg,#2563eb,#3b82f6);color:#fff;padding:20px;border-radius:12px 12px 0 0"><h2 style="margin:0">Web Nhanh</h2></div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 12px 12px;line-height:1.7">
        <p>Xin chào,</p><p>Cảm ơn bạn đã trò chuyện với trợ lý AI của chúng tôi. Tư vấn viên sẽ liên hệ lại bạn sớm nhất về nhu cầu thiết kế website / dịch vụ CNTT / quảng cáo.</p>
        <p>Cần hỗ trợ nhanh, bạn nhắn Telegram: <a href="https://t.me/tkwni">t.me/tkwni</a></p><p>Trân trọng,<br/>Web Nhanh</p></div></div>`,
    });
    return true;
  } catch (e) { console.error('email fail', (e as Error).message); return false; }
}

async function recordUser(sessionId: string, text: string) {
  const c = extractContacts(text);
  const { data: s } = await db.from('ai_chat_sessions').select('*').eq('id', sessionId).maybeSingle();
  const patch: Record<string, unknown> = {
    last_message: text.slice(0, 200), last_message_at: new Date().toISOString(),
    unread_count: (s?.unread_count ?? 0) + 1,
  };
  if (c.email) patch.contact_email = c.email;
  if (c.phone) patch.contact_phone = c.phone;
  if (c.telegram) patch.contact_telegram = c.telegram;
  if (s) await db.from('ai_chat_sessions').update(patch).eq('id', sessionId);
  else await db.from('ai_chat_sessions').insert({ id: sessionId, ...patch });
  await db.from('ai_chat_messages').insert({ session_id: sessionId, role: 'user', content: text });
  if (c.email && !s?.email_sent_at && await sendWelcomeEmail(c.email)) {
    await db.from('ai_chat_sessions').update({ email_sent_at: new Date().toISOString() }).eq('id', sessionId);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const err = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  let parsed;
  try { parsed = Body.safeParse(await req.json()); } catch { return err(400, 'Dữ liệu không hợp lệ.'); }
  if (!parsed.success) return err(400, 'Dữ liệu không hợp lệ.');
  const { sessionId, messages } = parsed.data;

  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return err(500, 'Chưa cấu hình AI.');

  const lastUser = messages[messages.length - 1];
  if (sessionId && lastUser.role === 'user') {
    recordUser(sessionId, lastUser.content).catch((e) => console.error('record user', e));
  }

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
      input: messages.map((m) => ({ role: m.role, content: m.content })),
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

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let full = '';
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
          if (ev.type === 'response.output_text.delta' && ev.delta) {
            full += ev.delta;
            ctrl.enqueue(encoder.encode(ev.delta));
          }
        } catch { /* ignore partial */ }
      }
    },
    async flush() {
      if (sessionId && full) {
        await db.from('ai_chat_messages').insert({ session_id: sessionId, role: 'assistant', content: full });
      }
    },
  }));

  const headers: Record<string, string> = { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' };
  upstream.headers.forEach((v, k) => { if (k.toLowerCase().startsWith('x-lovable-aig-')) headers[k] = v; });
  return new Response(stream, { headers });
});
