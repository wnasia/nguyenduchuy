
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface StoryContentInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const StoryContentInput = ({ value, onChange, disabled }: StoryContentInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="story" className="text-lg font-semibold">
        Your Story
      </Label>
      <Textarea
        id="story"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Share your story here. What happened? How did it make you feel? What did you learn? Be as detailed or as brief as you'd like..."
        className="min-h-[200px] text-base leading-relaxed"
        required
        disabled={disabled}
      />
      <p className="text-sm text-gray-500">
        Tell your story in your own words. There's no right or wrong way to share your experience.
      </p>
    </div>
  );
};

export default StoryContentInput;
