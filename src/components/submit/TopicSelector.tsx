import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FolderOpen } from "lucide-react";

interface Topic {
  id: string;
  name: string;
}

interface TopicSelectorProps {
  selectedTopicIds: string[];
  onTopicIdsChange: (ids: string[]) => void;
  disabled?: boolean;
}

const TopicSelector = ({ selectedTopicIds, onTopicIdsChange, disabled }: TopicSelectorProps) => {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await supabase
        .from('topics')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');
      setTopics(data || []);
    };
    fetchTopics();
  }, []);

  const toggleTopic = (topicId: string) => {
    if (disabled) return;
    onTopicIdsChange(
      selectedTopicIds.includes(topicId)
        ? selectedTopicIds.filter(id => id !== topicId)
        : [...selectedTopicIds, topicId]
    );
  };

  if (topics.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-base font-semibold">
        <FolderOpen className="h-4 w-4" />
        Chủ đề
      </Label>
      <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/30">
        {topics.map(topic => (
          <label
            key={topic.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded-md text-sm transition-colors"
          >
            <Checkbox
              checked={selectedTopicIds.includes(topic.id)}
              onCheckedChange={() => toggleTopic(topic.id)}
              disabled={disabled}
            />
            {topic.name}
          </label>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;
