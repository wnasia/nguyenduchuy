
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar, FileText, Image, Video, Tag, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { parsePostContent, stripHtmlAndDecode, decodeHtmlEntities } from "@/lib/htmlUtils";

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
      <Card>
        <CardHeader>
          <CardTitle>My Stories</CardTitle>
          <CardDescription>You haven't created any stories yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">Share your stories, articles, and experiences with the community!</p>
          <Button onClick={() => window.location.href = '/submit'}>
            <FileText className="mr-2 h-4 w-4" />
            Create Your First Story
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Stories</CardTitle>
            <CardDescription>Manage your submitted stories and articles</CardDescription>
          </div>
          <Button onClick={() => window.location.href = '/submit'}>
            <FileText className="mr-2 h-4 w-4" />
            Create Story
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {posts.map((post) => {
            const parsedContent = parsePostContent(post.content);
            const hasMedia = (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) || 
                           (parsedContent.videoLinks && parsedContent.videoLinks.length > 0);
            const decodedTitle = decodeHtmlEntities(post.title);
            const storyExcerpt = stripHtmlAndDecode(parsedContent.story);
            
            return (
              <div key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-gray-900 mb-2">{decodedTitle}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={getStatusBadgeVariant(post.status)} className={getStatusColor(post.status)}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">{post.type}</Badge>
                    </div>
                  </div>
                </div>
                
                {storyExcerpt && (
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {storyExcerpt}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {parsedContent.tags && parsedContent.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="h-4 w-4 text-gray-500" />
                      {parsedContent.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media indicators */}
                {hasMedia && (
                  <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
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
                
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/submit?edit=${post.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
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
