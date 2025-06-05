
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImageUploadProps {
  imageLinks: string[];
  onImageLinksChange: (links: string[]) => void;
  disabled?: boolean;
}

const ImageUpload = ({ imageLinks, onImageLinksChange, disabled }: ImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Create bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'story-images');
      
      if (!bucketExists) {
        await supabase.storage.createBucket('story-images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
      }

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('story-images')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        const updatedLinks = [...imageLinks, publicUrlData.publicUrl];
        onImageLinksChange(updatedLinks);
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleAddUrl = () => {
    if (newImageUrl.trim()) {
      const updatedLinks = [...imageLinks, newImageUrl.trim()];
      onImageLinksChange(updatedLinks);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedLinks = imageLinks.filter((_, i) => i !== index);
    onImageLinksChange(updatedLinks);
  };

  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold flex items-center gap-2">
        <Image className="h-5 w-5 text-primary" />
        Images (Optional)
      </Label>
      
      <div className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Upload images from your device</p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={disabled || uploading}
              className="max-w-xs mx-auto"
            />
            {uploading && (
              <p className="text-sm text-blue-600">Uploading...</p>
            )}
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">Or add image URL</Label>
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={disabled}
              onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddUrl}
              disabled={disabled || !newImageUrl.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Display Added Images */}
        {imageLinks.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Added Images ({imageLinks.length})</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {imageLinks.map((link, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={link}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                    {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
