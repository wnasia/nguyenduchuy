
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, ArrowLeft, Image, Video, Tag, Share2, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";
import EngagementSection from "@/components/EngagementSection";
import { useI18n } from "@/hooks/useI18n";
import { parsePostContent, decodeHtmlEntities } from "@/lib/htmlUtils";
import ArticleSidebar from "@/components/article/ArticleSidebar";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  view_count: number;
  created_at: string;
  user_id: string;
  slug?: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useI18n();
  const [story, setStory] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const shareOnFacebook = () => {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = story?.title || '';
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  useEffect(() => {
    if (id) {
      fetchStory(id);
    }
  }, [id]);

  const fetchStory = async (storyIdOrSlug: string) => {
    try {
      // Try to fetch by slug first, then by ID
      let query = supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved');

      // Check if it's a UUID or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyIdOrSlug);
      
      if (isUUID) {
        query = query.eq('id', storyIdOrSlug);
      } else {
        query = query.eq('slug', storyIdOrSlug);
      }

      const { data: postData, error: postError } = await query.maybeSingle();

      if (postError) {
        console.error('Error fetching story:', postError);
        toast({
          title: "Error",
          description: "Story not found",
          variant: "destructive",
        });
        navigate('/stories');
        return;
      }

      if (!postData) {
        toast({
          title: "Error",
          description: "Story not found",
          variant: "destructive",
        });
        navigate('/stories');
        return;
      }

      // Increment views
      await supabase.rpc('increment_post_views', { post_id: postData.id });

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', postData.user_id)
        .maybeSingle();

      setStory({
        ...postData,
        profiles: profileData
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      navigate('/stories');
    } finally {
      setLoading(false);
    }
  };

  const parsedContent = parsePostContent(story?.content || '');
  const decodedTitle = decodeHtmlEntities(story?.title || '');

  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Story not found</h1>
          <Button onClick={() => navigate('/stories')}>Back to Stories</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/stories')}
          className="mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stories
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  {parsedContent.tags && parsedContent.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    {story.type}
                  </Badge>
                </div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-serif mb-2 sm:mb-4">
                  {decodedTitle}
                </CardTitle>
                <CardDescription className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-sm sm:text-base">
                  <span>by {story.profiles?.full_name || 'Anonymous'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(story.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {story.view_count} {t("story.views") || "views"}
                  </span>
                </CardDescription>
                {/* Social Share Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                  <span className="text-sm text-muted-foreground sm:mr-2">
                    {t("story.share") || "Share"}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={shareOnFacebook}
                      className="btn-social btn-facebook text-xs sm:text-sm"
                      aria-label="Share on Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Facebook</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={shareOnTwitter}
                      className="btn-social btn-x text-xs sm:text-sm"
                      aria-label="Share on X"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">X</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6">
                {/* Render HTML content properly */}
                {parsedContent.story && (
                  <div 
                    className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-6 sm:mb-8 
                      prose-headings:text-foreground 
                      prose-p:text-foreground/90
                      prose-strong:text-foreground
                      prose-a:text-primary
                      prose-img:rounded-lg prose-img:shadow-md
                      [&_img]:max-w-full [&_img]:h-auto
                      [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg"
                    dangerouslySetInnerHTML={{ __html: parsedContent.story }}
                  />
                )}

                {parsedContent.imageLinks && parsedContent.imageLinks.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Image className="h-4 w-4 sm:h-5 sm:w-5" />
                      Images ({parsedContent.imageLinks.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {parsedContent.imageLinks.map((imageUrl, index) => (
                        <div key={index} className="rounded-lg overflow-hidden shadow-md">
                          <img 
                            src={imageUrl} 
                            alt={`Story image ${index + 1}`}
                            className="w-full h-48 sm:h-56 lg:h-64 object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedContent.videoLinks && parsedContent.videoLinks.length > 0 && (
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                      <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                      Videos ({parsedContent.videoLinks.length})
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {parsedContent.videoLinks.map((videoUrl, index) => (
                        <VideoPlayer
                          key={index}
                          src={videoUrl}
                          poster="/placeholder.svg"
                          className="shadow-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <EngagementSection postId={story.id} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="hidden lg:block">
            <ArticleSidebar 
              contentHtml={parsedContent.story || ""} 
              currentPostId={story.id} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
