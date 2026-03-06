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
  created_at: string;
}

const UserOverview = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [postsCount, setPostsCount] = useState(0);
  const [imagesCount, setImagesCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [totalValidViews, setTotalValidViews] = useState(0);
  const [pendingViews, setPendingViews] = useState(0);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, title, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (postsData) {
          setPostsCount(postsData.length);
          setRecentPosts(postsData.slice(0, 5));
        }

        // Fetch images count
        const { count: imgCount } = await supabase
          .from('gallery_images')
          .select('*', { count: 'exact', head: true })
          .eq('uploaded_by', user.id);
        setImagesCount(imgCount || 0);

        // Fetch videos count
        const { count: vidCount } = await supabase
          .from('youtube_videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setVideosCount(vidCount || 0);

        // Fetch token balance (mining system - source of truth)
        const { data: balanceData } = await supabase
          .from('token_balances')
          .select('balance, total_valid_views')
          .eq('user_id', user.id)
          .maybeSingle();

        setTokenBalance(balanceData?.balance || 0);
        setTotalValidViews(balanceData?.total_valid_views || 0);

        // Fetch pending views
        const { count: pending } = await supabase
          .from('valid_views')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('settled', false);
        setPendingViews(pending || 0);

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu",
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
    { title: "Token Balance", value: parseFloat(String(tokenBalance)).toFixed(4) },
    { title: "Lượt đọc hợp lệ", value: totalValidViews.toString(), sub: pendingViews > 0 ? `${pendingViews} chờ quyết toán` : undefined },
    { title: "Bài viết", value: postsCount.toString() },
    { title: "Hình ảnh", value: imagesCount.toString() },
    { title: "Video", value: videosCount.toString() },
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.sub && (
                <p className="text-xs text-amber-600 mt-1">{stat.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Bài viết gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Bạn chưa tạo bài viết nào.
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
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    getStatusColor(post.status)
                  )}>
                    {post.status === 'approved' ? 'Đã duyệt' : post.status === 'pending' ? 'Chờ duyệt' : post.status}
                  </span>
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
