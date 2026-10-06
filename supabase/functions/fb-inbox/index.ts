import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

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

const PayloadSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('verify_page'), access_token: z.string().trim().min(20).max(2000) }),
  z.object({ action: z.literal('reply'), conversation_id: z.string().uuid(), message: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal('delete_message'), message_id: z.string().uuid() }),
  z.object({ action: z.literal('sync'), page_ref: z.string().uuid().optional() }),
  z.object({ action: z.literal('diagnose'), page_ref: z.string().uuid().optional() }),
]);

const SUBSCRIBED_FIELDS = 'messages,messaging_postbacks,message_echoes,feed';

async function subscribePage(pageId: string, token: string) {
  const response = await fetch(
    `${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=${SUBSCRIBED_FIELDS}&access_token=${encodeURIComponent(token)}`,
    { method: 'POST' },
  );
  const data = await response.json();
  return { ok: response.ok && data?.success === true, data };
}

async function inspectPage(pageId: string, token: string) {
  const [identityResponse, subscriptionsResponse, conversationsResponse] = await Promise.all([
    fetch(`${GRAPH}/${pageId}?fields=id,name&access_token=${encodeURIComponent(token)}`),
    fetch(`${GRAPH}/${pageId}/subscribed_apps?fields=id,name,subscribed_fields&access_token=${encodeURIComponent(token)}`),
    fetch(`${GRAPH}/${pageId}/conversations?limit=1&access_token=${encodeURIComponent(token)}`),
  ]);
  const [identity, subscriptions, conversations] = await Promise.all([
    identityResponse.json(),
    subscriptionsResponse.json(),
    conversationsResponse.json(),
  ]);
  return {
    token_valid: identityResponse.ok && !identity?.error,
    identity,
    subscriptions,
    conversations_access: conversationsResponse.ok && !conversations?.error,
    conversations_error: conversations?.error?.message ?? null,
  };
}

async function requireStaff(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data } = await admin.auth.getUser(token);
  const user = data?.user;
  if (!user) return null;
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  return { user, isAdmin: !!isAdmin };
}

// Staff (non-admin) may only touch pages assigned to them.
async function canAccessPage(userId: string, isAdmin: boolean, pageRef?: string | null, conversationId?: string | null) {
  if (isAdmin) return true;
  if (pageRef) {
    const { data } = await admin.from('fb_pages').select('id').eq('id', pageRef).eq('assigned_user_id', userId).maybeSingle();
    return !!data;
  }
  if (conversationId) {
    const { data } = await admin.from('fb_conversations').select('id, fb_pages!inner(assigned_user_id)').eq('id', conversationId).maybeSingle();
    return (data as any)?.fb_pages?.assigned_user_id === userId;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await requireStaff(req);
  if (!auth) return json({ error: 'Bạn cần đăng nhập để sử dụng tính năng này.' }, 403);
  const { user, isAdmin } = auth;

  let rawPayload: unknown;
  try {
    rawPayload = await req.json();
  } catch {
    return json({ error: 'Dữ liệu không hợp lệ.' }, 400);
  }
  const parsed = PayloadSchema.safeParse(rawPayload);
  if (!parsed.success) return json({ error: 'Dữ liệu yêu cầu không hợp lệ.' }, 400);
  const payload = parsed.data;
  const action = payload.action;

  try {
    if (action === 'verify_page') {
      if (!isAdmin) return json({ error: 'Chỉ admin mới thêm được fanpage.' }, 403);
      const token = payload.access_token;
      const res = await fetch(`${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data?.error) return json({ error: data.error.message }, 400);
      // subscribe page to messages + feed
      const subscription = await subscribePage(data.id, token);
      return json({
        success: true,
        page_id: data.id,
        page_name: data.name,
        subscribed: subscription.ok,
        subscribe_error: subscription.data?.error?.message ?? null,
      });
    }

    if (action === 'diagnose') {
      if (!isAdmin) return json({ error: 'Chỉ admin mới dùng được chẩn đoán.' }, 403);
      let query = admin.from('fb_pages').select('id, page_id, page_name, access_token').eq('is_active', true);
      if (payload.page_ref) query = query.eq('id', payload.page_ref);
      const { data: pages, error } = await query;
      if (error) throw error;

      const results = [];
      for (const page of pages ?? []) {
        const subscription = await subscribePage(page.page_id, page.access_token);
        const inspection = await inspectPage(page.page_id, page.access_token);
        console.log('fb-page-diagnostic', JSON.stringify({
          page_id: page.page_id,
          subscribed: subscription.ok,
          token_valid: inspection.token_valid,
          conversations_access: inspection.conversations_access,
          subscriptions: inspection.subscriptions?.data?.map((item: { subscribed_fields?: string[] }) => item.subscribed_fields) ?? [],
        }));
        results.push({
          page_ref: page.id,
          page_name: page.page_name,
          subscribed: subscription.ok,
          subscribe_error: subscription.data?.error?.message ?? null,
          ...inspection,
        });
      }
      return json({ success: true, results });
    }

    if (action === 'reply') {
      const conversationId = String(payload?.conversation_id ?? '');
      const message = String(payload?.message ?? '').trim();
      if (!conversationId || !message) return json({ error: 'Thiếu nội dung trả lời.' }, 400);
      if (!(await canAccessPage(user.id, isAdmin, null, conversationId))) {
        return json({ error: 'Bạn không được phân bổ quản lý fanpage này.' }, 403);
      }

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
        const { data: lastIncoming } = await admin.from('fb_messages')
          .select('sent_at').eq('conversation_id', conversationId).eq('direction', 'in')
          .order('sent_at', { ascending: false }).limit(1).maybeSingle();
        const elapsed = lastIncoming ? Date.now() - new Date(lastIncoming.sent_at).getTime() : null;
        const hours24 = 24 * 60 * 60 * 1000;
        const days7 = 7 * hours24;
        if (elapsed !== null && elapsed >= days7) {
          return json({ error: 'Tin nhắn cuối của khách đã quá 7 ngày. Facebook không cho phép trả lời hội thoại này qua ứng dụng; hãy liên hệ qua kênh khác hoặc chờ khách nhắn lại.' }, 400);
        }
        const sendMessage = async (humanAgent: boolean) => {
          const response = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(page.access_token)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: conv.customer_psid ?? conv.thread_key },
              messaging_type: humanAgent ? 'MESSAGE_TAG' : 'RESPONSE',
              ...(humanAgent ? { tag: 'HUMAN_AGENT' } : {}),
              message: { text: message },
            }),
          });
          return { response, data: await response.json() };
        };
        const outsideWindow = elapsed !== null && elapsed >= hours24;
        let sent = await sendMessage(outsideWindow);
        // A fresh message can be missed by sync; let Meta decide before trying the human-agent tag.
        if (sent.data?.error && !outsideWindow && elapsed !== null && elapsed < days7 &&
            (sent.data.error.code === 10 || sent.data.error.error_subcode === 2018278)) {
          sent = await sendMessage(true);
        }
        if (!sent.response.ok || sent.data?.error) {
          const metaCode = sent.data?.error?.code;
          if (outsideWindow || metaCode === 10) {
            // Check whether the page actually holds the HUMAN_AGENT feature so the
            // guidance points at the real fix instead of a generic window error.
            let humanAgentGranted: boolean | null = null;
            try {
              const review = await fetch(
                `${GRAPH}/me/messaging_feature_review?access_token=${encodeURIComponent(page.access_token)}`,
              );
              const reviewData = await review.json();
              const features = reviewData?.data ?? [];
              humanAgentGranted = features.some(
                (f: { feature?: string; status?: string; allowed?: boolean }) =>
                  f?.feature === 'HUMAN_AGENT' && (f?.status === 'granted' || f?.allowed === true),
              );
            } catch {
              humanAgentGranted = null;
            }
            return json({
              error: humanAgentGranted === false
                ? 'Trang chưa có quyền HUMAN_AGENT. Facebook chỉ cho phép trả lời trong 24 giờ; để trả lời tới 7 ngày, hãy đăng ký quyền HUMAN_AGENT cho ứng dụng trong Meta App Review (developers.facebook.com).'
                : 'Facebook không cho phép trả lời tin cũ. Trang cần quyền HUMAN_AGENT (tối đa 7 ngày, đăng ký trong Meta App Review); quá 7 ngày phải chờ khách nhắn lại.',
            }, 400);
          }
          return json({ error: sent.data?.error?.message ?? 'Facebook không nhận được tin nhắn.' }, 400);
        }
        external_id = sent.data?.message_id ?? null;
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

    if (action === 'delete_message') {
      const { data: msg } = await admin
        .from('fb_messages')
        .select('id, external_id, direction, conversation_id, fb_conversations(thread_type, fb_pages(page_id, access_token, page_name))')
        .eq('id', payload.message_id)
        .maybeSingle();
      if (!msg) return json({ error: 'Không tìm thấy tin nhắn.' }, 404);
      if (!(await canAccessPage(user.id, isAdmin, null, msg.conversation_id))) {
        return json({ error: 'Bạn không được phân bổ quản lý fanpage này.' }, 403);
      }

      const conv: any = msg.fb_conversations;
      const page: any = conv?.fb_pages;
      let facebookDeleted = false;
      let note: string | null = null;

      if (msg.external_id && conv?.thread_type === 'comment' && page?.access_token) {
        // Comments are moderated by the page — delete on Facebook too.
        const res = await fetch(
          `${GRAPH}/${msg.external_id}?access_token=${encodeURIComponent(page.access_token)}`,
          { method: 'DELETE' },
        );
        const data = await res.json();
        if (data?.error) {
          return json({ error: `Facebook không cho phép xóa bình luận này: ${data.error.message ?? 'lỗi không xác định'}` }, 400);
        }
        facebookDeleted = true;
      } else if (conv?.thread_type === 'message') {
        // Meta's Messenger API has no message-delete endpoint; removal stays local.
        note = 'Facebook không cho phép xóa tin Messenger qua ứng dụng. Tin đã được xóa khỏi hộp thư tại đây, nhưng vẫn còn trên Messenger.';
      }

      const { error: delError } = await admin.from('fb_messages').delete().eq('id', msg.id);
      if (delError) throw delError;

      // Keep the conversation preview in sync with what is left.
      const { data: remaining } = await admin
        .from('fb_messages')
        .select('message, sent_at')
        .eq('conversation_id', msg.conversation_id)
        .order('sent_at', { ascending: false })
        .limit(1);
      const lastRow = remaining?.[0];
      if (lastRow) {
        await admin.from('fb_conversations')
          .update({ last_message_text: lastRow.message ?? '', last_message_at: lastRow.sent_at })
          .eq('id', msg.conversation_id);
      } else {
        await admin.from('fb_conversations').delete().eq('id', msg.conversation_id);
      }

      return json({ success: true, facebook_deleted: facebookDeleted, note });
    }

    if (action === 'sync') {
      const pageRef = payload.page_ref ?? null;
      if (pageRef && !(await canAccessPage(user.id, isAdmin, pageRef))) {
        return json({ error: 'Bạn không được phân bổ quản lý fanpage này.' }, 403);
      }
      let query = admin.from('fb_pages').select('id, page_id, page_name, access_token').eq('is_active', true);
      if (pageRef) query = query.eq('id', pageRef);
      if (!isAdmin) query = query.eq('assigned_user_id', user.id);
      const { data: pages } = await query;
      let imported = 0;
      const errors: Array<{ page_name: string; error: string }> = [];

      for (const page of pages ?? []) {
        const res = await fetch(
          `${GRAPH}/${page.page_id}/conversations?fields=participants,updated_time,messages.limit(20){id,message,from,created_time}&limit=25&access_token=${encodeURIComponent(page.access_token)}`,
        );
        const data = await res.json();
        if (data?.error) {
          const code = data.error.code;
          const friendly = code === 190
            ? 'Mã truy cập đã hết hạn hoặc bị thu hồi — hãy gỡ fanpage này và kết nối lại bằng token mới.'
            : (data.error.message ?? 'Facebook từ chối truy cập hội thoại.');
          errors.push({ page_name: page.page_name, error: friendly });
          continue;
        }

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

      if (errors.length > 0 && imported === 0) {
        return json({ error: errors.map((item) => `${item.page_name}: ${item.error}`).join(' | '), errors }, 400);
      }
      return json({ success: true, imported, errors });
    }

    return json({ error: 'Hành động không hợp lệ.' }, 400);
  } catch (e) {
    console.error('fb-inbox error', e);
    return json({ error: e instanceof Error ? e.message : 'Lỗi không xác định' }, 500);
  }
});
