-- Create banners bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create homepage_banners table
CREATE TABLE IF NOT EXISTS public.homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public can read active banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.homepage_banners;

DROP POLICY IF EXISTS "Public can read story images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage story images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can write banners" ON storage.objects;

-- RLS policies for homepage_banners
CREATE POLICY "Public can read active banners"
ON public.homepage_banners
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert banners"
ON public.homepage_banners
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update banners"
ON public.homepage_banners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete banners"
ON public.homepage_banners
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Storage policies for story-images
CREATE POLICY "Public can read story images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'story-images');

CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'story-images'
  AND (
    (auth.uid()::text = split_part(name, '/', 1))
    OR (position('gallery/' in name) = 1)
  )
);

CREATE POLICY "Admins can manage story images"
ON storage.objects
FOR ALL
USING (bucket_id = 'story-images' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'story-images' AND has_role(auth.uid(), 'admin'));

-- Storage policies for banners
CREATE POLICY "Public can read banners"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can write banners"
ON storage.objects
FOR ALL
USING (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'banners' AND has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS homepage_banners_updated_at ON public.homepage_banners;
CREATE TRIGGER homepage_banners_updated_at
BEFORE UPDATE ON public.homepage_banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();