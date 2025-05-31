
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, Image, Video, FileText, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Submit = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    story: "",
    imageLinks: [""],
    videoLinks: [""],
    tags: []
  });
  const [currentTag, setCurrentTag] = useState("");

  const handleAddImageLink = () => {
    setFormData(prev => ({
      ...prev,
      imageLinks: [...prev.imageLinks, ""]
    }));
  };

  const handleRemoveImageLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageLinks: prev.imageLinks.filter((_, i) => i !== index)
    }));
  };

  const handleImageLinkChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      imageLinks: prev.imageLinks.map((link, i) => i === index ? value : link)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Story Submitted!",
      description: "Thank you for sharing your story. It will be reviewed and published soon.",
    });
    
    // Reset form
    setFormData({
      title: "",
      story: "",
      imageLinks: [""],
      videoLinks: [""],
      tags: []
    });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4">Share Your Story</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Every story matters. Share your experiences, memories, and moments that have shaped your life. 
            Your story could inspire and connect with others in ways you never imagined.
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-serif flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Tell Your Story
            </CardTitle>
            <CardDescription>
              Fill out the form below to share your personal story with our community.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Story Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your story a meaningful title..."
                  className="text-lg"
                  required
                />
              </div>

              {/* Story Content */}
              <div className="space-y-2">
                <Label htmlFor="story" className="text-lg font-semibold">
                  Your Story
                </Label>
                <Textarea
                  id="story"
                  value={formData.story}
                  onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                  placeholder="Share your story here. What happened? How did it make you feel? What did you learn? Be as detailed or as brief as you'd like..."
                  className="min-h-[200px] text-base leading-relaxed"
                  required
                />
                <p className="text-sm text-gray-500">
                  Tell your story in your own words. There's no right or wrong way to share your experience.
                </p>
              </div>

              {/* Image Links */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Image Links (Optional)
                </Label>
                <p className="text-sm text-gray-600">
                  Add links to images from Google Drive, Imgur, or other image hosting services.
                </p>
                {formData.imageLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => handleImageLinkChange(index, e.target.value)}
                      placeholder="https://drive.google.com/your-image-link or https://imgur.com/..."
                      className="flex-1"
                    />
                    {formData.imageLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveImageLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddImageLink}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Image
                </Button>
              </div>

              {/* Video Links */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  YouTube Video Links (Optional)
                </Label>
                <p className="text-sm text-gray-600">
                  Share YouTube videos that are part of your story or help illustrate your experience.
                </p>
                {formData.videoLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => handleVideoLinkChange(index, e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1"
                    />
                    {formData.videoLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveVideoLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddVideoLink}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Video
                </Button>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">
                  Tags (Optional)
                </Label>
                <p className="text-sm text-gray-600">
                  Add tags to help others discover your story. Examples: family, love, loss, career, travel, etc.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Add Tag
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90">
                  Share My Story
                </Button>
                <p className="text-center text-sm text-gray-500 mt-4">
                  By submitting your story, you agree to share it with our community. 
                  We'll review it before publishing to ensure it meets our community guidelines.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Login Reminder */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-warm-100/30 border-primary/20">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold mb-2">Want to manage your stories?</h3>
            <p className="text-gray-600 mb-4">
              Create an account to edit your stories, track views, and connect with other storytellers.
            </p>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
              Sign Up or Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Submit;
