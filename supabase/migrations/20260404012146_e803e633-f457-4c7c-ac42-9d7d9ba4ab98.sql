
-- Add auth_user_id to customers for per-user data visibility
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON public.customers(auth_user_id);

-- Allow customer users to read their own customer record
CREATE POLICY "Customer users can view own record"
ON public.customers FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- Allow customer users to view their own renewal history
CREATE POLICY "Customer users can view own renewal history"
ON public.renewal_history FOR SELECT TO authenticated
USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

-- Allow customer users to view their own customer notes (if exposed)
CREATE POLICY "Customer users can view own notes"
ON public.customer_notes FOR SELECT TO authenticated
USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

-- Reminder rules table
CREATE TABLE public.reminder_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'both', -- hosting / domain / both
  days_before_expiry INTEGER NOT NULL,
  channel TEXT NOT NULL DEFAULT 'both', -- email / in_app / both
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  applies_to_all BOOLEAN NOT NULL DEFAULT true,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reminder rules"
ON public.reminder_rules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read enabled rules"
ON public.reminder_rules FOR SELECT TO authenticated
USING (is_enabled = true);

-- Seed default reminder rules
INSERT INTO public.reminder_rules (name, reminder_type, days_before_expiry, channel, is_default, is_enabled, applies_to_all)
VALUES
  ('Hosting 30-day reminder', 'hosting', 30, 'both', true, true, true),
  ('Hosting 7-day reminder', 'hosting', 7, 'both', true, true, true),
  ('Domain 30-day reminder', 'domain', 30, 'both', true, true, true),
  ('Domain 7-day reminder', 'domain', 7, 'both', true, true, true);

-- Notification deliveries table
CREATE TABLE public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'reminder', -- reminder / manual
  related_expiry_type TEXT NOT NULL, -- hosting / domain
  related_expiry_date DATE,
  reminder_rule_id UUID REFERENCES public.reminder_rules(id) ON DELETE SET NULL,
  channel TEXT NOT NULL, -- email / in_app
  title TEXT,
  message TEXT,
  send_status TEXT NOT NULL DEFAULT 'pending', -- pending / sent / failed
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification deliveries"
ON public.notification_deliveries FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customer users can view own deliveries"
ON public.notification_deliveries FOR SELECT TO authenticated
USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

CREATE INDEX idx_notification_deliveries_customer ON public.notification_deliveries(customer_id);
CREATE INDEX idx_notification_deliveries_rule ON public.notification_deliveries(reminder_rule_id);
-- Unique constraint to prevent duplicate sends for same customer+rule+expiry_date
CREATE UNIQUE INDEX idx_no_duplicate_delivery ON public.notification_deliveries(customer_id, reminder_rule_id, related_expiry_date, channel)
WHERE send_status != 'failed';

-- Reminder templates table
CREATE TABLE public.reminder_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE, -- e.g. hosting_30, domain_7
  subject TEXT NOT NULL,
  body_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reminder templates"
ON public.reminder_templates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read templates"
ON public.reminder_templates FOR SELECT TO authenticated
USING (true);

-- Seed default templates
INSERT INTO public.reminder_templates (template_key, subject, body_template)
VALUES
  ('hosting_30', 'Nhắc nhở: Hosting sắp hết hạn trong 30 ngày', 'Xin chào {{customer_name}}, Hosting cho website {{website_url}} của bạn sẽ hết hạn vào ngày {{hosting_expiry_date}} (còn {{days_remaining}} ngày). Vui lòng gia hạn sớm để tránh gián đoạn dịch vụ.'),
  ('hosting_7', '⚠️ KHẨN: Hosting hết hạn trong 7 ngày!', 'KHẨN CẤP: Xin chào {{customer_name}}, Hosting cho {{website_url}} sẽ hết hạn vào ngày {{hosting_expiry_date}} (chỉ còn {{days_remaining}} ngày)! Vui lòng gia hạn NGAY để tránh mất dữ liệu.'),
  ('domain_30', 'Nhắc nhở: Domain sắp hết hạn trong 30 ngày', 'Xin chào {{customer_name}}, Tên miền {{website_url}} của bạn sẽ hết hạn vào ngày {{domain_expiry_date}} (còn {{days_remaining}} ngày). Vui lòng gia hạn để giữ tên miền.'),
  ('domain_7', '⚠️ KHẨN: Domain hết hạn trong 7 ngày!', 'KHẨN CẤP: Xin chào {{customer_name}}, Tên miền {{website_url}} sẽ hết hạn vào ngày {{domain_expiry_date}} (chỉ còn {{days_remaining}} ngày)! Gia hạn ngay để tránh mất tên miền.');
