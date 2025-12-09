
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

interface ParsedContent {
  story: string;
  imageLinks?: string[];
  videoLinks?: string[];
  tags?: string[];
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

  // Decode HTML entities that TinyMCE may have encoded
  const decodeHtmlEntities = (html: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  };

  const parseContent = (content: string): ParsedContent => {
    try {
      const parsed = JSON.parse(content);
      // Decode HTML entities in the story content
      const decodedStory = decodeHtmlEntities(parsed.story || '');
      return {
        story: decodedStory,
        imageLinks: parsed.imageLinks || [],
        videoLinks: parsed.videoLinks || [],
        tags: parsed.tags || []
      };
    } catch {
      return {
        story: decodeHtmlEntities(content),
        imageLinks: [],
        videoLinks: [],
        tags: []
      };
    }
  };

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

  const parsedContent = parseContent(story.content);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate('/stories')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Stories
        </Button>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex flex-wrap gap-2 mb-3">
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
            <CardTitle className="text-3xl font-serif mb-4">
              {story.title}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-4 text-base">
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
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground mr-2">
                {t("story.share") || "Share"}:
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={shareOnFacebook}
                className="btn-social btn-facebook"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={shareOnTwitter}
                className="btn-social btn-x"
                aria-label="Share on X"
              >
                <Share2 className="h-4 w-4" />
                X
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Render HTML content properly */}
            {parsedContent.story && (
              <div 
                className="prose prose-lg max-w-none mb-8 
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
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Images ({parsedContent.imageLinks.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedContent.imageLinks.map((imageUrl, index) => (
                    <div key={index} className="rounded-lg overflow-hidden shadow-md">
                      <img 
                        src={imageUrl} 
                        alt={`Story image ${index + 1}`}
                        className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
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
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Videos ({parsedContent.videoLinks.length})
                </h3>
                <div className="space-y-4">
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
    </div>
  );
};

export default StoryDetail;
