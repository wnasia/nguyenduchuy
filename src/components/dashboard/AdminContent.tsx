import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Calendar, Image, Video, Tag, DollarSign, User } from "lucide-react";
import { parsePostContent, stripHtmlAndDecode, decodeHtmlEntities } from "@/lib/htmlUtils";

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

interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  created_at: string;
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

const AdminContent = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      // Fetch all posts
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
      } else {
        // Fetch profile data for posts
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
      }

      // Fetch all wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallet')
        .select('*')
        .order('total_earned', { ascending: false });

      if (walletsError) {
        console.error('Error fetching wallets:', walletsError);
        toast({
          title: "Error",
          description: "Failed to load wallet data",
          variant: "destructive",
        });
      } else {
        // Fetch profile data for wallets
        const walletsWithProfiles = await Promise.all(
          (walletsData || []).map(async (wallet) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', wallet.user_id)
              .single();

            return {
              ...wallet,
              profiles: profileData
            };
          })
        );
        setWallets(walletsWithProfiles);
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

  const parseContent = (content: string): ParsedContent => {
    const parsed = parsePostContent(content);
    return {
      story: stripHtmlAndDecode(parsed.story),
      imageLinks: parsed.imageLinks || [],
      videoLinks: parsed.videoLinks || [],
      tags: parsed.tags || []
    };
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

  // Get all unique images and videos from posts
  const getAllMedia = () => {
    const allImages: string[] = [];
    const allVideos: string[] = [];

    posts.forEach(post => {
      const parsed = parseContent(post.content);
      if (parsed.imageLinks) {
        allImages.push(...parsed.imageLinks);
      }
      if (parsed.videoLinks) {
        allVideos.push(...parsed.videoLinks);
      }
    });

    return { images: allImages, videos: allVideos };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { images, videos } = getAllMedia();

  return (
    <Card>
      <CardHeader>
        <CardTitle>All User Content</CardTitle>
        <CardDescription>Complete overview of all user-generated content</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="posts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">All Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="wallets">Wallets ({wallets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {posts.map((post) => {
              const parsedContent = parseContent(post.content);
              const hasMedia = (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) || 
                             (parsedContent.videoLinks && parsedContent.videoLinks.length > 0);
              
              return (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{decodeHtmlEntities(post.title)}</h3>
                      <p className="text-sm text-gray-500">
                        By {post.profiles?.full_name || 'Unknown User'} ({post.profiles?.email || 'No email'})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusBadgeVariant(post.status)}>
                        {post.status}
                      </Badge>
                      <Badge variant="outline">{post.type}</Badge>
                    </div>
                  </div>
                  
                  {parsedContent.story && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {parsedContent.story}
                    </p>
                  )}

                  {/* Tags */}
                  {parsedContent.tags && parsedContent.tags.length > 0 && (
                    <div className="mb-3">
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
                    <div className="mb-3 flex items-center gap-4 text-sm text-gray-600">
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
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            {images.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No images uploaded yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((imageUrl, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-2">
                    <img 
                      src={imageUrl} 
                      alt={`User uploaded image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-2 truncate">{imageUrl}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            {videos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No videos uploaded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((videoUrl, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">Video {index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 break-all">{videoUrl}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <h3 className="font-semibold">{wallet.profiles?.full_name || 'Unknown User'}</h3>
                      <p className="text-sm text-gray-500">{wallet.profiles?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{wallet.balance.toFixed(2)} VND</span>
                    </div>
                    <p className="text-xs text-gray-500">Balance</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Total Earned: {wallet.total_earned.toFixed(2)} VND</span>
                  <span>Joined: {new Date(wallet.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminContent;
