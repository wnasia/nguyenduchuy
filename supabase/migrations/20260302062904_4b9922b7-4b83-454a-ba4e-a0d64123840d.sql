
-- Create topics table
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_topics junction table
CREATE TABLE public.post_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_topics ENABLE ROW LEVEL SECURITY;

-- Topics policies
CREATE POLICY "Anyone can view active topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage topics" ON public.topics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Post_topics policies
CREATE POLICY "Anyone can view post topics" ON public.post_topics FOR SELECT USING (true);
CREATE POLICY "Admins can manage post topics" ON public.post_topics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can assign topics to own posts" ON public.post_topics FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default topics
INSERT INTO public.topics (name, slug, sort_order) VALUES
  ('Kinh tế', 'kinh-te', 1),
  ('Chính trị', 'chinh-tri', 2),
  ('Thế giới', 'the-gioi', 3),
  ('Khoa học', 'khoa-hoc', 4),
  ('Công nghệ', 'cong-nghe', 5),
  ('Giải trí', 'giai-tri', 6),
  ('Thể thao', 'the-thao', 7),
  ('Đời sống', 'doi-song', 8);
