
-- Customer internal notes / care logs
CREATE TABLE public.customer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage customer notes"
ON public.customer_notes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_customer_notes_customer ON public.customer_notes(customer_id);

-- Renewal history
CREATE TABLE public.renewal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  renewal_type TEXT NOT NULL, -- 'hosting' or 'domain'
  old_expiry_date DATE,
  new_expiry_date DATE NOT NULL,
  amount NUMERIC DEFAULT 0,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.renewal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage renewal history"
ON public.renewal_history
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_renewal_history_customer ON public.renewal_history(customer_id);
