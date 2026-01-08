-- Allow anyone to read public profile info (full_name, avatar_url) for displaying author names
CREATE POLICY "Anyone can view author profile info"
ON public.profiles
FOR SELECT
USING (true);