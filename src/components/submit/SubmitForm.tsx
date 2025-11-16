
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent } from "@/components/ui/card";
import SubmitFormHeader from "./SubmitFormHeader";
import StoryTitleInput from "./StoryTitleInput";
import TinyMCEEditor from "./TinyMCEEditor";
import ImageUpload from "./ImageUpload";
import VideoLinksManager from "./VideoLinksManager";
import TagsManager from "./TagsManager";
import SubmitButton from "./SubmitButton";
import LoginPrompt from "./LoginPrompt";

export interface FormData {
  title: string;
  story: string;
  imageLinks: string[];
  videoLinks: string[];
  tags: string[];
}

interface SubmitFormProps {
  editId?: string;
}

const SubmitForm = ({ editId }: SubmitFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    story: "",
    imageLinks: [],
    videoLinks: [""],
    tags: []
  });
  const [currentTag, setCurrentTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch post data if editing
  useEffect(() => {
    const fetchPostData = async () => {
      if (!editId || !user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', editId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching post:', error);
          toast({
            title: "Error",
            description: "Failed to load story for editing",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        if (data) {
          // Parse content
          try {
            const parsed = JSON.parse(data.content || '{}');
            setFormData({
              title: data.title,
              story: parsed.story || '',
              imageLinks: parsed.imageLinks || [],
              videoLinks: parsed.videoLinks?.length > 0 ? parsed.videoLinks : [''],
              tags: parsed.tags || []
            });
          } catch (e) {
            console.error('Error parsing content:', e);
            setFormData({
              title: data.title,
              story: data.content || '',
              imageLinks: [],
              videoLinks: [''],
              tags: []
            });
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [editId, user, navigate, toast]);

  const handleImageLinksChange = (links: string[]) => {
    setFormData(prev => ({
      ...prev,
      imageLinks: links
    }));
  };

  const handleAddVideoLink = () => {
    setFormData(prev => ({
      ...prev,
      videoLinks: [...prev.videoLinks, ""]
    }));
  };

  const handleRemoveVideoLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videoLinks: prev.videoLinks.filter((_, i) => i !== index)
    }));
  };

  const handleVideoLinkChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      videoLinks: prev.videoLinks.map((link, i) => i === index ? value : link)
    }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your story.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty links
      const videoLinks = formData.videoLinks.filter(link => link.trim() !== '');

      // Prepare content with all the story elements
      const content = JSON.stringify({
        story: formData.story,
        imageLinks: formData.imageLinks,
        videoLinks,
        tags: formData.tags
      });

      console.log('Attempting to save post with user_id:', user.id);

      let result;
      if (editId) {
        // Update existing post
        result = await supabase
          .from('posts')
          .update({
            title: formData.title,
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new post
        result = await supabase
          .from('posts')
          .insert([
            {
              title: formData.title,
              content: content,
              type: 'story',
              status: 'pending',
              user_id: user.id,
              view_count: 0
            }
          ])
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        console.error('Error saving post:', error);
        
        // Check if it's a Row Level Security issue
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          toast({
            title: "Permission Error",
            description: "There was an issue with permissions. Please try refreshing the page and logging in again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to submit your story. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      console.log('Post saved successfully:', data);

      toast({
        title: editId ? "Story Updated" : t("submit.success_title"),
        description: editId ? "Your story has been updated successfully" : t("submit.success_message"),
      });
      
      // Navigate to dashboard instead of resetting form
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: t("submit.error_title"),
        description: t("submit.error_message"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SubmitFormHeader />

      <Card className="border-0 shadow-xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
          <StoryTitleInput
            value={formData.title}
            onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
            disabled={isSubmitting}
          />

          <TinyMCEEditor
            value={formData.story}
            onChange={(value) => setFormData(prev => ({ ...prev, story: value }))}
            disabled={isSubmitting}
          />

            <ImageUpload
              imageLinks={formData.imageLinks}
              onImageLinksChange={handleImageLinksChange}
              disabled={isSubmitting}
            />

            <VideoLinksManager
              videoLinks={formData.videoLinks}
              onAdd={handleAddVideoLink}
              onRemove={handleRemoveVideoLink}
              onChange={handleVideoLinkChange}
              disabled={isSubmitting}
            />

            <TagsManager
              tags={formData.tags}
              currentTag={currentTag}
              onCurrentTagChange={setCurrentTag}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              disabled={isSubmitting}
            />

            <SubmitButton isSubmitting={isSubmitting} isEditing={!!editId} />
          </form>
        </CardContent>
      </Card>

      <LoginPrompt show={!user} />
    </>
  );
};

export default SubmitForm;
