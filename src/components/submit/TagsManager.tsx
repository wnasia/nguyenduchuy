
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TagsManagerProps {
  tags: string[];
  currentTag: string;
  onCurrentTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  disabled?: boolean;
}

const TagsManager = ({ tags, currentTag, onCurrentTagChange, onAddTag, onRemoveTag, disabled }: TagsManagerProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddTag();
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold">
        Tags (Optional)
      </Label>
      <p className="text-sm text-gray-600">
        Add tags to help others discover your story. Examples: family, love, loss, career, travel, etc.
      </p>
      <div className="flex gap-2">
        <Input
          value={currentTag}
          onChange={(e) => onCurrentTagChange(e.target.value)}
          placeholder="Add a tag..."
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        <Button type="button" onClick={onAddTag} variant="outline" disabled={disabled}>
          Add Tag
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagsManager;
