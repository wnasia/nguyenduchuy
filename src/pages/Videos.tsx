
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Heart, MessageCircle, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { parsePostContent, stripHtmlAndDecode, decodeHtmlEntities } from "@/lib/htmlUtils";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  view_count: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

const Videos = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoPosts();
    // Update document title
    document.title = t("meta.videos_title");
  }, [t]);

  const fetchVideoPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: t("common.error"),
          description: t("errors.failed_to_load"),
          variant: "destructive",
        });
        return;
      }

      // Filter posts that have video content
      const videoPostsWithProfiles = await Promise.all(
        (postsData || [])
          .filter(post => {
            try {
              const parsed = JSON.parse(post.content);
              return parsed.videoLinks && parsed.videoLinks.length > 0;
            } catch {
              return false;
            }
          })
          .map(async (post) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', post.user_id)
              .single();

            return {
              ...post,
              profiles: profileData
            };
          })
      );

      setPosts(videoPostsWithProfiles);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t("common.error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWatchStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
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
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">{t("videos.title")}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("videos.subtitle")}
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t("videos.no_videos_title")}</h3>
            <p className="text-gray-500">{t("videos.no_videos_desc")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => {
              const parsedContent = parsePostContent(post.content);
              const firstVideoUrl = parsedContent.videoLinks?.[0] || '';
              const decodedTitle = decodeHtmlEntities(post.title);
              const storyExcerpt = stripHtmlAndDecode(parsedContent.story);
              
              return (
                <Card key={post.id} className="overflow-hidden hover-scale cursor-pointer border-0 shadow-lg animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="relative">
                    {firstVideoUrl ? (
                      <div className="h-48">
                        <VideoPlayer
                          src={firstVideoUrl}
                          poster="/placeholder.svg"
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <Play className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <div className="flex flex-wrap gap-1">
                        {parsedContent.tags && parsedContent.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-white/90 text-gray-800">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {parsedContent.videoLinks && parsedContent.videoLinks.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                        +{parsedContent.videoLinks.length - 1} {t("videos.more_videos")}
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-serif line-clamp-2 hover:text-primary transition-colors">
                      {decodedTitle}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t("story.by_author")} {post.profiles?.full_name || t("story.anonymous")} • {new Date(post.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                      {storyExcerpt || t("videos.video_placeholder")}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.view_count} {t("videos.views")}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {Math.floor(Math.random() * 500) + 50}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {Math.floor(Math.random() * 100) + 10}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleWatchStory(post.id)}
                    >
                      {t("videos.watch_story")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {posts.length > 0 && (
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="px-8" disabled>
              {t("videos.load_more")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Videos;
