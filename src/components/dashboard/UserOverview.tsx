import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RecentPost {
  id: string;
  title: string;
  status: string;
  view_count: number;
  created_at: string;
}

const UserOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [postsCount, setPostsCount] = useState(0);
  const [imagesCount, setImagesCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch posts with stats
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('id, title, status, view_count, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!postsError && postsData) {
          setPostsCount(postsData.length);
          setTotalViews(postsData.reduce((sum, p) => sum + (p.view_count || 0), 0));
          setRecentPosts(postsData.slice(0, 5));
        }

        // Fetch images count
        const { count: imagesCountData, error: imagesError } = await supabase
          .from('gallery_images')
          .select('*', { count: 'exact', head: true })
          .eq('uploaded_by', user.id);

        if (!imagesError) {
          setImagesCount(imagesCountData || 0);
        }

        // Fetch videos count
        const { count: videosCountData, error: videosError } = await supabase
          .from('youtube_videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!videosError) {
          setVideosCount(videosCountData || 0);
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

    fetchDashboardData();
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    { title: "Total Views", value: totalViews.toLocaleString() },
    { title: "My Stories", value: postsCount.toString() },
    { title: "My Images", value: imagesCount.toString() },
    { title: "My Videos", value: videosCount.toString() },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-700 bg-green-100';
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      case 'rejected': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Stories</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't created any stories yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {post.view_count} views
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      getStatusColor(post.status)
                    )}>
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOverview;
