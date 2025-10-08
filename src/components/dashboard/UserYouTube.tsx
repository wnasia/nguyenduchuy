import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { Youtube, Upload, Trash2, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface YouTubeVideo {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string | null;
  description: string | null;
  status: string;
  view_count: number;
  created_at: string;
}

const UserYouTube = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    youtube_url: "",
    thumbnail_url: "",
    description: ""
  });

  useEffect(() => {
    fetchUserVideos();
  }, [user]);

  const fetchUserVideos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        toast({
          title: "Error",
          description: "Failed to load videos",
          variant: "destructive",
        });
      } else {
        setVideos(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.title || !formData.youtube_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { error } = await supabase
        .from('youtube_videos')
        .insert({
          user_id: user.id,
          title: formData.title,
          youtube_url: formData.youtube_url,
          thumbnail_url: formData.thumbnail_url || null,
          description: formData.description || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "YouTube video submitted for review",
      });

      setFormData({
        title: "",
        youtube_url: "",
        thumbnail_url: "",
        description: ""
      });
      setShowUpload(false);
      fetchUserVideos();
    } catch (error) {
      console.error('Error submitting video:', error);
      toast({
        title: "Error",
        description: "Failed to submit video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('youtube_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });

      fetchUserVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (videos.length === 0 && !showUpload) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            My YouTube Videos
          </CardTitle>
          <CardDescription>You haven't submitted any YouTube videos yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Share your YouTube videos with the community</p>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Submit YouTube Video
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5" />
                My YouTube Videos
              </CardTitle>
              <CardDescription>
                Manage your YouTube video submissions ({videos.length} total)
              </CardDescription>
            </div>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Submit Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {videos.map((video) => (
              <div key={video.id} className="flex gap-4 p-4 bg-muted/50 rounded-lg border">
                {video.thumbnail_url && (
                  <div className="flex-shrink-0 w-40 h-24 rounded overflow-hidden bg-muted">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{video.title}</h3>
                    {getStatusBadge(video.status)}
                  </div>
                  {video.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{video.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <a 
                      href={video.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Watch on YouTube
                    </a>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{video.view_count} views</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteVideo(video.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              Submit YouTube Video
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter video title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="youtube_url">YouTube URL *</Label>
              <Input
                id="youtube_url"
                type="url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                required
              />
            </div>

            <div>
              <Label htmlFor="thumbnail_url">Thumbnail URL (Optional)</Label>
              <Input
                id="thumbnail_url"
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your video..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Submitting..." : "Submit Video"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserYouTube;
