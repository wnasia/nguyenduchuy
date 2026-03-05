import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, FolderOpen } from "lucide-react";
import { Editor } from "@tinymce/tinymce-react";
import { decodeHtmlEntities } from "@/lib/htmlUtils";

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
}

interface ParsedContent {
  story: string;
  imageLinks?: string[];
  videoLinks?: string[];
  tags?: string[];
}

interface Topic {
  id: string;
  name: string;
}

interface PostEditDialogProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
}

const PostEditDialog = ({ post, isOpen, onClose, onPostUpdated }: PostEditDialogProps) => {
  const { toast } = useToast();
  const editorRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newImageLink, setNewImageLink] = useState("");
  const [newVideoLink, setNewVideoLink] = useState("");
  const [newTag, setNewTag] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen]);

  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title);
      setType(post.type);
      setStatus(post.status);
      
      try {
        const parsed = JSON.parse(post.content);
        setStory(decodeHtmlEntities(parsed.story || ""));
        setImageLinks(parsed.imageLinks || []);
        setVideoLinks(parsed.videoLinks || []);
        setTags(parsed.tags || []);
      } catch {
        setStory(decodeHtmlEntities(post.content || ""));
        setImageLinks([]);
        setVideoLinks([]);
        setTags([]);
      }

      // Fetch post's current topics
      fetchPostTopics(post.id);
    } else if (!isOpen) {
      setTitle(""); setStory(""); setType(""); setStatus("");
      setImageLinks([]); setVideoLinks([]); setTags([]);
      setNewImageLink(""); setNewVideoLink(""); setNewTag("");
      setSelectedTopicIds([]);
    }
  }, [post, isOpen]);

  const fetchTopics = async () => {
    const { data } = await supabase.from('topics').select('id, name').eq('is_active', true).order('sort_order');
    setTopics(data || []);
  };

  const fetchPostTopics = async (postId: string) => {
    const { data } = await supabase.from('post_topics').select('topic_id').eq('post_id', postId);
    setSelectedTopicIds((data || []).map(d => d.topic_id));
  };

  const handleSave = async () => {
    if (!post) return;
    setLoading(true);
    try {
      const content = JSON.stringify({
        story,
        imageLinks: imageLinks.filter(link => link.trim()),
        videoLinks: videoLinks.filter(link => link.trim()),
        tags
      });

      const { error } = await supabase
        .from('posts')
        .update({ title, content, type, status, updated_at: new Date().toISOString() })
        .eq('id', post.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update post", variant: "destructive" });
      } else {
        // Sync topics
        await supabase.from('post_topics').delete().eq('post_id', post.id);
        if (selectedTopicIds.length > 0) {
          await supabase.from('post_topics').insert(
            selectedTopicIds.map(tid => ({ post_id: post.id, topic_id: tid }))
          );
        }

        toast({ title: "Success", description: "Post updated successfully" });
        onPostUpdated();
        onClose();
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
  };

  const addImageLink = () => { if (newImageLink.trim()) { setImageLinks([...imageLinks, newImageLink.trim()]); setNewImageLink(""); } };
  const removeImageLink = (index: number) => setImageLinks(imageLinks.filter((_, i) => i !== index));
  const addVideoLink = () => { if (newVideoLink.trim()) { setVideoLinks([...videoLinks, newVideoLink.trim()]); setNewVideoLink(""); } };
  const removeVideoLink = (index: number) => setVideoLinks(videoLinks.filter((_, i) => i !== index));
  const addTag = () => { if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag(""); } };
  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>Update the post details below</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter post title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="memory">Memory</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic Assignment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FolderOpen className="h-4 w-4" />Chủ đề</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
              {topics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có chủ đề nào</p>
              ) : (
                topics.map(topic => (
                  <label key={topic.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1.5 rounded text-sm">
                    <Checkbox
                      checked={selectedTopicIds.includes(topic.id)}
                      onCheckedChange={() => toggleTopic(topic.id)}
                    />
                    {topic.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Story Content</Label>
            <div className="border rounded-lg overflow-hidden bg-background">
              <Editor
                apiKey="cprbnjl7pha6mv3y0k84abwnf1mpieroa1h9xlfsdw091tn4"
                onInit={(evt, editor) => { editorRef.current = editor; }}
                value={story}
                onEditorChange={setStory}
                disabled={loading}
                init={{
                  height: 400, menubar: true,
                  plugins: ["advlist","autolink","lists","link","image","charmap","preview","anchor","searchreplace","visualblocks","code","fullscreen","insertdatetime","media","table","help","wordcount","emoticons"],
                  toolbar: "undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | blockquote | fontfamily fontsize | removeformat | help",
                  content_style: "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; padding: 10px; }",
                  promotion: false, branding: false, resize: true, statusbar: true, elementpath: false, entity_encoding: 'raw', encoding: 'UTF-8',
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Image Links</Label>
              <div className="flex gap-2 mt-2">
                <Input value={newImageLink} onChange={(e) => setNewImageLink(e.target.value)} placeholder="Enter image URL" onKeyPress={(e) => e.key === 'Enter' && addImageLink()} />
                <Button type="button" onClick={addImageLink}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {imageLinks.map((link, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">Image {index + 1}<X className="h-3 w-3 cursor-pointer" onClick={() => removeImageLink(index)} /></Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Video Links</Label>
              <div className="flex gap-2 mt-2">
                <Input value={newVideoLink} onChange={(e) => setNewVideoLink(e.target.value)} placeholder="Enter video URL" onKeyPress={(e) => e.key === 'Enter' && addVideoLink()} />
                <Button type="button" onClick={addVideoLink}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {videoLinks.map((link, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">Video {index + 1}<X className="h-3 w-3 cursor-pointer" onClick={() => removeVideoLink(index)} /></Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Enter tag" onKeyPress={(e) => e.key === 'Enter' && addTag()} />
                <Button type="button" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">{tag}<X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} /></Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;
