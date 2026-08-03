import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Loader2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToR2 } from "@/lib/r2Upload";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface TokenBalance {
  balance: number;
  total_earned: number;
  total_valid_views: number;
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
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({
    balance: 0,
    total_earned: 0,
    total_valid_views: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, email")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;

      const profileInfo = {
        full_name: profileData?.full_name || user?.user_metadata?.full_name || "",
        avatar_url: profileData?.avatar_url || user?.user_metadata?.avatar_url || "",
        email: profileData?.email || user?.email || "",
      };

      setProfile(profileInfo);
      setOriginalProfile(profileInfo);

      // Fetch token balance
      const { data: balanceData } = await supabase
        .from("token_balances")
        .select("balance, total_earned, total_valid_views")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (balanceData) {
        setTokenBalance(balanceData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin",
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

      const { url: newAvatarUrl } = await uploadToR2(file, "avatars");


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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const hasChanges = profile.full_name !== originalProfile.full_name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Title */}
      <h1 className="text-xl font-bold mb-6 border-b border-border pb-3">Hồ sơ cá nhân</h1>

      {/* Two Column Layout - Compact, no scroll on desktop */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column - Profile Form (3/5) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <Avatar className="h-16 w-16 border-2 border-muted">
                    <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-full cursor-pointer",
                      "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                      uploading && "opacity-100"
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile.full_name || "Người dùng"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm">Họ và tên</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nhập họ và tên"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm flex items-center gap-2">
                    Email
                    <span className="text-[10px] uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      Chỉ đọc
                    </span>
                  </Label>
                  <Input
                    id="email"
                    value={profile.email || ""}
                    disabled
                    className="h-10 bg-muted/50"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || !hasChanges}
                  className="px-6 transition-all duration-200 hover:translate-x-0.5"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Lưu thay đổi
                </Button>
                {hasChanges && (
                  <span className="text-xs text-amber-600">Chưa lưu</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Wallet (2/5) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Account Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tài khoản</span>
                <span className="font-medium text-green-600">Hoạt động</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Xác thực</span>
                <span className="font-medium text-green-600">Đã xác thực</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tham gia</span>
                <span>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Summary - Merged into Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ví Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Số dư</span>
                <span className="font-bold text-primary">{formatNumber(tokenBalance.balance)} Token</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tổng đã kiếm</span>
                <span className="font-semibold">{formatNumber(tokenBalance.total_earned)} Token</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lượt đọc hợp lệ</span>
                <span>{formatNumber(tokenBalance.total_valid_views)}</span>
              </div>

              {/* Coming Soon Notice */}
              <div className="p-3 rounded-lg bg-muted/50 border border-dashed mt-3">
                <p className="text-xs text-center text-muted-foreground">
                  Rút tiền <span className="font-medium text-primary">sắp ra mắt</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
