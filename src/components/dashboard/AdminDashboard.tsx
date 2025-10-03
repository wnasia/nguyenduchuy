
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, AlertTriangle, DollarSign, TrendingUp, Eye } from "lucide-react";
import AdminPosts from "./AdminPosts";
import AdminReports from "./AdminReports";
import AdminUsers from "./AdminUsers";
import AdminContent from "./AdminContent";
import AdminGallery from "./AdminGallery";
import AdminBanners from "./AdminBanners";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  approvedPosts: number;
  pendingReports: number;
  totalEarnings: number;
  totalViews: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    approvedPosts: 0,
    pendingReports: 0,
    totalEarnings: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total posts
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Fetch approved posts
      const { count: approvedCount, error: approvedError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Fetch pending reports
      const { count: reportsCount, error: reportsError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch total earnings and views
      const { data: walletData, error: walletError } = await supabase
        .from('wallet')
        .select('total_earned');

      const { data: postsData, error: postsViewsError } = await supabase
        .from('posts')
        .select('view_count')
        .eq('status', 'approved');

      if (usersError || postsError || approvedError || reportsError || walletError || postsViewsError) {
        console.error('Error fetching stats:', { 
          usersError, 
          postsError, 
          approvedError, 
          reportsError, 
          walletError, 
          postsViewsError 
        });
        toast({
          title: "Error",
          description: "Failed to load some dashboard statistics",
          variant: "destructive",
        });
      } else {
        const totalEarnings = walletData?.reduce((sum, wallet) => sum + (wallet.total_earned || 0), 0) || 0;
        const totalViews = postsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;
        
        setStats({
          totalUsers: usersCount || 0,
          totalPosts: postsCount || 0,
          approvedPosts: approvedCount || 0,
          pendingReports: reportsCount || 0,
          totalEarnings,
          totalViews,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading dashboard",
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

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, posts, and reports efficiently</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Community members</p>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approvedPosts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Live stories</p>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingReports.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Need review</p>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Story views</p>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalEarnings.toFixed(0)} VND</div>
              <p className="text-xs text-muted-foreground">User earnings</p>
            </CardContent>
          </Card>
        </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 bg-white border">
          <TabsTrigger value="posts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Posts</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Content</TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Gallery</TabsTrigger>
          <TabsTrigger value="banners" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Banners</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Users</TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <AdminPosts />
        </TabsContent>

        <TabsContent value="content">
          <AdminContent />
        </TabsContent>

        <TabsContent value="gallery">
          <AdminGallery />
        </TabsContent>

        <TabsContent value="banners">
          <AdminBanners />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="reports">
          <AdminReports />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
