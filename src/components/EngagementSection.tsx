
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface EngagementSectionProps {
  postId: string;
}

const EngagementSection = ({ postId }: EngagementSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLikesAndComments();
    
    // Set up real-time subscriptions
    const likesChannel = supabase
      .channel(`likes-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `post_id=eq.${postId}`
      }, () => {
        fetchLikesAndComments();
      })
      .subscribe();

    const commentsChannel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [postId, user]);

  const fetchLikesAndComments = async () => {
    await Promise.all([fetchLikes(), fetchComments()]);
    setLoading(false);
  };

  const fetchLikes = async () => {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      if (error) throw error;
      setLikesCount(count || 0);

      if (user) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (userLikeError) throw userLikeError;
        setLiked(!!userLike);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', comment.user_id)
            .single();

          return {
            ...comment,
            profiles: profileData
          };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 pt-4 border-t">
          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Engagement Actions */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          onClick={handleLike}
          className="flex items-center gap-2"
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current text-red-500' : ''}`} />
          {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-4">
          {/* Add Comment */}
          {user && (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                onClick={handleComment}
                disabled={!newComment.trim()}
                size="sm"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Post Comment
              </Button>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">
                      {comment.profiles?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EngagementSection;
