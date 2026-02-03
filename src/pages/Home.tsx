import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, ArrowRight, Clock, Flame, Star, Tag, User, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/contexts/AuthContext";
import { parsePostContent, getExcerpt, decodeHtmlEntities, type ParsedContent } from "@/lib/htmlUtils";
import SocialShareButtons from "@/components/SocialShareButtons";
import BannerSlider from "@/components/BannerSlider";
import GoldPriceWidget from "@/components/widgets/GoldPriceWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import LunarCalendarWidget from "@/components/LunarCalendarWidget";
import FlightSearchWidget from "@/components/flight/FlightSearchWidget";
import ExchangeRateWidget from "@/components/widgets/ExchangeRateWidget";
import CommunityStatsWidget from "@/components/widgets/CommunityStatsWidget";
interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  view_count: number;
  created_at: string;
  slug?: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
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
    return parsePostContent(content);
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
              .select('full_name, avatar_url')
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
              .select('full_name, avatar_url')
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
              .select('full_name, avatar_url')
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

  const handleReadStory = (slug: string | undefined, id: string) => {
    navigate(`/story/${slug || id}`);
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
    return getExcerpt(content, maxLength);
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
      {/* Banner Slider */}
      <BannerSlider />

      {/* Main Content Area with Sidebar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content Feed */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4 sm:mb-6 bg-muted h-auto p-1">
                <TabsTrigger value="hot" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-primary">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                  <span className="truncate">Hot</span>
                </TabsTrigger>
                <TabsTrigger value="latest" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-primary">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Mới nhất</span>
                </TabsTrigger>
                <TabsTrigger value="favorite" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-primary">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                  <span className="truncate">Yêu thích</span>
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
                        onClick={() => handleReadStory(post.slug, post.id)}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border border-border hover:shadow-md transition-all cursor-pointer group"
                      >
                        {thumbnail && (
                          <div className="flex-shrink-0 w-full sm:w-24 md:w-32 h-40 sm:h-24 md:h-32 rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={thumbnail} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {decodeHtmlEntities(post.title)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3 hidden sm:block">
                            {excerpt}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {post.profiles?.avatar_url ? (
                                  <img 
                                    src={post.profiles.avatar_url} 
                                    alt={post.profiles.full_name || "Author"}
                                    className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="font-medium truncate max-w-[100px] sm:max-w-none">{post.profiles?.full_name || t("common.unknown_author")}</span>
                              </div>
                              <span className="hidden sm:inline">•</span>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{post.view_count}</span>
                              </div>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <SocialShareButtons 
                              url={`${window.location.origin}/story/${post.slug || post.id}`}
                              title={decodeHtmlEntities(post.title)}
                              compact
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Full widgets restored */}
          <div className="hidden lg:block space-y-6">
            {/* 1. Vietnam Gold Price */}
            <GoldPriceWidget />

            {/* 2. Weather */}
            <WeatherWidget />

            {/* 3. Lunar / Solar Calendar */}
            <LunarCalendarWidget />

            {/* 4. Flight Booking */}
            <FlightSearchWidget />

            {/* 5. Exchange Rates */}
            <ExchangeRateWidget />

            {/* 6. Popular Topics */}
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

            {/* 7. Community Stats */}
            <CommunityStatsWidget />

            {/* Top Stories */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Bài viết nổi bật
              </h3>
              <div className="space-y-3">
                {hotPosts.slice(0, 5).map((post, index) => (
                  <div
                    key={post.id}
                    onClick={() => handleReadStory(post.slug, post.id)}
                    className="flex gap-3 cursor-pointer group"
                  >
                    <span className="text-2xl font-bold text-muted-foreground/30 flex-shrink-0">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {decodeHtmlEntities(post.title)}
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
          </div>
        </div>
      </div>

      {/* Photo Gallery Section - Show only 4 images */}
      {galleryImages.length > 0 && (
        <section className="py-6 sm:py-8 lg:py-12 px-3 sm:px-6 lg:px-8 bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6 lg:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-foreground">
                Thư viện ảnh
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
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
                  onClick={() => handleReadStory(post.slug, post.id)}
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
