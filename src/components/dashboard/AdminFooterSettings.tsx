import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, RotateCcw, Facebook, Twitter, Send, Globe, Mail, Phone, MapPin } from "lucide-react";

interface FooterSettings {
  about_description: string;
  copyright_text: string;
  facebook_url: string;
  twitter_url: string;
  telegram_url: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  privacy_policy_url: string;
  terms_of_service_url: string;
}

const defaultSettings: FooterSettings = {
  about_description: "A warm place to share precious moments, unique stories, and life experiences.",
  copyright_text: "© 2025 All rights reserved.",
  facebook_url: "https://facebook.com",
  twitter_url: "https://twitter.com",
  telegram_url: "https://t.me/tkwni",
  contact_email: "",
  contact_phone: "",
  contact_address: "",
  privacy_policy_url: "#",
  terms_of_service_url: "#",
};

const AdminFooterSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage (in a real app, this would come from the database)
    const savedSettings = localStorage.getItem('footerSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
  }, []);

  const handleChange = (key: keyof FooterSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, save to database
      localStorage.setItem('footerSettings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Footer settings have been updated successfully.",
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Footer Management
              </CardTitle>
              <CardDescription>
                Manage footer content, social links, and contact information
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={loading || !hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              About Section
            </h3>
            <div className="space-y-2">
              <Label htmlFor="about_description">Description</Label>
              <Textarea
                id="about_description"
                value={settings.about_description}
                onChange={(e) => handleChange('about_description', e.target.value)}
                placeholder="Enter site description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copyright_text">Copyright Text</Label>
              <Input
                id="copyright_text"
                value={settings.copyright_text}
                onChange={(e) => handleChange('copyright_text', e.target.value)}
                placeholder="© 2025 Your Company"
              />
            </div>
          </div>

          <Separator />

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook_url" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  Facebook URL
                </Label>
                <Input
                  id="facebook_url"
                  value={settings.facebook_url}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter_url" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter URL
                </Label>
                <Input
                  id="twitter_url"
                  value={settings.twitter_url}
                  onChange={(e) => handleChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram_url" className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-[#0088cc]" />
                  Telegram URL
                </Label>
                <Input
                  id="telegram_url"
                  value={settings.telegram_url}
                  onChange={(e) => handleChange('telegram_url', e.target.value)}
                  placeholder="https://t.me/yourusername"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Email
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="contact@yoursite.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+84 xxx xxx xxx"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contact_address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="contact_address"
                  value={settings.contact_address}
                  onChange={(e) => handleChange('contact_address', e.target.value)}
                  placeholder="Your business address..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Legal Pages */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal Pages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="privacy_policy_url">Privacy Policy URL</Label>
                <Input
                  id="privacy_policy_url"
                  value={settings.privacy_policy_url}
                  onChange={(e) => handleChange('privacy_policy_url', e.target.value)}
                  placeholder="/privacy-policy or external URL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms_of_service_url">Terms of Service URL</Label>
                <Input
                  id="terms_of_service_url"
                  value={settings.terms_of_service_url}
                  onChange={(e) => handleChange('terms_of_service_url', e.target.value)}
                  placeholder="/terms or external URL"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>See how your footer will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <p className="font-semibold">About</p>
              <p className="text-sm text-muted-foreground">{settings.about_description}</p>
            </div>
            <div className="flex gap-3">
              {settings.facebook_url && (
                <div className="p-2 bg-background rounded border">
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                </div>
              )}
              {settings.twitter_url && (
                <div className="p-2 bg-background rounded border">
                  <Twitter className="h-4 w-4" />
                </div>
              )}
              {settings.telegram_url && (
                <div className="p-2 bg-background rounded border">
                  <Send className="h-4 w-4 text-[#0088cc]" />
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{settings.copyright_text}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFooterSettings;
