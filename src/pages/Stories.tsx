
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const Stories = () => {
  const { toast } = useToast();
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
          title: "Error",
          description: "Failed to load stories",
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
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Life Stories</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from real people. Each one a window into the human experience, 
              shared with courage and vulnerability.
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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Life Stories</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real stories from real people. Each one a window into the human experience, 
            shared with courage and vulnerability.
          </p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg mb-4">No stories available yet</div>
            <p className="text-gray-400">Be the first to share your story!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stories.map((story, index) => (
              <StoryCard key={story.id} story={story} index={index} />
            ))}
          </div>
        )}

        {stories.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" disabled>
              Load More Stories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
