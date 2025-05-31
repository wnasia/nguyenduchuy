
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Heart, MessageCircle, Clock } from "lucide-react";

const Videos = () => {
  const videos = [
    {
      id: 1,
      title: "My Grandmother's Secret Recipe",
      description: "After she passed, I found her handwritten recipe book. This is the story of recreating her famous apple pie and the memories that came flooding back.",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "8:45",
      views: "15.2K",
      hearts: 324,
      comments: 89,
      author: "Maria S.",
      uploadDate: "3 days ago",
      tags: ["Family", "Cooking", "Memories"]
    },
    {
      id: 2,
      title: "Teaching My Son to Drive",
      description: "The day I handed over the keys was terrifying and beautiful. Here's what happened when we hit the road together for the first time.",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "12:30",
      views: "8.7K",
      hearts: 256,
      comments: 67,
      author: "Robert T.",
      uploadDate: "1 week ago",
      tags: ["Parenting", "Milestones", "Family"]
    },
    {
      id: 3,
      title: "Returning to My Childhood Home",
      description: "25 years later, I walked through the door of my childhood home. Nothing was the same, yet everything felt familiar.",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "15:22",
      views: "23.1K",
      hearts: 542,
      comments: 156,
      author: "Jennifer L.",
      uploadDate: "2 weeks ago",
      tags: ["Nostalgia", "Home", "Memories"]
    },
    {
      id: 4,
      title: "Learning to Dance at 65",
      description: "They say you can't teach an old dog new tricks. At 65, I decided to prove them wrong by taking ballroom dancing lessons.",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "6:18",
      views: "31.5K",
      hearts: 789,
      comments: 234,
      author: "Dorothy W.",
      uploadDate: "3 weeks ago",
      tags: ["Dancing", "Aging", "Dreams"]
    },
    {
      id: 5,
      title: "My Wedding Day Disaster (And Why It Was Perfect)",
      description: "Everything that could go wrong did go wrong on our wedding day. But looking back, it made our love story even more beautiful.",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "10:15",
      views: "45.8K",
      hearts: 1203,
      comments: 398,
      author: "Sarah & Mike",
      uploadDate: "1 month ago",
      tags: ["Wedding", "Love", "Humor"]
    },
    {
      id: 6,
      title: "Finding Purpose After Retirement",
      description: "Retirement wasn't what I expected. Here's how I found my true calling at 62 and why it's never too late to start over.",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      duration: "14:42",
      views: "19.3K",
      hearts: 467,
      comments: 123,
      author: "Frank M.",
      uploadDate: "1 month ago",
      tags: ["Retirement", "Purpose", "New Beginnings"]
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Video Stories</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Life in motion. Stories told through the power of video, 
            bringing emotions and experiences to life in ways words alone cannot.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <Card key={video.id} className="overflow-hidden hover-scale cursor-pointer border-0 shadow-lg animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 rounded-full p-3">
                    <Play className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                  {video.duration}
                </div>
                <div className="absolute top-2 left-2">
                  <div className="flex flex-wrap gap-1">
                    {video.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-white/90 text-gray-800">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-serif line-clamp-2 hover:text-primary transition-colors">
                  {video.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  by {video.author} • {video.uploadDate}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                  {video.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {video.views} views
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {video.hearts}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {video.comments}
                    </span>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="px-8">
            Load More Videos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Videos;
