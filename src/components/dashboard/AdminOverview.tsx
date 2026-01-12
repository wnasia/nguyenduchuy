import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Eye,
  Image,
  Video,
  Clock,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  pendingReports: number;
  totalEarnings: number;
  totalViews: number;
  totalImages: number;
  totalVideos: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  created_at: string;
  status?: string;
}

const AdminOverview = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    approvedPosts: 0,
    pendingPosts: 0,
    pendingReports: 0,
    totalEarnings: 0,
    totalViews: 0,
    totalImages: 0,
    totalVideos: 0,
  });
  const [recentPosts, setRecentPosts] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        usersResult,
        postsResult,
        approvedResult,
        pendingPostsResult,
        reportsResult,
        walletResult,
        viewsResult,
        imagesResult,
        videosResult,
        recentPostsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('wallet').select('total_earned'),
        supabase.from('posts').select('view_count').eq('status', 'approved'),
        supabase.from('gallery_images').select('*', { count: 'exact', head: true }),
        supabase.from('youtube_videos').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('id, title, created_at, status').order('created_at', { ascending: false }).limit(5)
      ]);

      const totalEarnings = walletResult.data?.reduce((sum, w) => sum + (w.total_earned || 0), 0) || 0;
      const totalViews = viewsResult.data?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalPosts: postsResult.count || 0,
        approvedPosts: approvedResult.count || 0,
        pendingPosts: pendingPostsResult.count || 0,
        pendingReports: reportsResult.count || 0,
        totalEarnings,
        totalViews,
        totalImages: imagesResult.count || 0,
        totalVideos: videosResult.count || 0,
      });

      setRecentPosts(recentPostsResult.data?.map(p => ({
        id: p.id,
        type: 'post',
        title: p.title,
        created_at: p.created_at,
        status: p.status
      })) || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Total Posts", value: stats.totalPosts, icon: FileText, color: "text-indigo-600", bgColor: "bg-indigo-50" },
    { title: "Published", value: stats.approvedPosts, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "Pending Review", value: stats.pendingPosts, icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50" },
    { title: "Pending Reports", value: stats.pendingReports, icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-50" },
    { title: "Total Views", value: stats.totalViews, icon: Eye, color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "Gallery Images", value: stats.totalImages, icon: Image, color: "text-pink-600", bgColor: "bg-pink-50" },
    { title: "YouTube Videos", value: stats.totalVideos, icon: Video, color: "text-red-600", bgColor: "bg-red-50" },
    { title: "Total Earnings", value: `${stats.totalEarnings.toLocaleString()} VND`, icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {stat.title}
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Posts</CardTitle>
          <CardDescription>Latest content submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No recent posts</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge 
                    variant={post.status === 'approved' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'}
                    className="shrink-0"
                  >
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Content Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Approval Rate</span>
                <span className="font-semibold">
                  {stats.totalPosts > 0 
                    ? Math.round((stats.approvedPosts / stats.totalPosts) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${stats.totalPosts > 0 ? (stats.approvedPosts / stats.totalPosts) * 100 : 0}%` 
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Avg. Views per Post</span>
                <span className="font-medium">
                  {stats.approvedPosts > 0 
                    ? Math.round(stats.totalViews / stats.approvedPosts).toLocaleString()
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded bg-amber-50 border border-amber-200">
                <span className="text-sm">Posts awaiting review</span>
                <Badge variant="secondary">{stats.pendingPosts}</Badge>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-orange-50 border border-orange-200">
                <span className="text-sm">Unresolved reports</span>
                <Badge variant="secondary">{stats.pendingReports}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
