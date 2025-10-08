
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, FileText, TrendingUp, Image as ImageIcon, Youtube } from "lucide-react";
import UserPosts from "./UserPosts";
import UserWallet from "./UserWallet";
import UserGallery from "./UserGallery";
import UserYouTube from "./UserYouTube";

interface WalletData {
  balance: number;
  total_earned: number;
}

interface GalleryStats {
  imagesCount: number;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [imagesCount, setImagesCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
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
          toast({
            title: "Error",
            description: "Failed to load wallet data",
            variant: "destructive",
          });
        } else {
          setWallet(walletData);
        }

        // Fetch posts count
        const { count: postsCountData, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (postsError) {
          console.error('Error fetching posts count:', postsError);
        } else {
          setPostsCount(postsCountData || 0);
        }

        // Fetch images count
        const { count: imagesCountData, error: imagesError } = await supabase
          .from('gallery_images')
          .select('*', { count: 'exact', head: true })
          .eq('uploaded_by', user.id);

        if (imagesError) {
          console.error('Error fetching images count:', imagesError);
        } else {
          setImagesCount(imagesCountData || 0);
        }

        // Fetch videos count
        const { count: videosCountData, error: videosError } = await supabase
          .from('youtube_videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (videosError) {
          console.error('Error fetching videos count:', videosError);
        } else {
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

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Dashboard</h1>
          <p className="text-gray-600">Manage your posts and earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallet?.balance?.toFixed(2) || '0.00'} VND</div>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallet?.total_earned?.toFixed(2) || '0.00'} VND</div>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Images</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{imagesCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{postsCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Videos</CardTitle>
              <Youtube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videosCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="gallery" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="gallery" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <ImageIcon className="h-4 w-4 mr-2" />
              Image Gallery
            </TabsTrigger>
            <TabsTrigger value="posts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              My Stories
            </TabsTrigger>
            <TabsTrigger value="youtube" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Youtube className="h-4 w-4 mr-2" />
              YouTube Videos
            </TabsTrigger>
            <TabsTrigger value="wallet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Wallet className="h-4 w-4 mr-2" />
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery">
            <UserGallery />
          </TabsContent>

          <TabsContent value="posts">
            <UserPosts />
          </TabsContent>

          <TabsContent value="youtube">
            <UserYouTube />
          </TabsContent>

          <TabsContent value="wallet">
            <UserWallet />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
