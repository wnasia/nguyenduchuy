
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar, FileText } from "lucide-react";

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
          <CardTitle>My Posts</CardTitle>
          <CardDescription>You haven't created any posts yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">Start sharing your stories and memories!</p>
          <Button onClick={() => window.location.href = '/submit'}>
            <FileText className="mr-2 h-4 w-4" />
            Create Your First Post
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Posts</CardTitle>
        <CardDescription>Manage your submitted content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{post.title}</h3>
                <Badge variant={getStatusBadgeVariant(post.status)}>
                  {post.status}
                </Badge>
              </div>
              
              <p className="text-gray-600 mb-3 line-clamp-2">
                {post.content || 'No content preview available'}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Eye className="mr-1 h-4 w-4" />
                    {post.view_count} views
                  </span>
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="outline">{post.type}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserPosts;
