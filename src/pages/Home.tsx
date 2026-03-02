import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/contexts/AuthContext";
import InfoBar from "@/components/home/InfoBar";
import BannerSlider from "@/components/BannerSlider";
import TopicSection from "@/components/home/TopicSection";
import LoginPromptModal from "@/components/LoginPromptModal";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  view_count: number;
  created_at: string;
  slug?: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

const Home = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [postsByTopic, setPostsByTopic] = useState<Record<string, Post[]>>({});
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      const dismissed = sessionStorage.getItem('loginPromptDismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowLoginPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [authLoading, user]);

  const handleLoginPromptClose = (open: boolean) => {
    setShowLoginPrompt(open);
    if (!open) sessionStorage.setItem('loginPromptDismissed', 'true');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active topics
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, name, slug, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      const activeTopics = topicsData || [];
      setTopics(activeTopics);

      if (activeTopics.length === 0) { setLoading(false); return; }

      // Fetch all post_topics mappings for these topics
      const topicIds = activeTopics.map(t => t.id);
      const { data: postTopicsData } = await supabase
        .from('post_topics')
        .select('post_id, topic_id')
        .in('topic_id', topicIds);

      if (!postTopicsData || postTopicsData.length === 0) { setLoading(false); return; }

      // Get unique post IDs
      const postIds = [...new Set(postTopicsData.map(pt => pt.post_id))];

      // Fetch posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .in('id', postIds)
        .order('created_at', { ascending: false });

      if (!postsData) { setLoading(false); return; }

      // Fetch profiles for all posts
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Build topic -> posts mapping
      const topicPostMap: Record<string, Post[]> = {};
      for (const topic of activeTopics) {
        const topicPostIds = postTopicsData
          .filter(pt => pt.topic_id === topic.id)
          .map(pt => pt.post_id);

        topicPostMap[topic.id] = postsData
          .filter(p => topicPostIds.includes(p.id))
          .slice(0, 5)
          .map(p => ({
            ...p,
            content: p.content || '',
            profiles: profilesMap.get(p.user_id) || null,
          }));
      }

      setPostsByTopic(topicPostMap);
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    document.title = t("meta.home_title");
  }, [fetchData, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Full-width Banner */}
      <BannerSlider />

      {/* Topic Sections */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {topics.map(topic => (
          <TopicSection
            key={topic.id}
            topicName={topic.name}
            posts={postsByTopic[topic.id] || []}
          />
        ))}

        {topics.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            Chưa có chủ đề nào. Admin hãy tạo chủ đề và gán bài viết.
          </div>
        )}
      </div>

      <LoginPromptModal open={showLoginPrompt} onOpenChange={handleLoginPromptClose} />
    </div>
  );
};

export default Home;
