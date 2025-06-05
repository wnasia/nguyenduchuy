
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, BookOpen, Camera, Eye, Image, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

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
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('view_count', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching featured story:', error);
        return;
      }

      if (postsData && postsData.length > 0) {
        const post = postsData[0];
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', post.user_id)
          .single();

        setFeaturedStory({
          ...post,
          profiles: profileData
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  const fetchGalleryImages = useCallback(async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('content')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching gallery images:', error);
        return;
      }

      const allImages: string[] = [];
      postsData?.forEach(post => {
        const parsed = parseContent(post.content);
        if (parsed.imageLinks) {
          allImages.push(...parsed.imageLinks);
        }
      });

      // Get first 8 images for gallery
      const selectedImages = allImages.slice(0, 8);
      
      // Fill with placeholder images if needed
      const placeholderImages = [
        "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=300&fit=crop",
        "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=300&h=300&fit=crop"
      ];

      while (selectedImages.length < 4 && placeholderImages.length > 0) {
        selectedImages.push(placeholderImages.shift()!);
      }

      setGalleryImages(selectedImages);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [parseContent]);

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
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFeaturedStory(), fetchStats(), fetchGalleryImages()]);
      setLoading(false);
    };

    loadData();
  }, [fetchFeaturedStory, fetchStats, fetchGalleryImages]);

  const handleReadStory = () => {
    if (featuredStory) {
      navigate(`/story/${featuredStory.id}`);
    }
  };

  const handleGalleryImageClick = () => {
    navigate('/gallery');
  };

  const statsData = [
    { icon: BookOpen, label: "Stories Shared", value: stats.stories.toLocaleString() },
    { icon: Camera, label: "Photos Uploaded", value: stats.images.toLocaleString() },
    { icon: Users, label: "Community Members", value: stats.members.toLocaleString() },
    { icon: Eye, label: "Total Views", value: stats.views.toLocaleString() }
  ];

  const featuredContent = featuredStory ? parseContent(featuredStory.content) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-semibold text-gray-900 mb-6 animate-fade-in">
            Share Your{" "}
            <span className="text-primary relative">
              Story
              <Heart className="absolute -top-2 -right-8 h-8 w-8 text-primary/60 animate-pulse" />
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            A warm place where life's precious moments, memories, and stories come together to create lasting connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/submit">
              <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg">
                Share Your Story
              </Button>
            </Link>
            <Link to="/stories">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-primary text-primary hover:bg-primary/5">
                Read Stories
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsData.map((stat, index) => (
              <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Story */}
      {featuredStory && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-12">Featured Story</h2>
            <Card className="overflow-hidden hover-scale cursor-pointer border-0 shadow-xl">
              <div className="md:flex">
                <div className="md:w-1/2 relative">
                  {featuredContent?.imageLinks && featuredContent.imageLinks.length > 0 ? (
                    <div className="relative">
                      <img
                        src={featuredContent.imageLinks[0]}
                        alt={featuredStory.title}
                        className="w-full h-64 md:h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop";
                        }}
                      />
                      {featuredContent.imageLinks.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                          <Image className="h-4 w-4" />
                          +{featuredContent.imageLinks.length - 1} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop"
                      alt={featuredStory.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  )}
                  {featuredContent?.videoLinks && featuredContent.videoLinks.length > 0 && (
                    <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      {featuredContent.videoLinks.length} video{featuredContent.videoLinks.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-8">
                  <CardHeader className="px-0 pt-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {featuredContent?.tags && featuredContent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">
                        {featuredStory.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-serif mb-2">{featuredStory.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-500 flex items-center gap-4">
                      <span>by {featuredStory.profiles?.full_name || 'Anonymous'}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {featuredStory.view_count} views
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <p className="text-gray-700 leading-relaxed mb-6 line-clamp-4">
                      {featuredContent?.story || 'A beautiful story waiting to be discovered...'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="story-link"
                      onClick={handleReadStory}
                    >
                      Read Full Story
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Gallery Preview */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">Memory Gallery</h2>
            <p className="text-gray-600">Moments captured, memories cherished</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {galleryImages.slice(0, 4).map((image, index) => (
              <div 
                key={index} 
                className="aspect-square overflow-hidden rounded-lg hover-scale cursor-pointer"
                onClick={handleGalleryImageClick}
              >
                <img
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `/placeholder.svg`;
                  }}
                />
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/gallery">
              <Button variant="outline" className="px-8">View Full Gallery</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-warm-200/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-6">Ready to Share Your Story?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Every story matters. Every memory has value. Join our community and let your voice be heard.
          </p>
          <Link to="/submit">
            <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
