
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, Eye, ArrowLeft, Image, Video, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/VideoPlayer";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  view_count: number;
  created_at: string;
  user_id: string;
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
  const [story, setStory] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStory(id);
      incrementViews(id);
    }
  }, [id]);

  const fetchStory = async (storyId: string) => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', storyId)
        .eq('status', 'approved')
        .single();

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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', postData.user_id)
        .single();

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

  const incrementViews = async (storyId: string) => {
    try {
      await supabase.rpc('increment_post_views', { post_id: storyId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const parseContent = (content: string): ParsedContent => {
    try {
      const parsed = JSON.parse(content);
      return {
        story: parsed.story || '',
        imageLinks: parsed.imageLinks || [],
        videoLinks: parsed.videoLinks || [],
        tags: parsed.tags || []
      };
    } catch {
      return {
        story: content,
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
            <CardDescription className="flex items-center gap-4 text-base">
              <span>by {story.profiles?.full_name || 'Anonymous'}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(story.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {story.view_count} views
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {parsedContent.story && (
              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {parsedContent.story}
                </p>
              </div>
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
            
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div className="flex items-center gap-6 text-gray-500">
                <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                  <Heart className="h-5 w-5" />
                  <span>Like</span>
                </button>
                <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  <span>Comment</span>
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Published on {new Date(story.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoryDetail;
