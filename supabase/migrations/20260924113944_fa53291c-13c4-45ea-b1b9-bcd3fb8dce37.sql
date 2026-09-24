CREATE TABLE public.fb_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  page_name text NOT NULL,
  access_token text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fb_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_ref uuid NOT NULL REFERENCES public.fb_pages(id) ON DELETE CASCADE,
  thread_type text NOT NULL DEFAULT 'message',
  thread_key text NOT NULL,
  customer_psid text,
  customer_name text,
  post_id text,
  last_message_text text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count integer NOT NULL DEFAULT 0,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_ref, thread_type, thread_key)
);

CREATE TABLE public.fb_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.fb_conversations(id) ON DELETE CASCADE,
  external_id text,
  direction text NOT NULL DEFAULT 'in',
  sender_name text,
  message text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, external_id)
);

CREATE INDEX idx_fb_conversations_last_msg ON public.fb_conversations (last_message_at DESC);
CREATE INDEX idx_fb_messages_conversation ON public.fb_messages (conversation_id, sent_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_pages TO authenticated;
GRANT ALL ON public.fb_pages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_conversations TO authenticated;
GRANT ALL ON public.fb_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fb_messages TO authenticated;
GRANT ALL ON public.fb_messages TO service_role;

ALTER TABLE public.fb_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fb_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage fb_pages" ON public.fb_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage fb_conversations" ON public.fb_conversations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage fb_messages" ON public.fb_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER fb_pages_updated_at BEFORE UPDATE ON public.fb_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER fb_conversations_updated_at BEFORE UPDATE ON public.fb_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.fb_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fb_messages;