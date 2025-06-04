
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar, CheckCircle, XCircle, Clock, Image, Video, Tag } from "lucide-react";

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

const AdminPosts = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch profile data separately for each post
      const postsWithProfiles = await Promise.all(
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

      setPosts(postsWithProfiles);
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

  const updatePostStatus = async (postId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', postId);

      if (error) {
        console.error('Error updating post status:', error);
        toast({
          title: "Error",
          description: "Failed to update post status",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Post ${newStatus} successfully`,
        });
        fetchPosts(); // Refresh the list
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts Management</CardTitle>
        <CardDescription>Review and manage user posts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {posts.map((post) => {
            const parsedContent = parseContent(post.content);
            const hasMedia = (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) || 
                           (parsedContent.videoLinks && parsedContent.videoLinks.length > 0);
            
            return (
              <div key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      By {post.profiles?.full_name || 'Unknown User'} ({post.profiles?.email || 'No email'})
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={getStatusBadgeVariant(post.status)} className={getStatusColor(post.status)}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">{post.type}</Badge>
                    </div>
                  </div>
                </div>
                
                {parsedContent.story && (
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {parsedContent.story}
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
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {post.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePostStatus(post.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePostStatus(post.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {post.status === 'approved' && (
                      <div className="text-green-600 font-medium">
                        Published
                      </div>
                    )}
                    {post.status === 'rejected' && (
                      <div className="text-red-600 font-medium">
                        Rejected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {posts.length === 0 && (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No posts found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPosts;
