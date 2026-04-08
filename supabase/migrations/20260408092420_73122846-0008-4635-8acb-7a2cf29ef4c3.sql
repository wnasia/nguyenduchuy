ALTER TABLE public.customers
ADD COLUMN hosting_price numeric DEFAULT 0,
ADD COLUMN domain_price numeric DEFAULT 0,
ADD COLUMN tax_rate numeric DEFAULT 10;