import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { Button, Input, Label } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

const SubmitForm = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-24 text-lg">
        Vui lòng đăng nhập để gửi bài viết của bạn.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Gửi dữ liệu tới backend hoặc Supabase (title, content)
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Label htmlFor="title">Tiêu đề bài viết</Label>
      <Input
        id="title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        placeholder="Nhập tiêu đề bài viết"
      />

      <Label htmlFor="content">Nội dung</Label>
      <Editor
        apiKey="cprbnjl7pha6mv3y0k84abwnf1mpieroa1h9xlfsdw091tn4"
        value={content}
        onEditorChange={setContent}
        init={{
          height: 400,
          menubar: true,
          plugins: [
            "advlist autolink lists link image charmap preview anchor",
            "searchreplace visualblocks code fullscreen",
            "insertdatetime media table paste code help wordcount",
            "emoticons media"
          ],
          toolbar:
            "undo redo | formatselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | blockquote | link image media | forecolor backcolor | fontselect fontsizeselect | removeformat | emoticons",
          images_upload_handler: function (blobInfo, success, failure) {
            // TODO: Xử lý upload ảnh lên backend hoặc dịch vụ lưu trữ
            failure('Chức năng upload ảnh chưa được cấu hình.');
          },
          automatic_uploads: true,
          file_picker_types: "image media",
          media_live_embeds: true,
        }}
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Đang gửi..." : "Gửi bài viết"}
      </Button>
    </form>
  );
};

export default SubmitForm;