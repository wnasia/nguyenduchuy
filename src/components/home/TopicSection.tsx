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
  thumbnail_url?: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

interface TopicSectionProps {
  topicName: string;
  posts: Post[];
}

const TopicSection = ({ topicName, posts }: TopicSectionProps) => {
  const navigate = useNavigate();

  if (posts.length === 0) return null;

  const getPostThumbnail = (post: Post): string | null => {
    if (post.thumbnail_url) return post.thumbnail_url;
    const parsed = parsePostContent(post.content);
    return parsed.imageLinks && parsed.imageLinks.length > 0 ? parsed.imageLinks[0] : null;
  };

  const handleClick = (post: Post) => navigate(`/story/${post.slug || post.id}`);

  const featured = posts[0];
  const rest = posts.slice(1, 5);
  const featuredThumb = getPostThumbnail(featured);

  return (
    <section className="py-8 sm:py-10 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground border-l-4 border-primary pl-4">{topicName}</h2>
        <Button variant="ghost" className="text-primary font-medium gap-1.5 hover:gap-2.5 transition-all" onClick={() => navigate(`/stories?topic=${encodeURIComponent(topicName)}`)}>
          Xem thêm <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Featured post */}
        <div
          onClick={() => handleClick(featured)}
          className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
        >
          {featuredThumb && (
            <div className="aspect-video w-full bg-muted overflow-hidden">
              <img src={featuredThumb} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}
          <div className="p-5">
            <h3 className="text-lg sm:text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-snug">
              {decodeHtmlEntities(featured.title)}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{getExcerpt(featured.content, 140)}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{featured.profiles?.full_name || "Ẩn danh"}</span>
              <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{featured.view_count}</span>
            </div>
          </div>
        </div>

        {/* List of remaining posts */}
        <div className="flex flex-col gap-4">
          {rest.map(post => {
            const thumb = getPostThumbnail(post);
            return (
              <div
                key={post.id}
                onClick={() => handleClick(post)}
                className="flex gap-4 p-3.5 bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                {thumb && (
                  <div className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-muted">
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {decodeHtmlEntities(post.title)}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
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
