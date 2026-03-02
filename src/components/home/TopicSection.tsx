import { useNavigate } from "react-router-dom";
import { Eye, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decodeHtmlEntities, getExcerpt, parsePostContent } from "@/lib/htmlUtils";

interface Post {
  id: string;
  title: string;
  content: string;
  view_count: number;
  created_at: string;
  slug?: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

interface TopicSectionProps {
  topicName: string;
  posts: Post[];
}

const TopicSection = ({ topicName, posts }: TopicSectionProps) => {
  const navigate = useNavigate();

  if (posts.length === 0) return null;

  const getPostThumbnail = (content: string): string | null => {
    const parsed = parsePostContent(content);
    return parsed.imageLinks && parsed.imageLinks.length > 0 ? parsed.imageLinks[0] : null;
  };

  const handleClick = (post: Post) => navigate(`/story/${post.slug || post.id}`);

  // First post is featured (large), rest are list items
  const featured = posts[0];
  const rest = posts.slice(1, 5);
  const featuredThumb = getPostThumbnail(featured.content);

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground border-l-4 border-primary pl-3">{topicName}</h2>
        <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate(`/stories?topic=${encodeURIComponent(topicName)}`)}>
          Xem thêm <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Featured post */}
        <div
          onClick={() => handleClick(featured)}
          className="bg-card rounded-lg border border-border overflow-hidden cursor-pointer group hover:shadow-md transition-all"
        >
          {featuredThumb && (
            <div className="aspect-video w-full bg-muted overflow-hidden">
              <img src={featuredThumb} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
              {decodeHtmlEntities(featured.title)}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{getExcerpt(featured.content, 120)}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{featured.profiles?.full_name || "Ẩn danh"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{featured.view_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* List of remaining posts */}
        <div className="space-y-3">
          {rest.map(post => {
            const thumb = getPostThumbnail(post.content);
            return (
              <div
                key={post.id}
                onClick={() => handleClick(post)}
                className="flex gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-all cursor-pointer group"
              >
                {thumb && (
                  <div className="flex-shrink-0 w-20 h-16 rounded overflow-hidden bg-muted">
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {decodeHtmlEntities(post.title)}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{post.view_count}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TopicSection;
