
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, Eye, Image, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  view_count: number;
  created_at: string;
  thumbnail_url?: string;
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

interface StoryCardProps {
  story: Post;
  index: number;
}

const StoryCard = ({ story, index }: StoryCardProps) => {
  const { t } = useI18n();

  const parseContent = (content: string): ParsedContent => {
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
  };

  const parsedContent = parseContent(story.content);
  const hasMedia = (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) || 
                 (parsedContent.videoLinks && parsedContent.videoLinks.length > 0);

  // Get thumbnail - proper fallback logic: thumbnail_url → first imageLink → placeholder
  const getThumbnail = () => {
    // First priority: use thumbnail_url if available
    if (story.thumbnail_url) {
      return story.thumbnail_url;
    }
    
    // Second priority: use first image from imageLinks if available
    if (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) {
      return parsedContent.imageLinks[0];
    }
    
    // Fallback: use placeholder
    return "/placeholder.svg";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Link component will handle navigation
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link 
      to={`/story/${story.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${t("story.open")}: ${story.title}`}
    >
      <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.02] cursor-pointer border-0 shadow-lg animate-fade-in transition-all duration-300 min-h-[44px]" style={{ animationDelay: `${index * 0.1}s` }}>
        {/* Thumbnail Image */}
        <AspectRatio ratio={16 / 9} className="overflow-hidden bg-muted">
          <img
            src={getThumbnail()}
            alt={story.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
              target.onerror = null; // Prevent infinite loop
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.naturalWidth === 0 || target.naturalHeight === 0) {
                target.src = "/placeholder.svg";
              }
            }}
          />
          
          {/* Tags overlay */}
          <div className="absolute top-2 left-2">
            <div className="flex flex-wrap gap-1">
              {parsedContent.tags && parsedContent.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-background/90 text-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Media indicators */}
          {hasMedia && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {parsedContent.imageLinks && parsedContent.imageLinks.length > 0 && (
                <div className="bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  {parsedContent.imageLinks.length}
                </div>
              )}
              {parsedContent.videoLinks && parsedContent.videoLinks.length > 0 && (
                <div className="bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {parsedContent.videoLinks.length}
                </div>
              )}
            </div>
          )}
        </AspectRatio>

        <div className="p-6">
          <CardHeader className="px-0 pt-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                {story.type}
              </Badge>
            </div>
            <CardTitle className="text-xl font-serif mb-2 hover:text-primary transition-colors line-clamp-2">
              {story.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span>{t("story.by_author")} {story.profiles?.full_name || t("story.anonymous")}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(story.created_at).toLocaleDateString()}
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-0">
            {parsedContent.story && (
              <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {parsedContent.story}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {story.view_count}
                </span>
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {Math.floor(Math.random() * 50) + 10}
                </span>
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {Math.floor(Math.random() * 20) + 5}
                </span>
              </div>
              <Button 
                variant="outline" 
                className="story-link min-h-[44px] min-w-[44px]"
                onClick={handleButtonClick}
                tabIndex={-1}
              >
                {t("story.read_more")}
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
};

export default StoryCard;
