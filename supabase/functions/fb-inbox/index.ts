import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GRAPH = 'https://graph.facebook.com/v21.0';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data } = await admin.auth.getUser(token);
  const user = data?.user;
  if (!user) return null;
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  return isAdmin ? user : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const user = await requireAdmin(req);
  if (!user) return json({ error: 'Chỉ admin mới sử dụng được tính năng này.' }, 403);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
  }

  const action = String(payload?.action ?? '');

  try {
    if (action === 'verify_page') {
      const token = String(payload?.access_token ?? '');
      if (!token) return json({ error: 'Thiếu Page Access Token.' }, 400);
      const res = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data?.error) return json({ error: data.error.message }, 400);
      // subscribe page to messages + feed
      const sub = await fetch(
        `${GRAPH}/${data.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${encodeURIComponent(token)}`,
        { method: 'POST' },
      );
      const subData = await sub.json();
      return json({
        success: true,
        page_id: data.id,
        page_name: data.name,
        subscribed: subData?.success === true,
        subscribe_error: subData?.error?.message ?? null,
      });
    }

    if (action === 'reply') {
      const conversationId = String(payload?.conversation_id ?? '');
      const message = String(payload?.message ?? '').trim();
      if (!conversationId || !message) return json({ error: 'Thiếu nội dung trả lời.' }, 400);

      const { data: conv } = await admin
        .from('fb_conversations')
        .select('id, thread_type, thread_key, customer_psid, page_ref, fb_pages(page_id, access_token, page_name)')
        .eq('id', conversationId)
        .maybeSingle();
      if (!conv) return json({ error: 'Không tìm thấy hội thoại.' }, 404);

      const page: any = conv.fb_pages;
      let res: Response;
      let external_id: string | null = null;

      if (conv.thread_type === 'message') {
        res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(page.access_token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: conv.customer_psid ?? conv.thread_key },
            messaging_type: 'RESPONSE',
            message: { text: message },
          }),
        });
        const data = await res.json();
        if (data?.error) return json({ error: data.error.message }, 400);
        external_id = data?.message_id ?? null;
      } else {
        // reply to the latest incoming comment of this post
        const { data: lastIn } = await admin
          .from('fb_messages')
          .select('external_id')
          .eq('conversation_id', conversationId)
          .eq('direction', 'in')
          .not('external_id', 'is', null)
          .order('sent_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const target = lastIn?.external_id ?? conv.thread_key;
        res = await fetch(`${GRAPH}/${target}/comments?access_token=${encodeURIComponent(page.access_token)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (data?.error) return json({ error: data.error.message }, 400);
        external_id = data?.id ?? null;
      }

      const sentAt = new Date().toISOString();
      await admin.from('fb_messages').insert({
        conversation_id: conversationId,
        external_id,
        direction: 'out',
        sender_name: page.page_name,
        message,
        sent_at: sentAt,
      });
      await admin
        .from('fb_conversations')
        .update({ last_message_text: message, last_message_at: sentAt, unread_count: 0 })
        .eq('id', conversationId);

      return json({ success: true });
    }

    if (action === 'sync') {
      const pageRef = payload?.page_ref ? String(payload.page_ref) : null;
      let query = admin.from('fb_pages').select('id, page_id, page_name, access_token').eq('is_active', true);
      if (pageRef) query = query.eq('id', pageRef);
      const { data: pages } = await query;
      let imported = 0;

      for (const page of pages ?? []) {
        const res = await fetch(
          `${GRAPH}/${page.page_id}/conversations?fields=participants,updated_time,messages.limit(20){id,message,from,created_time}&limit=25&access_token=${encodeURIComponent(page.access_token)}`,
        );
        const data = await res.json();
        if (data?.error) continue;

        for (const conv of data?.data ?? []) {
          const participant = (conv.participants?.data ?? []).find((p: any) => p.id !== page.page_id);
          if (!participant) continue;
          const messages = (conv.messages?.data ?? []).slice().reverse();
          const last = messages[messages.length - 1];

          const { data: existing } = await admin
            .from('fb_conversations')
            .select('id')
            .eq('page_ref', page.id)
            .eq('thread_type', 'message')
            .eq('thread_key', participant.id)
            .maybeSingle();

          let convId = existing?.id as string | undefined;
          if (!convId) {
            const { data: created } = await admin
              .from('fb_conversations')
              .insert({
                page_ref: page.id,
                thread_type: 'message',
                thread_key: participant.id,
                customer_psid: participant.id,
                customer_name: participant.name ?? null,
                last_message_text: last?.message ?? '',
                last_message_at: last?.created_time ?? conv.updated_time ?? new Date().toISOString(),
              })
              .select('id')
              .single();
            convId = created?.id;
          } else {
            await admin
              .from('fb_conversations')
              .update({
                customer_name: participant.name ?? null,
                last_message_text: last?.message ?? '',
                last_message_at: last?.created_time ?? conv.updated_time,
              })
              .eq('id', convId);
          }
          if (!convId) continue;

          for (const m of messages) {
            const fromPage = m.from?.id === page.page_id;
            const { error } = await admin.from('fb_messages').upsert(
              {
                conversation_id: convId,
                external_id: m.id,
                direction: fromPage ? 'out' : 'in',
                sender_name: m.from?.name ?? null,
                message: m.message ?? '',
                sent_at: m.created_time ?? new Date().toISOString(),
              },
              { onConflict: 'conversation_id,external_id', ignoreDuplicates: true },
            );
            if (!error) imported++;
          }
        }
      }

      return json({ success: true, imported });
    }

    return json({ error: 'Hành động không hợp lệ.' }, 400);
  } catch (e) {
    console.error('fb-inbox error', e);
    return json({ error: e instanceof Error ? e.message : 'Lỗi không xác định' }, 500);
  }
});
