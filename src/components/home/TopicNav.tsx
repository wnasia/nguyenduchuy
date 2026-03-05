import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

interface Topic {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface TopicNavProps {
  topics: Topic[];
  selectedTopicId: string | null;
  onSelectTopic: (id: string | null) => void;
}

const TopicNav = ({ topics, selectedTopicId, onSelectTopic }: TopicNavProps) => {
  return (
    <section className="py-6 sm:py-8 border-t border-border">
      <div className="flex items-center gap-3 mb-5">
        <LayoutGrid className="h-5 w-5 text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Chủ đề</h2>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          variant={selectedTopicId === null ? "default" : "outline"}
          size="sm"
          className="rounded-full px-5 py-2 text-sm font-medium transition-all"
          onClick={() => onSelectTopic(null)}
        >
          Tất cả
        </Button>
        {topics.map(topic => (
          <Button
            key={topic.id}
            variant={selectedTopicId === topic.id ? "default" : "outline"}
            size="sm"
            className="rounded-full px-5 py-2 text-sm font-medium transition-all"
            onClick={() => onSelectTopic(topic.id)}
          >
            {topic.name}
          </Button>
        ))}
      </div>
    </section>
  );
};

export default TopicNav;
