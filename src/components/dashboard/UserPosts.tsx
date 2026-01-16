import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar, FileText, Image, Video, Tag, Edit, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { parsePostContent, stripHtmlAndDecode, decodeHtmlEntities } from "@/lib/htmlUtils";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const UserPosts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          toast({
            title: "Error",
            description: "Failed to load your posts",
            variant: "destructive",
          });
        } else {
          setPosts(data || []);
        }
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

    fetchUserPosts();
  }, [user, toast]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          badge: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
          indicator: 'bg-green-500',
        };
      case 'pending':
        return {
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
          indicator: 'bg-yellow-500',
        };
      case 'rejected':
        return {
          badge: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
          indicator: 'bg-red-500',
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
          indicator: 'bg-gray-500',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="border hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>My Stories</CardTitle>
          <CardDescription>You haven't created any stories yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Share your stories, articles, and experiences with the community!</p>
          <Button 
            onClick={() => navigate('/submit')}
            className={cn(
              "gap-2 bg-gradient-to-r from-primary to-blue-600",
              "hover:shadow-lg hover:scale-[1.02] transition-all duration-200",
              "active:scale-[0.98]"
            )}
          >
            <Plus className="h-4 w-4" />
            Create Your First Story
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Stories</CardTitle>
            <CardDescription>Manage your submitted stories and articles</CardDescription>
          </div>
          <Button 
            onClick={() => navigate('/submit')}
            className={cn(
              "gap-2 bg-gradient-to-r from-primary to-blue-600",
              "hover:shadow-lg hover:scale-[1.02] transition-all duration-200",
              "active:scale-[0.98]"
            )}
          >
            <Plus className="h-4 w-4" />
            Create Story
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => {
            const parsedContent = parsePostContent(post.content);
            const hasMedia = (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) || 
                           (parsedContent.videoLinks && parsedContent.videoLinks.length > 0);
            const decodedTitle = decodeHtmlEntities(post.title);
            const storyExcerpt = stripHtmlAndDecode(parsedContent.story);
            const statusStyles = getStatusStyles(post.status);
            
            return (
              <div 
                key={post.id} 
                className={cn(
                  "group border rounded-xl p-5 transition-all duration-200",
                  "hover:shadow-lg hover:border-primary/20 hover:bg-primary/[0.02]",
                  "hover:-translate-y-0.5"
                )}
              >
                {/* Status indicator bar */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-200",
                  "opacity-0 group-hover:opacity-100",
                  statusStyles.indicator
                )} />
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                      {decodedTitle}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        className={cn(
                          "text-xs font-medium border transition-all duration-200",
                          statusStyles.badge
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", statusStyles.indicator)} />
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs hover:bg-muted transition-colors">
                        {post.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {storyExcerpt && (
                  <div className="mb-4">
                    <p className="text-muted-foreground leading-relaxed line-clamp-2 group-hover:text-foreground/80 transition-colors">
                      {storyExcerpt}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {parsedContent.tags && parsedContent.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {parsedContent.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs hover:bg-primary/10 hover:text-primary transition-colors cursor-default"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media indicators */}
                {hasMedia && (
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    {parsedContent.imageLinks && parsedContent.imageLinks.length > 0 && (
                      <div className="flex items-center gap-1.5 group-hover:text-primary transition-colors">
                        <Image className="h-4 w-4" />
                        <span>{parsedContent.imageLinks.length} image{parsedContent.imageLinks.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {parsedContent.videoLinks && parsedContent.videoLinks.length > 0 && (
                      <div className="flex items-center gap-1.5 group-hover:text-primary transition-colors">
                        <Video className="h-4 w-4" />
                        <span>{parsedContent.videoLinks.length} video{parsedContent.videoLinks.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
                      <Eye className="h-4 w-4" />
                      {post.view_count} views
                    </span>
                    <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/submit?edit=${post.id}`)}
                    className={cn(
                      "gap-1.5 transition-all duration-200",
                      "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                      "hover:shadow-md hover:scale-[1.02]",
                      "active:scale-[0.98]"
                    )}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserPosts;
