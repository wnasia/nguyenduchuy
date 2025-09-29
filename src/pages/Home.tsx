import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, BookOpen, Camera, Eye, Image, Video, Star, MessageCircle, ArrowRight } from "lucide-react";
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
        await Promise.race([
          Promise.all([fetchFeaturedStory(), fetchStats(), fetchGalleryImages()]),
          new Promise(resolve => setTimeout(resolve, 10000))
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading your stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean Hero Section */}
      <section className="relative py-20 lg:py-32 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              {t("home.hero_title")}{" "}
              <span className="gradient-text">
                {t("home.hero_title_highlight")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              {t("home.hero_subtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/submit">
                <Button size="lg" className="px-8 py-3 text-lg">
                  <Heart className="mr-2 h-5 w-5" />
                  {t("home.share_story_btn")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/stories">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t("home.read_stories_btn")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Stats Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsData.map((stat, index) => (
              <Card key={index} className="clean-card text-center p-6">
                <CardContent className="space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clean Featured Story Section */}
      {featuredStory && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                {t("home.featured_story_title")}
              </h2>
              <p className="text-lg text-muted-foreground">
                Discover inspiring stories from our community
              </p>
            </div>
            
            <Card className="clean-card max-w-5xl mx-auto overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="relative overflow-hidden">
                  {featuredContent?.imageLinks && featuredContent.imageLinks.length > 0 ? (
                    <div className="relative">
                      <img
                        src={featuredContent.imageLinks[0]}
                        alt={featuredStory.title}
                        className="w-full h-64 md:h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      {featuredContent.imageLinks.length > 1 && (
                        <Badge className="absolute bottom-3 right-3 bg-black/80 text-white">
                          <Image className="h-3 w-3 mr-1" />
                          +{featuredContent.imageLinks.length - 1}
                        </Badge>
                      )}
                    </div>
                   ) : (
                     <div className="w-full h-64 md:h-full bg-muted/50 flex items-center justify-center">
                       <Camera className="h-16 w-16 text-muted-foreground/50" />
                     </div>
                   )}
                  {featuredContent?.videoLinks && featuredContent.videoLinks.length > 0 && (
                    <Badge className="absolute top-3 right-3 bg-black/80 text-white">
                      <Video className="h-3 w-3 mr-1" />
                      {featuredContent.videoLinks.length}
                    </Badge>
                  )}
                </div>
                
                <div className="p-8 md:p-10">
                  <CardHeader className="px-0 pt-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredContent?.tags && featuredContent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">
                        {featuredStory.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
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
                    <p className="text-foreground/80 leading-relaxed mb-6 line-clamp-4">
                      {featuredContent?.story || t("home.story_placeholder")}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleReadStory}
                      className="w-fit"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t("home.read_full_story")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Clean Gallery Preview */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t("home.memory_gallery_title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("home.memory_gallery_subtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {galleryImages.slice(0, 4).map((image, index) => (
              <Card 
                key={index} 
                className="clean-card aspect-square overflow-hidden cursor-pointer group"
                onClick={handleGalleryImageClick}
              >
                <div className="relative h-full">
                  <img
                    src={image}
                    alt={`Memory ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `/placeholder.svg`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Link to="/gallery">
              <Button variant="outline" size="lg" className="px-8 py-3">
                <Camera className="mr-2 h-5 w-5" />
                {t("home.view_full_gallery")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Call to Action */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="clean-card">
            <CardContent className="p-12 md:p-16 text-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                  Your Story Matters
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Join thousands of people sharing their authentic experiences and connecting through the power of storytelling.
                </p>
                <Link to="/submit">
                  <Button size="lg" className="px-10 py-4 text-lg">
                    <Heart className="mr-2 h-5 w-5" />
                    Share Your Story Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;