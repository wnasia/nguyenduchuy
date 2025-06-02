
import { Image, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ImageLinksManagerProps {
  imageLinks: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
  disabled?: boolean;
}

const ImageLinksManager = ({ imageLinks, onAdd, onRemove, onChange, disabled }: ImageLinksManagerProps) => {
  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold flex items-center gap-2">
        <Image className="h-5 w-5 text-primary" />
        Image Links (Optional)
      </Label>
      <p className="text-sm text-gray-600">
        Add links to images from Google Drive, Imgur, or other image hosting services.
      </p>
      {imageLinks.map((link, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={link}
            onChange={(e) => onChange(index, e.target.value)}
            placeholder="https://drive.google.com/your-image-link or https://imgur.com/..."
            className="flex-1"
            disabled={disabled}
          />
          {imageLinks.length > 1 && (
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
        Add Another Image
      </Button>
    </div>
  );
};

export default ImageLinksManager;
