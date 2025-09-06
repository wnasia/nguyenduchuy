import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, BookOpen, Camera, Eye, Image, Video, Sparkles, Star, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";

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
  const { t } = useI18n();
  const navigate = useNavigate();
  const [featuredStory, setFeaturedStory] = useState<Post | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [stats, setStats] = useState({
    stories: 0,
    images: 0,
    members: 0,
    views: 0
  });
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

  const fetchFeaturedStory = useCallback(async () => {
    try {
      // Always get the newest post as featured story
      let { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching featured story:', error);
        setFeaturedStory(null);
        return;
      }

      if (postsData && postsData.length > 0) {
        const post = postsData[0];
        
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', post.user_id)
            .single();

          setFeaturedStory({
            ...post,
            profiles: profileData
          });
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          setFeaturedStory({
            ...post,
            profiles: { full_name: t("story.anonymous") }
          });
        }
      } else {
        setFeaturedStory(null);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setFeaturedStory(null);
    }
  }, [t]);

  const fetchGalleryImages = useCallback(async () => {
    try {
      const { data: galleryData, error } = await supabase
        .from('gallery_images')
        .select('image_url')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Error fetching gallery images:', error);
        setGalleryImages([]);
        return;
      }

      const imageUrls = galleryData?.map(img => img.image_url) || [];
      setGalleryImages(imageUrls);
    } catch (error) {
      console.error('Unexpected error:', error);
      setGalleryImages([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all data in parallel for better performance
      const [
        { count: storiesCount },
        { count: usersCount },
        { data: viewsData },
        { data: postsData }
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('posts')
          .select('view_count')
          .eq('status', 'approved'),
        supabase
          .from('posts')
          .select('content')
          .eq('status', 'approved')
      ]);

      const totalViews = viewsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

      let totalImages = 0;
      postsData?.forEach(post => {
        try {
          const parsed = JSON.parse(post.content);
          if (parsed.imageLinks) {
            totalImages += parsed.imageLinks.length;
          }
        } catch {
          // Skip if not JSON
        }
      });

      setStats({
        stories: storiesCount || 0,
        images: totalImages,
        members: usersCount || 0,
        views: totalViews
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        stories: 0,
        images: 0,
        members: 0,
        views: 0
      });
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Set a timeout for all operations
        await Promise.race([
          Promise.all([fetchFeaturedStory(), fetchStats(), fetchGalleryImages()]),
          new Promise(resolve => setTimeout(resolve, 10000)) // 10 second timeout
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Update document title
    document.title = t("meta.home_title");
  }, [fetchFeaturedStory, fetchStats, fetchGalleryImages, t]);

  const handleReadStory = () => {
    if (featuredStory) {
      navigate(`/story/${featuredStory.id}`);
    }
  };

  const handleGalleryImageClick = () => {
    navigate('/gallery');
  };

  const statsData = [
    { icon: BookOpen, label: t("home.stats_stories"), value: stats.stories.toLocaleString() },
    { icon: Camera, label: t("home.stats_photos"), value: stats.images.toLocaleString() },
    { icon: Users, label: t("home.stats_members"), value: stats.members.toLocaleString() },
    { icon: Eye, label: t("home.stats_views"), value: stats.views.toLocaleString() }
  ];

  const featuredContent = featuredStory ? parseContent(featuredStory.content) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading your stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Warm and Inviting */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-16 w-3 h-3 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-20 w-2 h-2 bg-primary/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative">
          {/* Handwritten note effect */}
          <div className="handwritten text-center mb-4 opacity-75">
            "Your story matters. Share it." 
            <Heart className="inline-block ml-2 h-5 w-5 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-semibold text-foreground mb-6 animate-fade-in">
            {t("home.hero_title")}{" "}
            <span className="text-primary relative inline-block">
              {t("home.hero_title_highlight")}
              <Sparkles className="absolute -top-4 -right-8 h-8 w-8 text-primary/60 float-gentle" />
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            {t("home.hero_subtitle")}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link to="/submit">
              <Button className="btn-warm text-lg h-14 px-10 group">
                <Heart className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                {t("home.share_story_btn")}
              </Button>
            </Link>
            <Link to="/stories">
              <Button className="btn-outline-warm text-lg h-14 px-10 group">
                <BookOpen className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                {t("home.read_stories_btn")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Polaroid Style */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <div 
                key={index} 
                className="story-card paper-texture text-center p-6 hover-lift group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative">
                  <stat.icon className="h-12 w-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-all duration-300" />
                  <Star className="absolute -top-2 -right-2 h-4 w-4 text-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2 font-serif">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Story - Story Card Style */}
      {featuredStory && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4 text-foreground">
                {t("home.featured_story_title")}
              </h2>
              <div className="handwritten text-primary/70">
                A beautiful story awaits...
              </div>
            </div>
            
            <Card className="story-card overflow-hidden paper-texture hover-lift cursor-pointer group max-w-5xl mx-auto">
              <div className="md:flex">
                <div className="md:w-1/2 relative overflow-hidden">
                  {featuredContent?.imageLinks && featuredContent.imageLinks.length > 0 ? (
                    <div className="relative">
                      <img
                        src={featuredContent.imageLinks[0]}
                        alt={featuredStory.title}
                        className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      {featuredContent.imageLinks.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/80 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm">
                          <Image className="h-4 w-4" />
                          +{featuredContent.imageLinks.length - 1} {t("home.more_photos")}
                        </div>
                      )}
                    </div>
                   ) : (
                     <div className="w-full h-64 md:h-full bg-muted flex items-center justify-center">
                       <div className="text-center opacity-50">
                         <Camera className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                         <p className="text-muted-foreground">Story image</p>
                       </div>
                     </div>
                   )}
                  {featuredContent?.videoLinks && featuredContent.videoLinks.length > 0 && (
                    <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm">
                      <Video className="h-4 w-4" />
                      {featuredContent.videoLinks.length} {featuredContent.videoLinks.length === 1 ? t("home.video") : t("home.videos")}
                    </div>
                  )}
                </div>
                
                <div className="md:w-1/2 p-8 md:p-10">
                  <CardHeader className="px-0 pt-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredContent?.tags && featuredContent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-3 py-1 bg-primary/10 text-primary border-none">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs px-3 py-1 border-primary/30 text-primary">
                        {featuredStory.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-serif mb-3 text-foreground leading-relaxed">
                      {featuredStory.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground flex items-center gap-4 mb-6">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {featuredStory.profiles?.full_name || t("home.anonymous")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {featuredStory.view_count} {t("home.views")}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <p className="text-foreground/80 leading-relaxed mb-8 text-lg line-clamp-4">
                      {featuredContent?.story || t("home.story_placeholder")}
                    </p>
                    <Button 
                      variant="outline" 
                      className="story-link border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 rounded-full group"
                      onClick={handleReadStory}
                    >
                      <MessageCircle className="mr-2 h-4 w-4 group-hover:animate-bounce" />
                      {t("home.read_full_story")}
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Gallery Preview - Scrapbook Style */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4 text-foreground">
              {t("home.memory_gallery_title")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("home.memory_gallery_subtitle")}
            </p>
            <div className="handwritten text-primary/70 mt-2">
              Cherished moments...
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {galleryImages.slice(0, 4).map((image, index) => (
              <div 
                key={index} 
                className="story-card aspect-square overflow-hidden hover-lift cursor-pointer group paper-texture"
                onClick={handleGalleryImageClick}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`,
                }}
              >
                <div className="relative h-full">
                  <img
                    src={image}
                    alt={`Memory ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/placeholder.svg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/gallery">
              <Button className="btn-outline-warm text-lg px-10 py-3 group">
                <Camera className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                {t("home.view_full_gallery")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Heartfelt Invitation */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="story-card paper-texture p-12 md:p-16 hover-lift">
            <div className="handwritten text-primary/70 mb-4">
              We're waiting for you...
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-8 text-foreground leading-relaxed">
              {t("home.cta_title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              {t("home.cta_subtitle")}
            </p>
            <Link to="/submit">
              <Button className="btn-warm text-lg h-16 px-12 group">
                <Sparkles className="mr-2 h-6 w-6 group-hover:animate-spin" />
                {t("home.get_started_btn")}
                <Heart className="ml-2 h-5 w-5 group-hover:animate-pulse" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;