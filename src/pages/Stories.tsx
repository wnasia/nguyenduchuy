
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock } from "lucide-react";

const Stories = () => {
  const stories = [
    {
      id: 1,
      title: "A Letter to My Younger Self",
      excerpt: "If I could go back and tell my 20-year-old self just one thing, it would be to trust the journey. Life has a way of working out, even when it doesn't feel like it. The struggles you're facing now? They're shaping you into someone stronger...",
      author: "Sarah M.",
      date: "2 days ago",
      readTime: "5 min read",
      hearts: 247,
      comments: 18,
      tags: ["Life Lessons", "Personal Growth"],
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop"
    },
    {
      id: 2,
      title: "The Day I Found My Grandmother's Recipe Box",
      excerpt: "Hidden in the attic for twenty years, my grandmother's handwritten recipe cards told stories I never knew. Each ingredient was measured with love, each instruction written with care. The chocolate chip cookie recipe had a note: 'Double the chocolate when the grandkids visit'...",
      author: "Michael R.",
      date: "1 week ago",
      readTime: "7 min read",
      hearts: 189,
      comments: 25,
      tags: ["Family", "Memories", "Food"],
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=300&fit=crop"
    },
    {
      id: 3,
      title: "Learning to Love Again After Loss",
      excerpt: "They say time heals all wounds, but I've learned that's not quite right. Time doesn't heal—it teaches. It taught me that love doesn't end with death; it transforms. The love I had for my husband didn't disappear when he passed...",
      author: "Jennifer K.",
      date: "2 weeks ago",
      readTime: "10 min read",
      hearts: 412,
      comments: 67,
      tags: ["Love", "Loss", "Healing"],
      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=600&h=300&fit=crop"
    },
    {
      id: 4,
      title: "My First Day Teaching During a Pandemic",
      excerpt: "March 16th, 2020. The day everything changed. I walked into my empty classroom, knowing my students were watching through screens. Teaching through a computer felt impossible, but what happened next restored my faith in human connection...",
      author: "David L.",
      date: "3 weeks ago",
      readTime: "6 min read",
      hearts: 156,
      comments: 34,
      tags: ["Teaching", "Pandemic", "Resilience"],
      image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=600&h=300&fit=crop"
    },
    {
      id: 5,
      title: "The Courage to Start Over at 50",
      excerpt: "At 50, most people think their career is set in stone. I thought so too, until the company I'd worked at for 25 years closed its doors. That day felt like the end of the world, but it was actually the beginning of my real life...",
      author: "Patricia S.",
      date: "1 month ago",
      readTime: "8 min read",
      hearts: 298,
      comments: 45,
      tags: ["Career Change", "Courage", "New Beginnings"],
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop"
    },
    {
      id: 6,
      title: "Teaching My Daughter to Ride a Bike",
      excerpt: "Some moments define parenthood more than others. Watching my daughter wobble on her bicycle, determination written across her face, I realized I wasn't just teaching her to ride—I was teaching her to trust, to persist, to believe in herself...",
      author: "Carlos M.",
      date: "1 month ago",
      readTime: "4 min read",
      hearts: 203,
      comments: 29,
      tags: ["Parenting", "Childhood", "Milestones"],
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=300&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Life Stories</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real stories from real people. Each one a window into the human experience, 
            shared with courage and vulnerability.
          </p>
        </div>

        <div className="grid gap-8">
          {stories.map((story, index) => (
            <Card key={story.id} className="overflow-hidden hover-scale cursor-pointer border-0 shadow-lg animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-2/3 p-6">
                  <CardHeader className="px-0 pt-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {story.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-2xl font-serif mb-2 hover:text-primary transition-colors">
                      {story.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span>by {story.author}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {story.readTime}
                      </span>
                      <span>{story.date}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <p className="text-gray-700 leading-relaxed mb-6 line-clamp-3">
                      {story.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          {story.hearts}
                        </span>
                        <span className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {story.comments}
                        </span>
                      </div>
                      <Button variant="outline" className="story-link">
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="px-8">
            Load More Stories
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Stories;
