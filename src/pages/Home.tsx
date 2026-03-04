import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import BannerSlider from "@/components/BannerSlider";
import TopicSection from "@/components/home/TopicSection";
import LatestPosts from "@/components/home/LatestPosts";
import FeaturedPosts from "@/components/home/FeaturedPosts";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  view_count: number;
  created_at: string;
  slug?: string;
  is_featured?: boolean;
  thumbnail_url?: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Topic {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

const Home = () => {
  const { t } = useI18n();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [postsByTopic, setPostsByTopic] = useState<Record<string, Post[]>>({});
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all approved posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!postsData || postsData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch profiles
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const enrichedPosts: Post[] = postsData.map(p => ({
        ...p,
        content: p.content || '',
        profiles: profilesMap.get(p.user_id) || null,
      }));

      // Latest posts (newest 6)
      setLatestPosts(enrichedPosts.slice(0, 6));

      // Featured posts
      const featured = enrichedPosts.filter(p => p.is_featured);
      setFeaturedPosts(featured.length > 0 ? featured.slice(0, 4) : enrichedPosts.sort((a, b) => b.view_count - a.view_count).slice(0, 4));

      // Topics
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, name, slug, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      const activeTopics = topicsData || [];
      setTopics(activeTopics);

      if (activeTopics.length > 0) {
        const topicIds = activeTopics.map(t => t.id);
        const { data: postTopicsData } = await supabase
          .from('post_topics')
          .select('post_id, topic_id')
          .in('topic_id', topicIds);

        if (postTopicsData && postTopicsData.length > 0) {
          const topicPostMap: Record<string, Post[]> = {};
          for (const topic of activeTopics) {
            const topicPostIds = postTopicsData
              .filter(pt => pt.topic_id === topic.id)
              .map(pt => pt.post_id);
            topicPostMap[topic.id] = enrichedPosts
              .filter(p => topicPostIds.includes(p.id))
              .slice(0, 5);
          }
          setPostsByTopic(topicPostMap);
        }
      }
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
      <BannerSlider />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Latest Posts */}
        <LatestPosts posts={latestPosts} />

        {/* Featured Posts */}
        <FeaturedPosts posts={featuredPosts} />

        {/* Topic Sections */}
        {topics.map(topic => {
          const topicPosts = postsByTopic[topic.id] || [];
          if (topicPosts.length === 0) return null;
          return (
            <TopicSection
              key={topic.id}
              topicName={topic.name}
              posts={topicPosts}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Home;
