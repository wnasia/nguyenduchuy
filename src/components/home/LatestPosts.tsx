import { useNavigate } from "react-router-dom";
import { Eye, User, Clock, ArrowRight } from "lucide-react";
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

const LatestPosts = ({ posts }: { posts: Post[] }) => {
  const navigate = useNavigate();

  if (posts.length === 0) return null;

  const getThumb = (post: Post): string | null => {
    if (post.thumbnail_url) return post.thumbnail_url;
    const parsed = parsePostContent(post.content);
    return parsed.imageLinks && parsed.imageLinks.length > 0 ? parsed.imageLinks[0] : null;
  };

  const handleClick = (post: Post) => navigate(`/story/${post.slug || post.id}`);

  const main = posts[0];
  const side = posts.slice(1, 4);
  const bottom = posts.slice(4, 6);
  const mainThumb = getThumb(main);

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground border-l-4 border-primary pl-3">
          Bài viết mới nhất
        </h2>
        <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/stories')}>
          Xem thêm <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main featured article */}
        <div
          onClick={() => handleClick(main)}
          className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
        >
          {mainThumb && (
            <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
              <img src={mainThumb} alt={main.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          <div className="p-4 sm:p-5">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2">
              {decodeHtmlEntities(main.title)}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{getExcerpt(main.content, 160)}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{main.profiles?.full_name || "Ẩn danh"}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(main.created_at).toLocaleDateString('vi-VN')}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{main.view_count}</span>
            </div>
          </div>
        </div>

        {/* Side list */}
        <div className="space-y-3">
          {side.map(post => {
            const thumb = getThumb(post);
            return (
              <div
                key={post.id}
                onClick={() => handleClick(post)}
                className="flex gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-all cursor-pointer group"
              >
                {thumb && (
                  <div className="flex-shrink-0 w-24 h-18 rounded overflow-hidden bg-muted">
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {decodeHtmlEntities(post.title)}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <Eye className="h-3 w-3" />
                    <span>{post.view_count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row */}
      {bottom.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {bottom.map(post => {
            const thumb = getThumb(post);
            return (
              <div
                key={post.id}
                onClick={() => handleClick(post)}
                className="flex gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-all cursor-pointer group"
              >
                {thumb && (
                  <div className="flex-shrink-0 w-28 h-20 rounded overflow-hidden bg-muted">
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {decodeHtmlEntities(post.title)}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{getExcerpt(post.content, 80)}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LatestPosts;
