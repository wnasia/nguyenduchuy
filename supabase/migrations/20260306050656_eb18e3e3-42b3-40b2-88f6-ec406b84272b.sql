
-- Fix increment_post_views to only increment the counter (no VND wallet rewards)
-- Token rewards are now handled by the mining settlement system
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.posts 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = post_id AND status = 'approved';
END;
$function$;
