import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, BookOpen, Camera, Eye, Image, Video, ArrowRight, MessageCircle } from "lucide-react";
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
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
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

  const fetchFeaturedPosts = useCallback(async () => {
    try {
      let { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching featured posts:', error);
        setFeaturedPosts([]);
        return;
      }

      if (postsData && postsData.length > 0) {
        const postsWithProfiles = await Promise.all(
          postsData.map(async (post) => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', post.user_id)
                .single();

              return {
                ...post,
                profiles: profileData
              };
            } catch (profileError) {
              console.error('Error fetching profile:', profileError);
              return {
                ...post,
                profiles: { full_name: t("story.anonymous") }
              };
            }
          })
        );
        
        setFeaturedPosts(postsWithProfiles);
      } else {
        setFeaturedPosts([]);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setFeaturedPosts([]);
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
          Promise.all([fetchFeaturedPosts(), fetchStats(), fetchGalleryImages()]),
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
  }, [fetchFeaturedPosts, fetchStats, fetchGalleryImages, t]);

  const handleReadStory = (id: string) => {
    navigate(`/story/${id}`);
  };

  const handleGalleryImageClick = () => {
    navigate('/gallery');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner Section */}
      <section className="relative py-20 lg:py-32 px-4 text-center bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Share Your{" "}
              <span className="gradient-text">
                Stories
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Connect with others through authentic storytelling, photos, and shared experiences
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/submit">
                <Button size="lg" className="px-8 py-3 text-lg">
                  <Heart className="mr-2 h-5 w-5" />
                  Share Your Story
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/stories">
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Read Stories
                </Button>
              </Link>
            </div>

            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stats.stories.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground font-medium">Stories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stats.images.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground font-medium">Photos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stats.members.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground font-medium">Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stats.views.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground font-medium">Views</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Featured Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover inspiring stories from our community
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPosts.slice(0, 6).map((post) => {
              const content = parseContent(post.content);
              return (
                <Card key={post.id} className="clean-card overflow-hidden group cursor-pointer" onClick={() => handleReadStory(post.id)}>
                  <div className="relative">
                    {content?.imageLinks && content.imageLinks.length > 0 ? (
                      <div className="relative">
                        <img
                          src={content.imageLinks[0]}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        {content.imageLinks.length > 1 && (
                          <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                            <Image className="h-3 w-3 mr-1" />
                            +{content.imageLinks.length - 1}
                          </Badge>
                        )}
                      </div>
                     ) : (
                       <div className="w-full h-48 bg-muted/50 flex items-center justify-center">
                         <Camera className="h-12 w-12 text-muted-foreground/50" />
                       </div>
                     )}
                    {content?.videoLinks && content.videoLinks.length > 0 && (
                      <Badge className="absolute top-2 right-2 bg-black/80 text-white">
                        <Video className="h-3 w-3 mr-1" />
                        {content.videoLinks.length}
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {content?.tags && content.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl font-bold line-clamp-2 text-foreground">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {post.profiles?.full_name || "Anonymous"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.view_count}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                      {content?.story || "Click to read this story..."}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/stories">
              <Button variant="outline" size="lg" className="px-8 py-3">
                <BookOpen className="mr-2 h-5 w-5" />
                View All Stories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Photo Gallery
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Visual memories and moments captured by our community
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {galleryImages.slice(0, 8).map((image, index) => (
              <Card 
                key={index} 
                className="clean-card aspect-square overflow-hidden cursor-pointer group"
                onClick={handleGalleryImageClick}
              >
                <div className="relative h-full">
                  <img
                    src={image}
                    alt={`Gallery image ${index + 1}`}
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
                View Full Gallery
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
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