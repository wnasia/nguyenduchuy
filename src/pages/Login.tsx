import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import huyLogo from "@/assets/huy-logo.png";

const Login = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  usePageTitle("meta.login_title");
  const { user, signInWithEmail, signUpWithEmail, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: t("auth.password_mismatch"),
            description: t("auth.password_mismatch_desc"),
            variant: "destructive",
          });
          return;
        }
        const { error } = await signUpWithEmail(formData.email, formData.password, formData.name);
        if (error) {
          toast({ title: t("common.error"), description: error.message, variant: "destructive" });
        } else {
          toast({ title: t("auth.account_created"), description: t("auth.account_created_desc") });
        }
      } else {
        const { error } = await signInWithEmail(formData.email, formData.password);
        if (error) {
          toast({ title: t("common.error"), description: error.message, variant: "destructive" });
        } else {
          toast({ title: t("common.welcome"), description: t("auth.login_success") });
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithProvider('google');
      if (error) {
        toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <img src={huyLogo} alt="HUY" className="h-16 w-auto" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 font-serif">
            Chào mừng trở lại
          </h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Chia sẻ câu chuyện, kết nối cộng đồng và kiếm token khi đọc bài viết
          </p>
          <div className="mt-10 flex items-center justify-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Content Mining</span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <span>Token Rewards</span>
            <div className="w-px h-4 bg-white/30" />
            <span>Community</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <img src={huyLogo} alt="HUY" className="h-12 w-auto" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Đăng nhập để trải nghiệm đầy đủ tính năng" : "Tham gia cộng đồng chia sẻ câu chuyện"}
            </p>
          </div>

          {/* Google Button */}
          <Button
            className="w-full h-12 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-xl gap-3 mb-6"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Tiếp tục với Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">hoặc dùng email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">{t("auth.full_name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" type="text" value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                    placeholder="Nguyễn Văn A" required={!isLogin} disabled={loading}
                    className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" type="email" value={formData.email} 
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} 
                  placeholder="you@example.com" required disabled={loading}
                  className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" type="password" value={formData.password} 
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} 
                  placeholder="••••••••" required disabled={loading}
                  className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                />
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("auth.confirm_password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" type="password" value={formData.confirmPassword} 
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} 
                    placeholder="••••••••" required={!isLogin} disabled={loading}
                    className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-base font-medium gap-2" disabled={loading}>
              {loading ? t("common.loading") : (isLogin ? "Đăng nhập" : "Tạo tài khoản")}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Toggle + Forgot */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-semibold" disabled={loading}>
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
            {isLogin && (
              <button type="button" className="text-sm text-muted-foreground hover:text-primary transition-colors" onClick={() => toast({ title: t("auth.password_reset"), description: t("auth.password_reset_desc") })} disabled={loading}>
                Quên mật khẩu?
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">{t("auth.terms_privacy")}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
