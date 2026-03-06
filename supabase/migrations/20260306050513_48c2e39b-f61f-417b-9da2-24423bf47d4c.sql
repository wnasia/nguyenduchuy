
-- Add unique constraint on valid_views to prevent duplicate views per IP+fingerprint+post+day
CREATE UNIQUE INDEX IF NOT EXISTS valid_views_unique_view 
ON public.valid_views (ip_address, fingerprint, post_id, view_date);
