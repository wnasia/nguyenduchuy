
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import StoryCard from "@/components/StoryCard";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  view_count: number;
  created_at: string;
  user_id: string;
  thumbnail_url?: string;
  slug?: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const Stories = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  usePageTitle("meta.stories_title");
  const [stories, setStories] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedStories();
  }, []);

  const fetchApprovedStories = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching stories:', postsError);
        toast({
          title: t("errors.network_error"),
          description: t("errors.failed_to_load"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch profile data separately for each post
      const storiesWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', post.user_id)
            .single();

          return {
            ...post,
            profiles: profileData
          };
        })
      );

      setStories(storiesWithProfiles);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t("errors.network_error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-2 sm:mb-4">{t("common.stories")}</h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              {t("home.story_placeholder")}
            </p>
          </div>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-2 sm:mb-4">{t("common.stories")}</h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            {t("home.story_placeholder")}
          </p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-8 sm:py-12 lg:py-16">
            <div className="text-muted-foreground text-base sm:text-lg mb-4">{t("videos.no_videos_title")}</div>
            <p className="text-muted-foreground">{t("videos.no_videos_desc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {stories.map((story, index) => (
              <StoryCard key={story.id} story={story} index={index} />
            ))}
          </div>
        )}

        {stories.length > 0 && (
          <div className="text-center mt-6 sm:mt-8 lg:mt-12">
            <button className="px-6 sm:px-8 py-2.5 sm:py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm sm:text-base" disabled>
              {t("videos.load_more")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
