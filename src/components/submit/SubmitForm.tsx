
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import SubmitFormHeader from "./SubmitFormHeader";
import StoryTitleInput from "./StoryTitleInput";
import StoryContentInput from "./StoryContentInput";
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

const SubmitForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    story: "",
    imageLinks: [],
    videoLinks: [""],
    tags: []
  });
  const [currentTag, setCurrentTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      console.log('Attempting to insert post with user_id:', user.id);

      const { data, error } = await supabase
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

      if (error) {
        console.error('Error creating post:', error);
        
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

      console.log('Post created successfully:', data);

      toast({
        title: "Story Submitted Successfully!",
        description: "Thank you for sharing your story. It will be reviewed and published soon.",
      });
      
      // Reset form
      setFormData({
        title: "",
        story: "",
        imageLinks: [],
        videoLinks: [""],
        tags: []
      });

      // Navigate to home page instead of dashboard to avoid potential routing issues
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

            <StoryContentInput
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

            <SubmitButton isSubmitting={isSubmitting} />
          </form>
        </CardContent>
      </Card>

      <LoginPrompt show={!user} />
    </>
  );
};

export default SubmitForm;
