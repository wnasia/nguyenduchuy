import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Eye, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { parsePostContent, decodeHtmlEntities } from "@/lib/htmlUtils";
import TableOfContents from "./TableOfContents";
import ExchangeRateWidget from "@/components/widgets/ExchangeRateWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import FlightSearchWidget from "@/components/flight/FlightSearchWidget";

interface Post {
  id: string;
  title: string;
  content: string;
  view_count: number;
  slug?: string;
}

interface ArticleSidebarProps {
  contentHtml: string;
  currentPostId: string;
}

const ArticleSidebar = ({ contentHtml, currentPostId }: ArticleSidebarProps) => {
  const navigate = useNavigate();
  const [topPosts, setTopPosts] = useState<Post[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);

  const fetchTopPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, view_count, slug")
        .eq("status", "approved")
        .neq("id", currentPostId)
        .order("view_count", { ascending: false })
        .limit(5);

      if (error) throw error;
      setTopPosts(data || []);
    } catch (error) {
      console.error("Error fetching top posts:", error);
    }
  }, [currentPostId]);

  const fetchRelatedPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, view_count, slug")
        .eq("status", "approved")
        .neq("id", currentPostId)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setRelatedPosts(data || []);
    } catch (error) {
      console.error("Error fetching related posts:", error);
    }
  }, [currentPostId]);

  const fetchPopularTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("content")
        .eq("status", "approved")
        .limit(50);

      if (error) throw error;

      const tagsMap = new Map<string, number>();
      data?.forEach((post) => {
        const parsed = parsePostContent(post.content);
        parsed.tags?.forEach((tag) => {
          tagsMap.set(tag, (tagsMap.get(tag) || 0) + 1);
        });
      });

      const sortedTags = Array.from(tagsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      setPopularTags(sortedTags);
    } catch (error) {
      console.error("Error fetching popular tags:", error);
    }
  }, []);

  useEffect(() => {
    fetchTopPosts();
    fetchRelatedPosts();
    fetchPopularTags();
  }, [fetchTopPosts, fetchRelatedPosts, fetchPopularTags]);

  const handleReadStory = (slug: string | undefined, id: string) => {
    navigate(`/story/${slug || id}`);
  };

  const getPostThumbnail = (content: string): string | null => {
    const parsed = parsePostContent(content);
    return parsed.imageLinks && parsed.imageLinks.length > 0 ? parsed.imageLinks[0] : null;
  };

  return (
    <div className="space-y-6 sticky top-24">
      {/* Table of Contents - First */}
      <TableOfContents contentHtml={contentHtml} />

      {/* Exchange Rate Widget - Second */}
      <ExchangeRateWidget />

      {/* Weather Widget - Third */}
      <WeatherWidget />

      {/* Top Stories */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Bài viết nổi bật
        </h3>
        <div className="space-y-3">
          {topPosts.map((post, index) => (
            <div
              key={post.id}
              onClick={() => handleReadStory(post.slug, post.id)}
              className="flex gap-3 cursor-pointer group"
            >
              <span className="text-2xl font-bold text-muted-foreground/30 flex-shrink-0">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {decodeHtmlEntities(post.title)}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{post.view_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Topics */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Chủ đề phổ biến
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Related Posts */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Bài viết liên quan
        </h3>
        <div className="space-y-4">
          {relatedPosts.map((post) => {
            const thumbnail = getPostThumbnail(post.content);
            return (
              <div
                key={post.id}
                onClick={() => handleReadStory(post.slug, post.id)}
                className="flex gap-3 cursor-pointer group"
              >
                {thumbnail && (
                  <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                    <img
                      src={thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {decodeHtmlEntities(post.title)}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{post.view_count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flight Search Widget - Always Last */}
      <FlightSearchWidget />
    </div>
  );
};

export default ArticleSidebar;
