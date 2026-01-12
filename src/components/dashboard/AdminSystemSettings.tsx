import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RotateCcw, Globe, Bell, Shield, Palette, Database } from "lucide-react";

interface SystemSettings {
  site_name: string;
  site_tagline: string;
  default_language: string;
  posts_per_page: number;
  enable_comments: boolean;
  enable_user_registration: boolean;
  require_post_approval: boolean;
  enable_notifications: boolean;
  maintenance_mode: boolean;
  theme_primary_color: string;
}

const defaultSettings: SystemSettings = {
  site_name: "HUY Community",
  site_tagline: "Share your stories with the world",
  default_language: "vi",
  posts_per_page: 10,
  enable_comments: true,
  enable_user_registration: true,
  require_post_approval: true,
  enable_notifications: true,
  maintenance_mode: false,
  theme_primary_color: "#2563eb",
};

const AdminSystemSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
  }, []);

  const handleChange = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
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
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure global system settings and preferences
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
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={settings.site_name}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  placeholder="Your Site Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_tagline">Tagline</Label>
                <Input
                  id="site_tagline"
                  value={settings.site_tagline}
                  onChange={(e) => handleChange('site_tagline', e.target.value)}
                  placeholder="Your site tagline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_language">Default Language</Label>
                <Select 
                  value={settings.default_language} 
                  onValueChange={(value) => handleChange('default_language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="posts_per_page">Posts Per Page</Label>
                <Input
                  id="posts_per_page"
                  type="number"
                  min="5"
                  max="50"
                  value={settings.posts_per_page}
                  onChange={(e) => handleChange('posts_per_page', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Content Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Content Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to comment on posts
                  </p>
                </div>
                <Switch
                  checked={settings.enable_comments}
                  onCheckedChange={(checked) => handleChange('enable_comments', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Require Post Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    New posts must be approved by admin before publishing
                  </p>
                </div>
                <Switch
                  checked={settings.require_post_approval}
                  onCheckedChange={(checked) => handleChange('require_post_approval', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* User Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              User Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable User Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new users to create accounts
                  </p>
                </div>
                <Switch
                  checked={settings.enable_user_registration}
                  onCheckedChange={(checked) => handleChange('enable_user_registration', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h3>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to users
                </p>
              </div>
              <Switch
                checked={settings.enable_notifications}
                onCheckedChange={(checked) => handleChange('enable_notifications', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme_primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="theme_primary_color"
                    type="color"
                    value={settings.theme_primary_color}
                    onChange={(e) => handleChange('theme_primary_color', e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.theme_primary_color}
                    onChange={(e) => handleChange('theme_primary_color', e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Maintenance Mode */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-600">Danger Zone</h3>
            <div className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50">
              <div className="space-y-0.5">
                <Label className="text-base text-orange-800">Maintenance Mode</Label>
                <p className="text-sm text-orange-700">
                  Enable to show maintenance page to visitors
                </p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">Language</p>
              <p className="font-medium">{settings.default_language.toUpperCase()}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">Posts/Page</p>
              <p className="font-medium">{settings.posts_per_page}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">Comments</p>
              <p className="font-medium">{settings.enable_comments ? "Enabled" : "Disabled"}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground">Maintenance</p>
              <p className={`font-medium ${settings.maintenance_mode ? 'text-orange-600' : ''}`}>
                {settings.maintenance_mode ? "Active" : "Off"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemSettings;
