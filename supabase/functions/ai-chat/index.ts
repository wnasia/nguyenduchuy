import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { buildWelcomeEmail } from '../_shared/email-template.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const SYSTEM = `Bạn là "Trợ lý AI" của Huy Blogs / Web Nhanh — chuyên gia tư vấn:
- Thiết kế website (giới thiệu doanh nghiệp, bán hàng, landing page, blog), tên miền, hosting, bảo trì.
- Dịch vụ công nghệ thông tin cho doanh nghiệp nhỏ.
- Quảng cáo Google Ads và Facebook Ads (target, ngân sách, tối ưu chuyển đổi).
Trả lời bằng ngôn ngữ của khách (mặc định tiếng Việt), ngắn gọn, thân thiện, dùng markdown khi cần.
Không bịa giá cố định: nếu khách hỏi bảng giá, đưa khoảng tham khảo và mời liên hệ để báo giá chính xác.
Quan trọng về email: khi khách để lại địa chỉ email trong tin nhắn, hệ thống sẽ TỰ ĐỘNG gửi ngay một email xác nhận đến địa chỉ đó, và tư vấn viên sẽ chủ động liên hệ lại. Vì vậy KHÔNG BAO GIỜ nói rằng bạn "chưa thể gửi email" hay "không gửi được yêu cầu từ cuộc chat" — hãy xác nhận: "Hệ thống đã tự động gửi email xác nhận đến địa chỉ anh/chị để lại, tư vấn viên sẽ liên hệ trong thời gian sớm nhất."
KHÔNG TỰ BỊA hay đưa ra bất kỳ địa chỉ email nào của bên mình (kể cả khi khách yêu cầu gửi qua email nào đó — chỉ xác nhận email xác nhận tự động sẽ đến hộp thư khách đã nêu). Kênh liên hệ chính thức duy nhất: Zalo 0918795578 và Telegram https://t.me/tkwni. Không kênh nào khác.
Không nhại lại nguyên văn yêu cầu của khách thành khối trích dẫn; hãy trả lời trực tiếp.`;

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
      html: buildWelcomeEmail(),
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
  const lastSent = s?.email_sent_at ? new Date(s.email_sent_at).getTime() : 0;
  const canSend = !lastSent || Date.now() - lastSent > 24 * 60 * 60 * 1000;
  if (c.email && canSend && await sendWelcomeEmail(c.email)) {
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
