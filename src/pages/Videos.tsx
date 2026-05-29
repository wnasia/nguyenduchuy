import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { decodeHtmlEntities } from "@/lib/htmlUtils";

interface YouTubeVideo {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string | null;
  description: string | null;
  status: string;
  view_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Generate YouTube thumbnail URL
const getYouTubeThumbnail = (url: string, customThumbnail?: string | null): string => {
  if (customThumbnail) return customThumbnail;
  
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return '/placeholder.svg';
};

const Videos = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedVideos();
    document.title = t("meta.videos_title");
  }, [t]);

  const fetchApprovedVideos = async () => {
    try {
      // Fetch approved videos from youtube_videos table
      const { data: videosData, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching YouTube videos:', error);
        toast({
          title: t("common.error"),
          description: t("errors.failed_to_load"),
          variant: "destructive",
        });
        return;
      }

      // Fetch profile data for each video
      const videosWithProfiles = await Promise.all(
        (videosData || []).map(async (video) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', video.user_id)
            .single();

          return {
            ...video,
            profiles: profileData
          };
        })
      );

      setVideos(videosWithProfiles);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t("common.error"),
        description: t("errors.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWatchVideo = (youtubeUrl: string) => {
    window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-semibold mb-2 sm:mb-4">{t("videos.title")}</h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            {t("videos.subtitle")}
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Youtube className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-2">{t("videos.no_videos_title")}</h3>
            <p className="text-muted-foreground text-sm sm:text-base">{t("videos.no_videos_desc")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {videos.map((video, index) => {
              const decodedTitle = decodeHtmlEntities(video.title);
              const thumbnail = getYouTubeThumbnail(video.youtube_url, video.thumbnail_url);
              
              return (
                <Card 
                  key={video.id} 
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer border-0 shadow-lg animate-fade-in" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleWatchVideo(video.youtube_url)}
                >
                  <div className="relative group">
                    <img 
                      src={thumbnail} 
                      alt={decodedTitle}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white ml-1" fill="white" />
                      </div>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-700">
                      <Youtube className="h-3 w-3 mr-1" />
                      YouTube
                    </Badge>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-serif line-clamp-2 hover:text-primary transition-colors">
                      {decodedTitle}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {new Date(video.created_at).toLocaleDateString('vi-VN')}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {video.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                        {decodeHtmlEntities(video.description)}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {video.view_count || 0} {t("videos.views")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {videos.length > 0 && (
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="px-8" disabled>
              {t("videos.load_more")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Videos;
