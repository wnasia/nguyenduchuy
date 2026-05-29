
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Clock, Eye, Image, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { parsePostContent, stripHtmlAndDecode, decodeHtmlEntities } from "@/lib/htmlUtils";
import SocialShareButtons from "./SocialShareButtons";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  view_count: number;
  created_at: string;
  thumbnail_url?: string;
  slug?: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface StoryCardProps {
  story: Post;
  index: number;
}

const StoryCard = ({ story, index }: StoryCardProps) => {
  const { t } = useI18n();

  // Decode title for proper Vietnamese display
  const decodedTitle = decodeHtmlEntities(story.title);
  
  const parsedContent = parsePostContent(story.content);
  const hasMedia = (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) || 
                 (parsedContent.videoLinks && parsedContent.videoLinks.length > 0);

  // Get thumbnail - proper fallback logic: thumbnail_url → first imageLink → placeholder
  const getThumbnail = () => {
    if (story.thumbnail_url) {
      return story.thumbnail_url;
    }
    if (parsedContent.imageLinks && parsedContent.imageLinks.length > 0) {
      return parsedContent.imageLinks[0];
    }
    return "/placeholder.svg";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  };

  // Get decoded excerpt for display
  const storyExcerpt = stripHtmlAndDecode(parsedContent.story);

  return (
    <Link 
      to={`/story/${story.slug || story.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${t("story.open")}: ${decodedTitle}`}
    >
      <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] cursor-pointer border-0 shadow-lg animate-fade-in transition-all duration-300 min-h-[44px]" style={{ animationDelay: `${index * 0.1}s` }}>
        {/* Thumbnail Image */}
        <AspectRatio ratio={16 / 9} className="overflow-hidden bg-muted">
          <img
            src={getThumbnail()}
            alt={decodedTitle}
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

        <div className="p-4 sm:p-6">
          <CardHeader className="px-0 pt-0">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Badge variant="outline" className="text-xs">
                {story.type}
              </Badge>
            </div>
            <CardTitle className="text-lg sm:text-xl font-serif mb-1.5 sm:mb-2 hover:text-primary transition-colors line-clamp-2">
              {decodedTitle}
            </CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {new Date(story.created_at).toLocaleDateString()}
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-0">
            {storyExcerpt && (
              <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {storyExcerpt}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1 sm:gap-2">
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {story.view_count}
                </span>
                <span className="flex items-center gap-1 sm:gap-2">
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {Math.floor(Math.random() * 50) + 10}
                </span>
                <span className="flex items-center gap-1 sm:gap-2">
                  <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {Math.floor(Math.random() * 20) + 5}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SocialShareButtons 
                  url={`${window.location.origin}/story/${story.slug || story.id}`}
                  title={decodedTitle}
                  compact
                />
                <Button 
                  variant="outline" 
                  className="story-link min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px] text-xs sm:text-sm px-2 sm:px-4"
                >
                  {t("story.read_more")}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
};

export default StoryCard;
