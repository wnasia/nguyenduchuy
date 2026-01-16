import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/useI18n";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  imageLinks: string[];
  onImageLinksChange: (links: string[]) => void;
  disabled?: boolean;
}

const ImageUpload = ({ imageLinks, onImageLinksChange, disabled }: ImageUploadProps) => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCount, setUploadCount] = useState({ current: 0, total: 0 });
  const [newImageUrl, setNewImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to array for processing
    const fileArray = Array.from(files);
    
    // Validate all files first
    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t("submit.invalid_file_type"),
          description: `${file.name}: ${t("submit.select_image_file")}`,
          variant: "destructive",
        });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("submit.file_too_large"),
          description: `${file.name}: ${t("submit.image_size_limit")}`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadCount({ current: 0, total: validFiles.length });
    setUploadProgress(0);

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

      const uploadedUrls: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadCount({ current: i + 1, total: validFiles.length });
        setUploadProgress(((i) / validFiles.length) * 100);

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
            description: `${file.name}: ${t("submit.upload_failed_desc")}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('story-images')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const updatedLinks = [...imageLinks, ...uploadedUrls];
        onImageLinksChange(updatedLinks);
        toast({
          title: t("common.success"),
          description: `${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'image' : 'images'} uploaded successfully`,
        });
      }

      setUploadProgress(100);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: t("common.error"),
        description: t("submit.unexpected_upload_error"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadCount({ current: 0, total: 0 });
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      // Create a new DataTransfer to set files
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(file => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
      
      // Trigger the change event
      const event = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(event);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="space-y-4">
      <Label className="text-lg font-semibold flex items-center gap-2">
        <Image className="h-5 w-5 text-primary" />
        {t("submit.images_label")}
      </Label>
      
      <div className="space-y-4">
        {/* File Upload - Multiple Files */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-primary font-medium">
                Uploading {uploadCount.current} of {uploadCount.total}...
              </p>
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Drop images here or click to select
                </p>
                <p className="text-xs text-gray-500">
                  You can select multiple images at once
                </p>
                <p className="text-xs text-gray-400">{t("submit.image_format_limit")}</p>
              </div>
            </>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={disabled || uploading}
            className="hidden"
          />
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
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
