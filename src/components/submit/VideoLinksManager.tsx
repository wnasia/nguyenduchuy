
import { Video, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface VideoLinksManagerProps {
  videoLinks: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
  disabled?: boolean;
}

const VideoLinksManager = ({ videoLinks, onAdd, onRemove, onChange, disabled }: VideoLinksManagerProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold flex items-center gap-2">
        <Video className="h-5 w-5 text-primary" />
        YouTube Video Links (Optional)
      </Label>
      <p className="text-sm text-gray-600">
        Share YouTube videos that are part of your story or help illustrate your experience.
      </p>
      {videoLinks.map((link, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={link}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1"
            disabled={disabled}
          />
          {videoLinks.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onRemove(index)}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="flex items-center gap-2"
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
        Add Another Video
      </Button>
    </div>
  );
};

export default VideoLinksManager;
