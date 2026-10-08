CREATE TABLE public.ai_chat_sessions (
  id uuid PRIMARY KEY,
  contact_email text,
  contact_phone text,
  contact_telegram text,
  email_sent_at timestamptz,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_chat_messages(session_id, created_at);
GRANT SELECT, UPDATE, DELETE ON public.ai_chat_sessions TO authenticated;
GRANT SELECT, DELETE ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_chat_sessions TO service_role;
GRANT ALL ON public.ai_chat_messages TO service_role;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai sessions" ON public.ai_chat_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage ai messages" ON public.ai_chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chat_sessions;