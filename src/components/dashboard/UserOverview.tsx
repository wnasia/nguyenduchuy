import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, FileText, TrendingUp, Image as ImageIcon, Youtube, Eye, Clock } from "lucide-react";

interface WalletData {
  balance: number;
  total_earned: number;
}

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
  const [wallet, setWallet] = useState<WalletData | null>(null);
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
        // Fetch wallet data
        const { data: walletData, error: walletError } = await supabase
          .from('wallet')
          .select('balance, total_earned')
          .eq('user_id', user.id)
          .single();

        if (walletError && walletError.code !== 'PGRST116') {
          console.error('Error fetching wallet:', walletError);
        } else {
          setWallet(walletData);
        }

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
    {
      title: "Current Balance",
      value: `${wallet?.balance?.toFixed(0) || '0'} VND`,
      icon: Wallet,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Earned",
      value: `${wallet?.total_earned?.toFixed(0) || '0'} VND`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "My Stories",
      value: postsCount.toString(),
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "My Images",
      value: imagesCount.toString(),
      icon: ImageIcon,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "My Videos",
      value: videosCount.toString(),
      icon: Youtube,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              You haven't created any stories yet. Click "Create Story" to get started!
            </p>
          ) : (
            <div className="space-y-3">
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
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(post.status)}`}>
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
