import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { 
  User, Mail, Camera, Save, Loader2, Shield, Calendar, CheckCircle2, Upload,
  Wallet, TrendingUp, Clock, Gift, CreditCard, ArrowUpRight, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface WalletData {
  balance: number;
  total_earned: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
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
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

      // Fetch wallet
      const { data: walletData } = await supabase
        .from('wallet')
        .select('balance, total_earned')
        .eq('user_id', user?.id)
        .single();

      setWallet(walletData);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setTransactions(transactionsData || []);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const hasChanges = profile.full_name !== originalProfile.full_name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Profile Header */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20 shadow-md">
                <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {profile.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-full cursor-pointer",
                  "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity",
                  uploading && "opacity-100"
                )}
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
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

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {profile.full_name || "Người dùng"}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                {profile.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã xác thực
                </span>
                <span className="text-xs text-muted-foreground">
                  Tham gia: {user?.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left Column - Profile Form */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="p-4 pb-3 border-b bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-sm font-medium">Họ và tên</Label>
              <Input
                id="full_name"
                value={profile.full_name || ""}
                onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Nhập họ và tên"
                className="h-10"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                Email
                <span className="text-[10px] uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  Chỉ đọc
                </span>
              </Label>
              <Input
                id="email"
                value={profile.email || ""}
                disabled
                className="h-10 bg-muted/50 cursor-not-allowed"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={saving || !hasChanges}
                className={cn(
                  "gap-2 transition-all",
                  hasChanges && "bg-gradient-to-r from-primary to-blue-600"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Lưu thay đổi
              </Button>
              {hasChanges && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Chưa lưu
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Account Status & Wallet Summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Account Status */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Trạng thái</p>
                  <p className="text-xs text-green-600">Hoạt động bình thường</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 pb-3 border-b bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                Ví của tôi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Số dư</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(wallet?.balance || 0)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">đ</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tổng</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(wallet?.total_earned || 0)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">đ</span>
                  </p>
                </div>
              </div>

              {/* Withdrawal Notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-xs">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Rút tiền <span className="font-medium text-primary">sắp ra mắt</span> - tối thiểu 100.000đ
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wallet Details Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* How to Earn */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-3 border-b bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-amber-500" />
              Cách kiếm tiền
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2.5">
              {[
                { icon: "✍️", title: "Viết bài chất lượng", desc: "Thưởng khi bài được duyệt" },
                { icon: "👍", title: "Tương tác cao", desc: "Nhiều lượt xem và yêu thích" },
                { icon: "🎯", title: "Hoạt động đều", desc: "Bonus hàng tháng" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-3 border-b bg-muted/30">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Giao dịch gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Chưa có giao dịch</p>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                        tx.type === 'earning' ? "bg-green-500/10" : "bg-muted"
                      )}>
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          tx.type === 'earning' ? "text-green-600" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-semibold shrink-0 ml-2",
                      tx.type === 'withdrawal' ? "text-red-600" : "text-green-600"
                    )}>
                      {tx.type === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(tx.amount)}đ
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;