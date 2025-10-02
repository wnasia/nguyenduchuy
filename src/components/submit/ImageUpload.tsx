
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";

interface ImageUploadProps {
  imageLinks: string[];
  onImageLinksChange: (links: string[]) => void;
  disabled?: boolean;
}

const ImageUpload = ({ imageLinks, onImageLinksChange, disabled }: ImageUploadProps) => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t("submit.invalid_file_type"),
        description: t("submit.select_image_file"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("submit.file_too_large"),
        description: t("submit.image_size_limit"),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t("submit.auth_required"),
          description: t("submit.login_to_upload"),
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: t("submit.upload_failed"),
          description: t("submit.upload_failed_desc"),
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
          title: t("common.success"),
          description: t("submit.image_uploaded_success"),
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t("common.error"),
        description: t("submit.unexpected_upload_error"),
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
        {t("submit.images_label")}
      </Label>
      
      <div className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{t("submit.upload_from_device")}</p>
            <p className="text-xs text-gray-400">{t("submit.image_format_limit")}</p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={disabled || uploading}
              className="max-w-xs mx-auto"
            />
            {uploading && (
              <p className="text-sm text-blue-600">{t("submit.uploading")}</p>
            )}
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">{t("submit.or_add_url")}</Label>
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
              {t("submit.add_button")}
            </Button>
          </div>
        </div>

        {/* Display Added Images */}
        {imageLinks.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">{t("submit.added_images")} ({imageLinks.length})</Label>
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
