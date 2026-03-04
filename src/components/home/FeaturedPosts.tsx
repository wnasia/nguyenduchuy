import { useNavigate } from "react-router-dom";
import { Eye, Flame, Clock } from "lucide-react";
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

const FeaturedPosts = ({ posts }: { posts: Post[] }) => {
  const navigate = useNavigate();

  if (posts.length === 0) return null;

  const getThumb = (post: Post): string | null => {
    if (post.thumbnail_url) return post.thumbnail_url;
    const parsed = parsePostContent(post.content);
    return parsed.imageLinks && parsed.imageLinks.length > 0 ? parsed.imageLinks[0] : null;
  };

  const handleClick = (post: Post) => navigate(`/story/${post.slug || post.id}`);

  return (
    <section className="py-8 sm:py-10 border-t border-border">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="h-6 w-6 text-destructive" />
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Bài viết nổi bật</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {posts.map(post => {
          const thumb = getThumb(post);
          return (
            <div
              key={post.id}
              onClick={() => handleClick(post)}
              className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[16/10] w-full bg-muted overflow-hidden relative">
                {thumb ? (
                  <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">📄</div>
                )}
                <div className="absolute top-2.5 left-2.5">
                  <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">HOT</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-snug">
                  {decodeHtmlEntities(post.title)}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{getExcerpt(post.content, 90)}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.view_count}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedPosts;
