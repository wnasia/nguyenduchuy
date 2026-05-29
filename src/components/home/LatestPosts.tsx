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
    <section className="py-8 sm:py-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground border-l-4 border-primary pl-4">
          Bài viết mới nhất
        </h2>
        <Button variant="ghost" className="text-primary font-medium gap-1.5 hover:gap-2.5 transition-all" onClick={() => navigate('/stories')}>
          Xem thêm <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Main featured article - takes 3 cols */}
        <div
          onClick={() => handleClick(main)}
          className="lg:col-span-3 bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
        >
          {mainThumb && (
            <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
              <img src={mainThumb} alt={main.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}
          <div className="p-5 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-3">
              {decodeHtmlEntities(main.title)}
            </h3>
            <p className="text-base text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{getExcerpt(main.content, 180)}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(main.created_at).toLocaleDateString('vi-VN')}</span>
              <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />{main.view_count}</span>
            </div>
          </div>
        </div>

        {/* Side list - takes 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {side.map(post => {
            const thumb = getThumb(post);
            return (
              <div
                key={post.id}
                onClick={() => handleClick(post)}
                className="flex gap-4 p-3.5 bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                {thumb && (
                  <div className="flex-shrink-0 w-28 h-20 sm:w-32 sm:h-[88px] rounded-lg overflow-hidden bg-muted">
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {decodeHtmlEntities(post.title)}
                  </h4>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.view_count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row */}
      {bottom.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
          {bottom.map(post => {
            const thumb = getThumb(post);
            return (
              <div
                key={post.id}
                onClick={() => handleClick(post)}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                {thumb && (
                  <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-muted">
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {decodeHtmlEntities(post.title)}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1.5">{getExcerpt(post.content, 100)}</p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.view_count}</span>
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
