import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Youtube, Eye, Calendar, CheckCircle, XCircle, Clock, Search, Filter, Trash2, ExternalLink, RefreshCw } from "lucide-react";

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
    email: string | null;
  } | null;
}

const AdminYouTube = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, statusFilter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each video
      const videosWithProfiles = await Promise.all(
        (data || []).map(async (video) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
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
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];

    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(video => video.status === statusFilter);
    }

    setFilteredVideos(filtered);
  };

  const updateVideoStatus = async (videoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('youtube_videos')
        .update({ status: newStatus })
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Video ${newStatus} successfully`,
      });
      fetchVideos();
    } catch (error) {
      console.error('Error updating video status:', error);
      toast({
        title: "Error",
        description: "Failed to update video status",
        variant: "destructive",
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
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
      fetchVideos();
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              YouTube Video Management
            </CardTitle>
            <CardDescription>
              Manage user-submitted YouTube videos ({filteredVideos.length} of {videos.length})
            </CardDescription>
          </div>
          <Button onClick={fetchVideos} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search videos or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Videos List */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <Youtube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No videos found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVideos.map((video) => (
              <div 
                key={video.id} 
                className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-full sm:w-48 h-32 rounded overflow-hidden bg-muted">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{video.title}</h3>
                    {getStatusBadge(video.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    By {video.profiles?.full_name || 'Unknown'} ({video.profiles?.email || 'No email'})
                  </p>

                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {video.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                    <a 
                      href={video.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Watch on YouTube
                    </a>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(video.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {video.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVideoStatus(video.id, 'approved')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVideoStatus(video.id, 'rejected')}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {video.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVideoStatus(video.id, 'pending')}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Set Pending
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the video submission.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteVideo(video.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminYouTube;
