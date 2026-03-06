import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import SubmitFormHeader from "./SubmitFormHeader";
import StoryTitleInput from "./StoryTitleInput";
import TinyMCEEditor from "./TinyMCEEditor";
import ImageUpload from "./ImageUpload";
import VideoLinksManager from "./VideoLinksManager";
import TagsManager from "./TagsManager";
import SubmitButton from "./SubmitButton";
import LoginPrompt from "./LoginPrompt";
import TopicSelector from "./TopicSelector";

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

const DRAFT_KEY = 'story_draft';
const DRAFT_SAVE_INTERVAL = 5000; // 5 seconds

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
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const lastSavedRef = useRef<string>("");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get draft key unique to user and edit mode
  const getDraftKey = useCallback(() => {
    const baseKey = editId ? `${DRAFT_KEY}_edit_${editId}` : DRAFT_KEY;
    return user ? `${baseKey}_${user.id}` : baseKey;
  }, [editId, user]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    if (!user) return;
    
    const draftData = JSON.stringify(formData);
    // Only save if content actually changed
    if (draftData !== lastSavedRef.current && (formData.title.trim() || formData.story.trim())) {
      localStorage.setItem(getDraftKey(), draftData);
      lastSavedRef.current = draftData;
      console.log('Draft saved');
    }
  }, [formData, getDraftKey, user]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    if (!user) return null;
    
    try {
      const saved = localStorage.getItem(getDraftKey());
      if (saved) {
        return JSON.parse(saved) as FormData;
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
    return null;
  }, [getDraftKey, user]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    localStorage.removeItem(getDraftKey());
    lastSavedRef.current = "";
    setHasDraft(false);
  }, [getDraftKey]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, DRAFT_SAVE_INTERVAL);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, saveDraft]);

  // Save draft before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formData.title.trim() || formData.story.trim()) {
        saveDraft();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, saveDraft]);

  // Load existing post data or draft on mount
  useEffect(() => {
    const fetchPostData = async () => {
      if (!user) return;
      
      // Check for draft first (for new posts only)
      if (!editId) {
        const draft = loadDraft();
        if (draft && (draft.title.trim() || draft.story.trim())) {
          setFormData(draft);
          setHasDraft(true);
          toast({
            title: "Draft Restored",
            description: "Your unsaved draft has been restored.",
          });
          return;
        }
      }
      
      if (!editId) return;

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
          // Check for edit draft
          const editDraft = loadDraft();
          if (editDraft && (editDraft.title.trim() || editDraft.story.trim())) {
            setFormData(editDraft);
            setHasDraft(true);
            toast({
              title: "Draft Restored",
              description: "Your unsaved changes have been restored.",
            });
          } else {
            // Parse content from database
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

          // Load existing topic assignments
          const { data: topicData } = await supabase
            .from('post_topics')
            .select('topic_id')
            .eq('post_id', editId);
          setSelectedTopicIds((topicData || []).map(d => d.topic_id));
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
  }, [editId, user, navigate, toast, loadDraft]);

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

  const handleDiscardDraft = () => {
    clearDraft();
    setFormData({
      title: "",
      story: "",
      imageLinks: [],
      videoLinks: [""],
      tags: []
    });
    toast({
      title: "Draft Discarded",
      description: "Your draft has been deleted.",
    });
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

      // Sync topic assignments
      const postId = data.id;
      if (editId) {
        await supabase.from('post_topics').delete().eq('post_id', postId);
      }
      if (selectedTopicIds.length > 0) {
        await supabase.from('post_topics').insert(
          selectedTopicIds.map(tid => ({ post_id: postId, topic_id: tid }))
        );
      }

      // Clear draft on successful save
      clearDraft();

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

      {/* Draft indicator */}
      {hasDraft && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Unsaved draft restored</span>
          </div>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="text-sm text-yellow-700 hover:text-yellow-900 underline"
          >
            Discard Draft
          </button>
        </div>
      )}

      <Card className="border-0 shadow-xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Auto-save indicator */}
            <div className="flex items-center justify-end">
              <Badge variant="secondary" className="text-xs">
                Auto-save enabled
              </Badge>
            </div>

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

            <TopicSelector
              selectedTopicIds={selectedTopicIds}
              onTopicIdsChange={setSelectedTopicIds}
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
