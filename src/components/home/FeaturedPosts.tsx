import { useNavigate } from "react-router-dom";
import { Eye, Star, Clock } from "lucide-react";
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
    <section className="py-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Bài viết nổi bật</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {posts.map(post => {
          const thumb = getThumb(post);
          return (
            <div
              key={post.id}
              onClick={() => handleClick(post)}
              className="bg-card rounded-lg border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all"
            >
              <div className="aspect-[16/10] w-full bg-muted overflow-hidden relative">
                {thumb ? (
                  <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">📄</div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded">HOT</span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                  {decodeHtmlEntities(post.title)}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{getExcerpt(post.content, 80)}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
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
