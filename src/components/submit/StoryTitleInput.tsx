
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoryTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const StoryTitleInput = ({ value, onChange, disabled }: StoryTitleInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="title" className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Story Title
      </Label>
      <Input
        id="title"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Give your story a meaningful title..."
        className="text-lg"
        required
        disabled={disabled}
      />
    </div>
  );
};

export default StoryTitleInput;
