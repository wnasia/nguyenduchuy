ALTER TABLE public.fb_pages ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "Assigned staff can view their pages"
ON public.fb_pages FOR SELECT TO authenticated
USING (assigned_user_id = auth.uid());

CREATE POLICY "Assigned staff can view their conversations"
ON public.fb_conversations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.fb_pages p
  WHERE p.id = page_ref AND p.assigned_user_id = auth.uid()
));

CREATE POLICY "Assigned staff can update their conversations"
ON public.fb_conversations FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.fb_pages p
  WHERE p.id = page_ref AND p.assigned_user_id = auth.uid()
));

CREATE POLICY "Assigned staff can view their messages"
ON public.fb_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.fb_conversations c
  JOIN public.fb_pages p ON p.id = c.page_ref
  WHERE c.id = conversation_id AND p.assigned_user_id = auth.uid()
));