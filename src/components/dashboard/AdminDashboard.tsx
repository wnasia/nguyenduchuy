
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, AlertTriangle, DollarSign } from "lucide-react";
import AdminPosts from "./AdminPosts";
import AdminReports from "./AdminReports";
import AdminUsers from "./AdminUsers";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  pendingReports: number;
  totalEarnings: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    pendingReports: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        // Fetch pending reports
        const { count: reportsCount, error: reportsError } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch total earnings
        const { data: walletData, error: walletError } = await supabase
          .from('wallet')
          .select('total_earned');

        if (usersError || postsError || reportsError || walletError) {
          console.error('Error fetching stats:', { usersError, postsError, reportsError, walletError });
          toast({
            title: "Error",
            description: "Failed to load dashboard statistics",
            variant: "destructive",
          });
        } else {
          const totalEarnings = walletData?.reduce((sum, wallet) => sum + (wallet.total_earned || 0), 0) || 0;
          
          setStats({
            totalUsers: usersCount || 0,
            totalPosts: postsCount || 0,
            pendingReports: reportsCount || 0,
            totalEarnings,
          });
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

    fetchDashboardStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, posts, and reports</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEarnings.toFixed(2)} VND</div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Posts Management</TabsTrigger>
          <TabsTrigger value="users">Users Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <AdminPosts />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="reports">
          <AdminReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
