import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GRAPH = 'https://graph.facebook.com/v21.0';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function getPage(pageId: string) {
  const { data } = await admin
    .from('fb_pages')
    .select('id, page_id, page_name, access_token, is_active')
    .eq('page_id', pageId)
    .maybeSingle();
  return data;
}

async function fetchProfileName(psid: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH}/${psid}?fields=name&access_token=${encodeURIComponent(token)}`);
    const json = await res.json();
    return json?.name ?? null;
  } catch {
    return null;
  }
}

async function upsertThread(opts: {
  pageRef: string;
  threadType: 'message' | 'comment';
  threadKey: string;
  customerPsid?: string | null;
  customerName?: string | null;
  postId?: string | null;
  text: string;
  sentAt: string;
  direction: 'in' | 'out';
  externalId?: string | null;
  senderName?: string | null;
  attachments?: unknown[];
}) {
  const { data: existing } = await admin
    .from('fb_conversations')
    .select('id, unread_count')
    .eq('page_ref', opts.pageRef)
    .eq('thread_type', opts.threadType)
    .eq('thread_key', opts.threadKey)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;

  if (conversationId) {
    await admin
      .from('fb_conversations')
      .update({
        customer_name: opts.customerName ?? undefined,
        customer_psid: opts.customerPsid ?? undefined,
        post_id: opts.postId ?? undefined,
        last_message_text: opts.text,
        last_message_at: opts.sentAt,
        unread_count:
          opts.direction === 'in' ? (existing?.unread_count ?? 0) + 1 : existing?.unread_count ?? 0,
        is_resolved: opts.direction === 'in' ? false : undefined,
      })
      .eq('id', conversationId);
  } else {
    const { data: created, error } = await admin
      .from('fb_conversations')
      .insert({
        page_ref: opts.pageRef,
        thread_type: opts.threadType,
        thread_key: opts.threadKey,
        customer_psid: opts.customerPsid ?? null,
        customer_name: opts.customerName ?? null,
        post_id: opts.postId ?? null,
        last_message_text: opts.text,
        last_message_at: opts.sentAt,
        unread_count: opts.direction === 'in' ? 1 : 0,
      })
      .select('id')
      .single();
    if (error) throw error;
    conversationId = created.id;
  }

  await admin.from('fb_messages').upsert(
    {
      conversation_id: conversationId,
      external_id: opts.externalId ?? null,
      direction: opts.direction,
      sender_name: opts.senderName ?? null,
      message: opts.text,
      attachments: opts.attachments ?? [],
      sent_at: opts.sentAt,
    },
    { onConflict: 'conversation_id,external_id', ignoreDuplicates: true },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);

  // Facebook webhook verification handshake
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge') ?? '';
    const expected = Deno.env.get('FB_VERIFY_TOKEN');
    if (mode === 'subscribe' && expected && token === expected) {
      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response('forbidden', { status: 403 });
  }

  try {
    const body = await req.json();
    const entries = Array.isArray(body?.entry) ? body.entry : [];

    for (const entry of entries) {
      const pageId = String(entry.id ?? '');
      const page = await getPage(pageId);
      if (!page || !page.is_active) continue;

      // Messenger inbox
      for (const evt of entry.messaging ?? []) {
        if (!evt.message) continue;
        const senderId = String(evt.sender?.id ?? '');
        const recipientId = String(evt.recipient?.id ?? '');
        const isEcho = Boolean(evt.message?.is_echo) || senderId === pageId;
        const psid = isEcho ? recipientId : senderId;
        const sentAt = new Date(Number(evt.timestamp ?? Date.now())).toISOString();
        const name = isEcho ? page.page_name : await fetchProfileName(psid, page.access_token);

        await upsertThread({
          pageRef: page.id,
          threadType: 'message',
          threadKey: psid,
          customerPsid: psid,
          customerName: isEcho ? undefined : name,
          text: evt.message?.text ?? '[Tệp đính kèm]',
          sentAt,
          direction: isEcho ? 'out' : 'in',
          externalId: evt.message?.mid ?? null,
          senderName: name,
          attachments: evt.message?.attachments ?? [],
        });
      }

      // Page feed comments
      for (const change of entry.changes ?? []) {
        if (change.field !== 'feed') continue;
        const v = change.value ?? {};
        if (v.item !== 'comment' || v.verb === 'remove') continue;
        const fromId = String(v.from?.id ?? '');
        const isPageAuthor = fromId === pageId;
        const postId = String(v.post_id ?? '');
        const sentAt = v.created_time
          ? new Date(Number(v.created_time) * 1000).toISOString()
          : new Date().toISOString();

        await upsertThread({
          pageRef: page.id,
          threadType: 'comment',
          threadKey: postId,
          customerName: isPageAuthor ? undefined : v.from?.name ?? null,
          postId,
          text: v.message ?? '[Bình luận không có nội dung]',
          sentAt,
          direction: isPageAuthor ? 'out' : 'in',
          externalId: v.comment_id ?? null,
          senderName: v.from?.name ?? null,
        });
      }
    }

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (e) {
    console.error('fb-webhook error', e);
    return new Response('EVENT_RECEIVED', { status: 200 });
  }
});
