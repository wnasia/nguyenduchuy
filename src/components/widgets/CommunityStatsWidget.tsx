import { useState, useEffect, useCallback } from "react";
import { Users, FileText, Image, Eye, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parsePostContent } from "@/lib/htmlUtils";

interface CommunityStats {
  stories: number;
  images: number;
  members: number;
  views: number;
}

const CommunityStatsWidget = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const [
        { count: storiesCount },
        { count: usersCount },
        { data: viewsData },
        { data: postsData }
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('view_count').eq('status', 'approved'),
        supabase.from('posts').select('content').eq('status', 'approved')
      ]);

      const totalViews = viewsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

      let totalImages = 0;
      postsData?.forEach(post => {
        const parsed = parsePostContent(post.content);
        totalImages += parsed.imageLinks?.length || 0;
      });

      // Also count gallery images
      const { count: galleryCount } = await supabase
        .from('gallery_images')
        .select('*', { count: 'exact', head: true });

      setStats({
        stories: storiesCount || 0,
        images: totalImages + (galleryCount || 0),
        members: usersCount || 0,
        views: totalViews
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching community stats:', err);
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Thống kê cộng đồng</h3>
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">Không thể tải dữ liệu</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Thống kê cộng đồng
      </h3>
      
      {loading && !stats ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-muted rounded-lg p-3 h-16" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg p-3 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {formatNumber(stats.stories)}
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Bài viết</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg p-3 text-center">
            <Image className="h-5 w-5 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
              {formatNumber(stats.images)}
            </p>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80">Hình ảnh</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              {formatNumber(stats.members)}
            </p>
            <p className="text-xs text-green-600/80 dark:text-green-400/80">Thành viên</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 rounded-lg p-3 text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
              {formatNumber(stats.views)}
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Lượt xem</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CommunityStatsWidget;
