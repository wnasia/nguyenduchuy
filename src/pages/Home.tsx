import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, TrendingUp, Users, Eye, ArrowRight, Clock, Flame, Star, Tag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/contexts/AuthContext";
import BannerSlider from "@/components/BannerSlider";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  view_count: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface ParsedContent {
  story: string;
  imageLinks?: string[];
  videoLinks?: string[];
  tags?: string[];
}

const Home = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("hot");
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [stats, setStats] = useState({
    stories: 0,
    images: 0,
    members: 0,
    views: 0
  });
  const [activeBanner, setActiveBanner] = useState<{ image_url: string; link_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const parseContent = useCallback((content: string): ParsedContent => {
    try {
      const parsed = JSON.parse(content);
      return {
        story: parsed.story || '',
        imageLinks: parsed.imageLinks || [],
        videoLinks: parsed.videoLinks || [],
        tags: parsed.tags || []
      };
    } catch {
      return {
        story: content,
        imageLinks: [],
        videoLinks: [],
        tags: []
      };
    }
  }, []);

  const fetchHotPosts = useCallback(async () => {
    try {
      let { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('view_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (postsData && postsData.length > 0) {
        const postsWithProfiles = await Promise.all(
          postsData.map(async (post) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', post.user_id)
              .single();
            return { ...post, profiles: profileData };
          })
        );
        setHotPosts(postsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching hot posts:', error);
    }
  }, []);

  const fetchLatestPosts = useCallback(async () => {
    try {
      let { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (postsData && postsData.length > 0) {
        const postsWithProfiles = await Promise.all(
          postsData.map(async (post) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', post.user_id)
              .single();
            return { ...post, profiles: profileData };
          })
        );
        setLatestPosts(postsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching latest posts:', error);
    }
  }, []);

  const fetchTopPosts = useCallback(async () => {
    try {
      let { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('view_count', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (postsData && postsData.length > 0) {
        const postsWithProfiles = await Promise.all(
          postsData.map(async (post) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', post.user_id)
              .single();
            return { ...post, profiles: profileData };
          })
        );
        setTopPosts(postsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching top posts:', error);
    }
  }, []);

  const fetchGalleryImages = useCallback(async () => {
    try {
      const { data: galleryData, error } = await supabase
        .from('gallery_images')
        .select('image_url')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setGalleryImages(galleryData?.map(img => img.image_url) || []);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  }, []);

  const fetchPopularTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('content')
        .eq('status', 'approved')
        .limit(50);

      if (error) throw error;

      const tagsMap = new Map<string, number>();
      data?.forEach(post => {
        const parsed = parseContent(post.content);
        parsed.tags?.forEach(tag => {
          tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
        });
      });

      const sortedTags = Array.from(tagsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag]) => tag);

      setPopularTags(sortedTags);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
    }
  }, [parseContent]);

  const fetchStats = useCallback(async () => {
    try {
      const [
        { count: storiesCount },
        { count: usersCount },
        { data: viewsData },
        { data: postsData }
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('view_count').eq('status', 'approved'),
        supabase.from('posts').select('content').eq('status', 'approved')
      ]);

      const totalViews = viewsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

      let totalImages = 0;
      postsData?.forEach(post => {
        const parsed = parseContent(post.content);
        totalImages += parsed.imageLinks?.length || 0;
      });

      setStats({
        stories: storiesCount || 0,
        images: totalImages,
        members: usersCount || 0,
        views: totalViews
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [parseContent]);

  const fetchActiveBanner = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_banners')
        .select('image_url, link_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveBanner(data);
    } catch (error) {
      console.error('Error fetching banner:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchHotPosts(),
        fetchLatestPosts(),
        fetchTopPosts(),
        fetchGalleryImages(),
        fetchPopularTags(),
        fetchStats(),
        fetchActiveBanner()
      ]);
      setLoading(false);
    };

    loadData();
    document.title = t("meta.home_title");
  }, [fetchHotPosts, fetchLatestPosts, fetchTopPosts, fetchGalleryImages, fetchPopularTags, fetchStats, fetchActiveBanner, t]);

  const handleReadStory = (id: string) => {
    navigate(`/story/${id}`);
  };

  const handleGalleryImageClick = () => {
    navigate('/gallery');
  };

  const handleShareNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/submit');
  };

  const getPostExcerpt = (content: string, maxLength: number = 120) => {
    const parsed = parseContent(content);
    const text = parsed.story.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getPostThumbnail = (content: string): string | null => {
    const parsed = parseContent(content);
    return parsed.imageLinks && parsed.imageLinks.length > 0 ? parsed.imageLinks[0] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPosts = activeTab === "hot" ? hotPosts : activeTab === "latest" ? latestPosts : topPosts;

  return (
    <div className="min-h-screen bg-background">
      {/* Homepage Banner - Replaces "Chia sẻ" Hero Section */}
      {activeBanner ? (
        <section className="relative w-full">
          {activeBanner.link_url ? (
            <a href={activeBanner.link_url} target="_blank" rel="noopener noreferrer" className="block">
              <img 
                src={activeBanner.image_url} 
                alt="Homepage Banner" 
                className="w-full h-auto max-h-[400px] object-cover"
              />
            </a>
          ) : (
            <img 
              src={activeBanner.image_url} 
              alt="Homepage Banner" 
              className="w-full h-auto max-h-[400px] object-cover"
            />
          )}
        </section>
      ) : (
        /* Sample animated banners when no admin banner is active */
        <BannerSlider />
      )}

      {/* Main Content Area with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Feed */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6">
                <TabsTrigger value="hot" className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  <span>Hot</span>
                </TabsTrigger>
                <TabsTrigger value="latest" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Mới nhất</span>
                </TabsTrigger>
                <TabsTrigger value="favorite" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Yêu thích</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {currentPosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Chưa có bài viết nào
                  </div>
                ) : (
                  currentPosts.map((post) => {
                    const thumbnail = getPostThumbnail(post.content);
                    const excerpt = getPostExcerpt(post.content);
                    
                    return (
                      <div 
                        key={post.id}
                        onClick={() => handleReadStory(post.id)}
                        className="flex gap-4 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all cursor-pointer group"
                      >
                        {thumbnail && (
                          <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={thumbnail} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-medium">{post.profiles?.full_name || "Anonymous"}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{post.view_count}</span>
                            </div>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Stories */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Stories
              </h3>
              <div className="space-y-3">
                {hotPosts.slice(0, 5).map((post, index) => (
                  <div 
                    key={post.id}
                    onClick={() => handleReadStory(post.id)}
                    className="flex gap-3 cursor-pointer group"
                  >
                    <span className="text-2xl font-bold text-muted-foreground/30 flex-shrink-0">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{post.view_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Topics */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Chủ đề phổ biến
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Thống kê cộng đồng
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Câu chuyện</span>
                  <span className="font-semibold text-foreground">{stats.stories.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hình ảnh</span>
                  <span className="font-semibold text-foreground">{stats.images.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Thành viên</span>
                  <span className="font-semibold text-foreground">{stats.members.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lượt xem</span>
                  <span className="font-semibold text-foreground">{stats.views.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section - Show only 4 images */}
      {galleryImages.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Thư viện ảnh
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {galleryImages.map((imageUrl, index) => (
                <div 
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={handleGalleryImageClick}
                >
                  <img 
                    src={imageUrl} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button 
                onClick={handleGalleryImageClick} 
                variant="outline"
                size="lg"
                className="min-w-[200px]"
              >
                Xem thêm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured This Month / Top Voted Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
            Nổi bật trong tháng
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topPosts.slice(0, 6).map((post) => {
              const thumbnail = getPostThumbnail(post.content);
              const excerpt = getPostExcerpt(post.content, 80);
              
              return (
                <div 
                  key={post.id}
                  onClick={() => handleReadStory(post.id)}
                  className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  {thumbnail && (
                    <div className="aspect-video w-full bg-muted overflow-hidden">
                      <img 
                        src={thumbnail} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium">{post.profiles?.full_name || "Anonymous"}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.view_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
