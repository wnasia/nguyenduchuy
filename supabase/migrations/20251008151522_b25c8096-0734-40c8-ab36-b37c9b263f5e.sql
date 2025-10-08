-- Create table for YouTube video submissions
CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for youtube_videos
CREATE POLICY "Users can view approved videos"
  ON public.youtube_videos
  FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own videos"
  ON public.youtube_videos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert videos"
  ON public.youtube_videos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.youtube_videos
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.youtube_videos
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all videos"
  ON public.youtube_videos
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_youtube_videos_updated_at
  BEFORE UPDATE ON public.youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();