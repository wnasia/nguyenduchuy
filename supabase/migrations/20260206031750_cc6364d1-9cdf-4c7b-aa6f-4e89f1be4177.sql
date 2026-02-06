-- Add moderation status to gallery_images table
ALTER TABLE public.gallery_images 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Add moderation fields
ALTER TABLE public.gallery_images 
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_gallery_images_status ON public.gallery_images(status);

-- Add notification type for new content
-- This will allow notifications for new_article, new_video, new_image

-- Create a function to automatically create notifications when new content is approved
CREATE OR REPLACE FUNCTION public.notify_users_on_new_content()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Determine notification content based on table
  IF TG_TABLE_NAME = 'posts' THEN
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
      notification_title := 'Bài viết mới: ' || LEFT(NEW.title, 50);
      notification_message := 'Có bài viết mới vừa được đăng. Hãy xem ngay!';
      notification_type := 'new_article';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'youtube_videos' THEN
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
      notification_title := 'Video mới: ' || LEFT(NEW.title, 50);
      notification_message := 'Có video mới vừa được đăng. Hãy xem ngay!';
      notification_type := 'new_video';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'gallery_images' THEN
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
      notification_title := 'Hình ảnh mới: ' || LEFT(NEW.title, 50);
      notification_message := 'Có hình ảnh mới vừa được đăng. Hãy xem ngay!';
      notification_type := 'new_image';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Create notifications for all active users (except the content creator)
  FOR user_record IN 
    SELECT id FROM public.profiles 
    WHERE account_status = 'active' 
    AND id != NEW.user_id
    LIMIT 1000  -- Limit to prevent performance issues
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_post_id)
    VALUES (
      user_record.id,
      notification_type,
      notification_title,
      notification_message,
      CASE WHEN TG_TABLE_NAME = 'posts' THEN NEW.id ELSE NULL END
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic notifications
DROP TRIGGER IF EXISTS trigger_notify_new_post ON public.posts;
CREATE TRIGGER trigger_notify_new_post
  AFTER INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_on_new_content();

DROP TRIGGER IF EXISTS trigger_notify_new_video ON public.youtube_videos;
CREATE TRIGGER trigger_notify_new_video
  AFTER INSERT OR UPDATE ON public.youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_on_new_content();

DROP TRIGGER IF EXISTS trigger_notify_new_image ON public.gallery_images;
CREATE TRIGGER trigger_notify_new_image
  AFTER INSERT OR UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_on_new_content();

-- Update the gallery_images user_id reference (the trigger uses user_id but table has uploaded_by)
-- We need to fix the function to handle this
CREATE OR REPLACE FUNCTION public.notify_users_on_new_content()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  content_owner_id UUID;
BEGIN
  -- Determine notification content and owner based on table
  IF TG_TABLE_NAME = 'posts' THEN
    content_owner_id := NEW.user_id;
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
      notification_title := 'Bài viết mới: ' || LEFT(NEW.title, 50);
      notification_message := 'Có bài viết mới vừa được đăng. Hãy xem ngay!';
      notification_type := 'new_article';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'youtube_videos' THEN
    content_owner_id := NEW.user_id;
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
      notification_title := 'Video mới: ' || LEFT(NEW.title, 50);
      notification_message := 'Có video mới vừa được đăng. Hãy xem ngay!';
      notification_type := 'new_video';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'gallery_images' THEN
    content_owner_id := NEW.uploaded_by;
    IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
      notification_title := 'Hình ảnh mới: ' || LEFT(NEW.title, 50);
      notification_message := 'Có hình ảnh mới vừa được đăng. Hãy xem ngay!';
      notification_type := 'new_image';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Create notifications for all active users (except the content creator)
  FOR user_record IN 
    SELECT id FROM public.profiles 
    WHERE account_status = 'active' 
    AND id != content_owner_id
    LIMIT 500  -- Limit to prevent performance issues
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_post_id)
    VALUES (
      user_record.id,
      notification_type,
      notification_title,
      notification_message,
      CASE WHEN TG_TABLE_NAME = 'posts' THEN NEW.id ELSE NULL END
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;