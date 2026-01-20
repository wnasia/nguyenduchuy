import { useState, useEffect } from "react";
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
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bgColor: "bg-blue-500/10", trend: "+12%", up: true },
    { title: "Total Posts", value: stats.totalPosts, icon: FileText, color: "text-indigo-600", bgColor: "bg-indigo-500/10", trend: "+8%", up: true },
    { title: "Published", value: stats.approvedPosts, icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-500/10", trend: "+15%", up: true },
    { title: "Pending", value: stats.pendingPosts, icon: Clock, color: "text-amber-600", bgColor: "bg-amber-500/10", trend: stats.pendingPosts > 0 ? "Action" : "Clear", up: false },
    { title: "Total Views", value: stats.totalViews, icon: Eye, color: "text-violet-600", bgColor: "bg-violet-500/10", trend: "+24%", up: true },
    { title: "Reports", value: stats.pendingReports, icon: AlertTriangle, color: "text-orange-600", bgColor: "bg-orange-500/10", trend: stats.pendingReports > 0 ? "Review" : "None", up: false },
  ];

  const mediaCards = [
    { title: "Images", value: stats.totalImages, icon: Image, color: "text-pink-600", bgColor: "bg-pink-500/10" },
    { title: "Videos", value: stats.totalVideos, icon: Video, color: "text-red-600", bgColor: "bg-red-500/10" },
    { title: "Earnings", value: `${stats.totalEarnings.toLocaleString()}đ`, icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="admin-stat-card group">
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-xl transition-all duration-300 group-hover:scale-110", stat.bgColor)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              {stat.trend && (
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  stat.up ? "bg-emerald-50 text-emerald-700" : stat.trend === "Action" || stat.trend === "Review" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                )}>
                  {stat.up && <ArrowUpRight className="h-3 w-3" />}
                  {stat.trend}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <p className={cn("text-3xl font-bold mt-1 tracking-tight", stat.color)}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {mediaCards.map((stat, index) => (
          <div key={index} className="admin-stat-card">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className={cn("text-xl font-bold", stat.color)}>
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="admin-section-card">
          <div className="admin-section-header">
            <h3 className="text-base font-semibold text-foreground">Recent Posts</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Latest content submissions</p>
          </div>
          <div className="p-2">
            {recentPosts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">No recent posts</p>
            ) : (
              <div className="space-y-1">
                {recentPosts.map((post) => (
                  <div key={post.id} className="admin-activity-item">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(post.created_at).toLocaleDateString('vi-VN', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge 
                      variant={post.status === 'approved' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'}
                      className={cn(
                        "shrink-0 text-xs capitalize",
                        post.status === 'approved' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                        post.status === 'pending' && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                        post.status === 'rejected' && "bg-red-100 text-red-700 hover:bg-red-100"
                      )}
                    >
                      {post.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance & Actions */}
        <div className="space-y-6">
          {/* Content Performance */}
          <div className="admin-section-card">
            <div className="admin-section-header">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-semibold text-foreground">Performance</h3>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Approval Rate</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {stats.totalPosts > 0 
                      ? Math.round((stats.approvedPosts / stats.totalPosts) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${stats.totalPosts > 0 ? (stats.approvedPosts / stats.totalPosts) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <span className="text-sm text-muted-foreground">Avg. Views / Post</span>
                <span className="text-sm font-semibold">
                  {stats.approvedPosts > 0 
                    ? Math.round(stats.totalViews / stats.approvedPosts).toLocaleString()
                    : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Action Required */}
          <div className="admin-section-card">
            <div className="admin-section-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-base font-semibold text-foreground">Action Required</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className={cn(
                "flex justify-between items-center p-3 rounded-xl transition-colors",
                stats.pendingPosts > 0 ? "bg-amber-50" : "bg-slate-50"
              )}>
                <div className="flex items-center gap-3">
                  <Clock className={cn("h-4 w-4", stats.pendingPosts > 0 ? "text-amber-600" : "text-slate-400")} />
                  <span className="text-sm">Posts awaiting review</span>
                </div>
                <Badge variant="secondary" className={cn(
                  stats.pendingPosts > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                )}>
                  {stats.pendingPosts}
                </Badge>
              </div>
              <div className={cn(
                "flex justify-between items-center p-3 rounded-xl transition-colors",
                stats.pendingReports > 0 ? "bg-orange-50" : "bg-slate-50"
              )}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={cn("h-4 w-4", stats.pendingReports > 0 ? "text-orange-600" : "text-slate-400")} />
                  <span className="text-sm">Unresolved reports</span>
                </div>
                <Badge variant="secondary" className={cn(
                  stats.pendingReports > 0 ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-600"
                )}>
                  {stats.pendingReports}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;