-- Add slug column to posts table for SEO-friendly URLs
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug (allowing null for old posts)
CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_unique ON public.posts (slug) WHERE slug IS NOT NULL;

-- Create function to generate slug from title (supports Unicode/Vietnamese)
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  slug text;
  -- Vietnamese character mappings
  vietnamese_chars text[] := ARRAY['à','á','ạ','ả','ã','â','ầ','ấ','ậ','ẩ','ẫ','ă','ằ','ắ','ặ','ẳ','ẵ','è','é','ẹ','ẻ','ẽ','ê','ề','ế','ệ','ể','ễ','ì','í','ị','ỉ','ĩ','ò','ó','ọ','ỏ','õ','ô','ồ','ố','ộ','ổ','ỗ','ơ','ờ','ớ','ợ','ở','ỡ','ù','ú','ụ','ủ','ũ','ư','ừ','ứ','ự','ử','ữ','ỳ','ý','ỵ','ỷ','ỹ','đ','À','Á','Ạ','Ả','Ã','Â','Ầ','Ấ','Ậ','Ẩ','Ẫ','Ă','Ằ','Ắ','Ặ','Ẳ','Ẵ','È','É','Ẹ','Ẻ','Ẽ','Ê','Ề','Ế','Ệ','Ể','Ễ','Ì','Í','Ị','Ỉ','Ĩ','Ò','Ó','Ọ','Ỏ','Õ','Ô','Ồ','Ố','Ộ','Ổ','Ỗ','Ơ','Ờ','Ớ','Ợ','Ở','Ỡ','Ù','Ú','Ụ','Ủ','Ũ','Ư','Ừ','Ứ','Ự','Ử','Ữ','Ỳ','Ý','Ỵ','Ỷ','Ỹ','Đ'];
  latin_chars text[] := ARRAY['a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','e','e','e','e','e','e','e','e','e','e','e','i','i','i','i','i','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','u','u','u','u','u','u','u','u','u','u','u','y','y','y','y','y','d','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','A','E','E','E','E','E','E','E','E','E','E','E','I','I','I','I','I','O','O','O','O','O','O','O','O','O','O','O','O','O','O','O','O','O','U','U','U','U','U','U','U','U','U','U','U','Y','Y','Y','Y','Y','D'];
  i int;
BEGIN
  slug := lower(title);
  
  -- Replace Vietnamese characters with Latin equivalents
  FOR i IN 1..array_length(vietnamese_chars, 1) LOOP
    slug := replace(slug, vietnamese_chars[i], latin_chars[i]);
  END LOOP;
  
  -- Replace spaces and special chars with hyphens
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  slug := trim(both '-' from slug);
  
  -- Limit length to 100 characters
  slug := left(slug, 100);
  
  RETURN slug;
END;
$$;

-- Create function to ensure unique slug
CREATE OR REPLACE FUNCTION public.ensure_unique_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Generate base slug from title
  base_slug := generate_slug(NEW.title);
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (
    SELECT 1 FROM public.posts 
    WHERE slug = final_slug 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate slug on insert/update
DROP TRIGGER IF EXISTS posts_generate_slug ON public.posts;
CREATE TRIGGER posts_generate_slug
  BEFORE INSERT OR UPDATE OF title ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_unique_slug();

-- Generate slugs for existing posts that don't have one
UPDATE public.posts 
SET slug = generate_slug(title) || '-' || substring(id::text, 1, 8)
WHERE slug IS NULL;