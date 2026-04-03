
-- Create customers table for admin CRM
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  services TEXT[] DEFAULT '{}',
  website_url TEXT,
  hosting_provider TEXT,
  hosting_expiry_date DATE,
  domain_provider_info TEXT,
  domain_expiry_date DATE,
  notes TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage customers"
ON public.customers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for search and filtering
CREATE INDEX idx_customers_name ON public.customers(customer_name);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_hosting_expiry ON public.customers(hosting_expiry_date);
CREATE INDEX idx_customers_domain_expiry ON public.customers(domain_expiry_date);
CREATE INDEX idx_customers_is_active ON public.customers(is_active);
