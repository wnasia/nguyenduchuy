
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, BookOpen, Camera } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const featuredStory = {
    title: "A Letter to My Younger Self",
    excerpt: "If I could go back and tell my 20-year-old self just one thing, it would be to trust the journey. Life has a way of working out, even when it doesn't feel like it...",
    author: "Sarah M.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop"
  };

  const stats = [
    { icon: BookOpen, label: "Stories Shared", value: "1,247" },
    { icon: Camera, label: "Photos Uploaded", value: "8,923" },
    { icon: Users, label: "Community Members", value: "5,601" },
    { icon: Heart, label: "Hearts Given", value: "24,156" }
  ];

  const recentVideos = [
    {
      title: "My Grandmother's Recipe",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "3:45"
    },
    {
      title: "First Day at College",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "5:22"
    },
    {
      title: "Wedding Day Memories",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "7:18"
    }
  ];

  const galleryImages = [
    "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=300&h=300&fit=crop"
  ];

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
            {stats.map((stat, index) => (
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
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-12">Featured Story</h2>
          <Card className="overflow-hidden hover-scale cursor-pointer border-0 shadow-xl">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img
                  src={featuredStory.image}
                  alt={featuredStory.title}
                  className="w-full h-64 md:h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-serif mb-2">{featuredStory.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-500">by {featuredStory.author}</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <p className="text-gray-700 leading-relaxed mb-6">{featuredStory.excerpt}</p>
                  <Link to="/stories">
                    <Button variant="outline" className="story-link">Read Full Story</Button>
                  </Link>
                </CardContent>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">Memory Gallery</h2>
            <p className="text-gray-600">Moments captured, memories cherished</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {galleryImages.map((image, index) => (
              <div key={index} className="aspect-square overflow-hidden rounded-lg hover-scale">
                <img
                  src={image}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover"
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

      {/* Recent Videos */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">Recent Video Stories</h2>
            <p className="text-gray-600">Life in motion, stories that move us</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {recentVideos.map((video, index) => (
              <Card key={index} className="overflow-hidden hover-scale cursor-pointer">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                    {video.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900">{video.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Link to="/videos">
              <Button variant="outline" className="px-8">Watch More Videos</Button>
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
