
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface EngagementSectionProps {
  postId: string;
  initialLikes?: number;
  initialComments?: Array<{
    id: string;
    content: string;
    author: string;
    createdAt: string;
  }>;
}

const EngagementSection = ({ postId, initialLikes = 0, initialComments = [] }: EngagementSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
    
    // TODO: Implement actual like functionality with backend
    console.log(`${liked ? 'Unliked' : 'Liked'} post ${postId}`);
  };

  const handleComment = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    const comment = {
      id: Math.random().toString(36),
      content: newComment.trim(),
      author: user.email || 'Anonymous',
      createdAt: new Date().toISOString()
    };

    setComments(prev => [comment, ...prev]);
    setNewComment("");
    
    toast({
      title: "Comment Added",
      description: "Your comment has been added successfully",
    });

    // TODO: Implement actual comment functionality with backend
    console.log(`Added comment to post ${postId}:`, comment);
  };

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
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          {likes} {likes === 1 ? 'Like' : 'Likes'}
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
                    <span className="font-medium text-sm">{comment.author}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
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
