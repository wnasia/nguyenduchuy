import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { Upload, X, Image } from "lucide-react";

interface GalleryImageUploadProps {
  onUploadSuccess: () => void;
}

const GalleryImageUpload = ({ onUploadSuccess }: GalleryImageUploadProps) => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadData, setUploadData] = useState<{[key: string]: {title: string, description: string}}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(files);
      initializeUploadData(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setSelectedFiles(files);
      initializeUploadData(files);
    }
  };

  const initializeUploadData = (files: File[]) => {
    const data: {[key: string]: {title: string, description: string}} = {};
    files.forEach(file => {
      data[file.name] = {
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: ""
      };
    });
    setUploadData(data);
  };

  const updateUploadData = (fileName: string, field: 'title' | 'description', value: string) => {
    setUploadData(prev => ({
      ...prev,
      [fileName]: {
        ...prev[fileName],
        [field]: value
      }
    }));
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    setUploadData(prev => {
      const newData = { ...prev };
      delete newData[fileName];
      return newData;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: t("gallery.upload_error"),
          description: t("errors.failed_to_load"),
          variant: "destructive",
        });
        return;
      }

      for (const file of selectedFiles) {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('story-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: t("gallery.upload_error"),
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('story-images')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            title: uploadData[file.name]?.title || file.name,
            description: uploadData[file.name]?.description || '',
            image_url: publicUrl,
            uploaded_by: user.id
          });

        if (dbError) {
          console.error('Database error:', dbError);
          toast({
            title: t("gallery.upload_error"),
            description: `Failed to save ${file.name} to database`,
            variant: "destructive",
          });
        }
      }

        toast({
          title: t("gallery.upload_success"),
          description: `${t("gallery.upload_success")} ${selectedFiles.length} ${t("gallery.total_images")}`,
        });

      // Reset form
      setSelectedFiles([]);
      setUploadData({});
      setIsOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent to refresh
      onUploadSuccess();

    } catch (error) {
      console.error('Upload error:', error);
          toast({
            title: t("gallery.upload_error"),
            description: t("errors.unexpected_error"),
            variant: "destructive",
          });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Upload className="h-4 w-4 mr-2" />
          {t("gallery.upload_images")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("gallery.upload_images")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload Area */}
          <Card 
            className={`border-2 border-dashed transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                {t("gallery.drag_drop")} <br />
                <span className="text-primary cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {t("gallery.click_upload")}
                </span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {t("gallery.select_files")}
              </Button>
            </CardContent>
          </Card>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">{t("gallery.selected_images")} ({selectedFiles.length})</h3>
              {selectedFiles.map((file) => (
                <Card key={file.name} className="p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.name)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`title-${file.name}`}>{t("gallery.image_title")}</Label>
                          <Input
                            id={`title-${file.name}`}
                            value={uploadData[file.name]?.title || ''}
                            onChange={(e) => updateUploadData(file.name, 'title', e.target.value)}
                            placeholder={t("gallery.image_title_placeholder")}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`desc-${file.name}`}>{t("gallery.image_description")}</Label>
                          <Textarea
                            id={`desc-${file.name}`}
                            value={uploadData[file.name]?.description || ''}
                            onChange={(e) => updateUploadData(file.name, 'description', e.target.value)}
                            placeholder={t("gallery.image_description_placeholder")}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {selectedFiles.length > 0 && (
            <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setUploadData({});
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={uploading}
                >
                  {t("gallery.cancel")}
                </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? t("gallery.uploading") : t("gallery.upload")} ({selectedFiles.length})
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryImageUpload;