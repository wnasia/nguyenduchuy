
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, Eye, Image, Video, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

const Stories = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

  const parseContent = (content: string): ParsedContent => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        story: parsed.story || '',
        imageLinks: parsed.imageLinks || [],
        videoLinks: parsed.videoLinks || [],
        tags: parsed.tags || []
      };
    } catch {
      // If parsing fails, treat as plain text
      return {
        story: content,
        imageLinks: [],
        videoLinks: [],
        tags: []
      };
    }
  };

  const handleReadMore = (postId: string) => {
    navigate(`/story/${postId}`);
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
          <div className="grid gap-8">
            {stories.map((story, index) => {
              const parsedContent = parseContent(story.content);
              const hasMedia = (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) || 
                             (parsedContent.videoLinks && parsedContent.videoLinks.length > 0);
              
              return (
                <Card key={story.id} className="overflow-hidden hover-scale cursor-pointer border-0 shadow-lg animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="p-6">
                    <CardHeader className="px-0 pt-0">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {parsedContent.tags && parsedContent.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        <Badge variant="outline" className="text-xs">
                          {story.type}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-serif mb-2 hover:text-primary transition-colors">
                        {story.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span>by {story.profiles?.full_name || 'Anonymous'}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-0">
                      {parsedContent.story && (
                        <p className="text-gray-700 leading-relaxed mb-6 line-clamp-3">
                          {parsedContent.story}
                        </p>
                      )}

                      {/* Media indicators */}
                      {hasMedia && (
                        <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
                          {parsedContent.imageLinks && parsedContent.imageLinks.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Image className="h-4 w-4" />
                              <span>{parsedContent.imageLinks.length} image{parsedContent.imageLinks.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {parsedContent.videoLinks && parsedContent.videoLinks.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Video className="h-4 w-4" />
                              <span>{parsedContent.videoLinks.length} video{parsedContent.videoLinks.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            {story.view_count}
                          </span>
                          <span className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            0
                          </span>
                          <span className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            0
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          className="story-link"
                          onClick={() => handleReadMore(story.id)}
                        >
                          Read More
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {stories.length > 0 && (
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="px-8">
              Load More Stories
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
