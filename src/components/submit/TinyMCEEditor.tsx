import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/r2Upload";
import { useToast } from "@/hooks/use-toast";

interface TinyMCEEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TinyMCEEditor = ({ value, onChange, disabled }: TinyMCEEditorProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const editorRef = useRef<any>(null);

  const handleImageUpload = async (blobInfo: any, progress: (percent: number) => void) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please log in to upload images");

    const blob = blobInfo.blob();
    const file = blob instanceof File
      ? blob
      : new File([blob], blobInfo.filename?.() || `image.${blob.type.split("/")[1] || "png"}`, { type: blob.type });

    try {
      const { url } = await uploadToR2(file, "stories");
      return url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    }
  };


  return (
    <div className="space-y-2">
      <Label htmlFor="story" className="text-lg font-semibold">
        {t("submit.story_label")}
      </Label>
      <div className="border rounded-lg overflow-hidden bg-background">
        <Editor
          apiKey="cprbnjl7pha6mv3y0k84abwnf1mpieroa1h9xlfsdw091tn4"
          onInit={(evt, editor) => {
            editorRef.current = editor;
            console.log('TinyMCE editor initialized successfully');
          }}
          value={value}
          onEditorChange={onChange}
          disabled={disabled}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
              "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
              "insertdatetime", "media", "table", "help", "wordcount",
              "emoticons"
            ],
            toolbar: "undo redo | blocks | " +
              "bold italic underline strikethrough | forecolor backcolor | " +
              "alignleft aligncenter alignright alignjustify | " +
              "bullist numlist outdent indent | " +
              "link image media | blockquote | " +
              "fontfamily fontsize | removeformat | help",
            content_style: "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; font-size: 14px; padding: 10px; }",
            images_upload_handler: handleImageUpload,
            automatic_uploads: true,
            file_picker_types: "image media",
            media_live_embeds: true,
            paste_data_images: true,
            promotion: false,
            branding: false,
            resize: true,
            statusbar: true,
            elementpath: false,
            mobile: {
              menubar: true,
              toolbar_mode: 'scrolling'
            }
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {t("submit.story_helper")}
      </p>
    </div>
  );
};

export default TinyMCEEditor;
