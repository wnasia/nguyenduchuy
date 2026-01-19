import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Camera, Save, Loader2, Shield, Calendar, CheckCircle2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    avatar_url: "",
    email: "",
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileData>({
    full_name: "",
    avatar_url: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, email")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      const profileData = {
        full_name: data?.full_name || user?.user_metadata?.full_name || "",
        avatar_url: data?.avatar_url || user?.user_metadata?.avatar_url || "",
        email: data?.email || user?.email || "",
      };

      setProfile(profileData);
      setOriginalProfile(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin hồ sơ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file hình ảnh",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Lỗi",
        description: "Kích thước ảnh không được vượt quá 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("story-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("story-images")
        .getPublicUrl(filePath);

      const newAvatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));

      toast({
        title: "Thành công",
        description: "Đã cập nhật ảnh đại diện",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lên ảnh đại diện",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!profile.full_name?.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập họ và tên",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setOriginalProfile(profile);

      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin hồ sơ",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin hồ sơ",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = profile.full_name !== originalProfile.full_name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Profile Hero Section */}
      <Card className="overflow-hidden shadow-lg border-0">
        <div className="relative h-32 sm:h-40 bg-gradient-to-br from-primary via-blue-500 to-indigo-600">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2di00aC0ydjRoMnptMC02di00aC0ydjRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        </div>
        
        <CardContent className="relative pb-8">
          {/* Avatar positioned over the gradient */}
          <div className="absolute -top-16 left-6 sm:left-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300" />
              <Avatar className="relative h-28 w-28 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-indigo-500/20 text-primary text-3xl font-bold">
                  {profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-full cursor-pointer",
                  "bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300",
                  "backdrop-blur-sm",
                  uploading && "opacity-100"
                )}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-6 w-6 text-white" />
                    <span className="text-[10px] text-white font-medium">Thay đổi</span>
                  </div>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>
          </div>

          {/* User Summary Info */}
          <div className="pt-16 sm:pt-20 pl-2 sm:pl-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {profile.full_name || "Người dùng"}
                </h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>Tài khoản đã xác thực</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Full Name Field */}
            <div className="space-y-3">
              <Label htmlFor="full_name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Họ và tên
              </Label>
              <Input
                id="full_name"
                value={profile.full_name || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nhập họ và tên của bạn"
                className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">
                Tên hiển thị trên các bài viết và trang cá nhân của bạn
              </p>
            </div>

            <Separator />

            {/* Email Field (Read-only) */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Địa chỉ Email
                <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                  Chỉ đọc
                </span>
              </Label>
              <Input
                id="email"
                value={profile.email || ""}
                disabled
                className="h-12 text-base bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email đăng nhập không thể thay đổi vì lý do bảo mật
              </p>
            </div>

            <Separator />

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={saving || !hasChanges}
                size="lg"
                className={cn(
                  "w-full sm:w-auto min-w-[180px] h-12 text-base font-semibold gap-3",
                  "transition-all duration-300",
                  hasChanges
                    ? "bg-gradient-to-r from-primary via-blue-500 to-indigo-600 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
                    : "opacity-50"
                )}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              {hasChanges && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Có thay đổi chưa lưu
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Info Sidebar */}
        <div className="space-y-6">
          {/* Account Status Card */}
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Trạng thái tài khoản
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-400">Hoạt động</p>
                  <p className="text-xs text-muted-foreground">Tài khoản của bạn đang hoạt động bình thường</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join Date Card */}
          <Card className="shadow-md">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Ngày tham gia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Thành viên của cộng đồng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Tips Card */}
          <Card className="shadow-md border-dashed">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                  <Camera className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Mẹo ảnh đại diện</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sử dụng ảnh rõ nét với khuôn mặt ở trung tâm. Kích thước tối đa 2MB, định dạng JPG hoặc PNG.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
