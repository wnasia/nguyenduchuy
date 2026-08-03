import { useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/useI18n";
import { supabase } from "@/integrations/supabase/client";
import { uploadToR2 } from "@/lib/r2Upload";
import { useToast } from "@/hooks/use-toast";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RichTextEditor = ({ value, onChange, disabled }: RichTextEditorProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = async () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
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

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: t("submit.auth_required"),
            description: t("submit.login_to_upload"),
            variant: "destructive",
          });
          return;
        }

        const { url } = await uploadToR2(file, "stories");

        if (url) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", url);
            quill.setSelection(range.index + 1, 0);
          }

          toast({
            title: t("common.success"),
            description: t("submit.image_uploaded_success"),
          });
        }

      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: t("common.error"),
          description: t("submit.unexpected_upload_error"),
          variant: "destructive",
        });
      }
    };
  };

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "direction",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video",
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="story" className="text-lg font-semibold">
        {t("submit.story_label")}
      </Label>
      <div className="border rounded-lg overflow-hidden bg-background">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={t("submit.story_placeholder")}
          readOnly={disabled}
          className="min-h-[300px]"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {t("submit.story_helper")}
      </p>
    </div>
  );
};

export default RichTextEditor;
