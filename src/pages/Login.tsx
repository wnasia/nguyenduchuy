import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock } from "lucide-react";
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

  // Redirect if already logged in - go to dashboard
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
          toast({
            title: t("common.error"),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("auth.account_created"),
            description: t("auth.account_created_desc"),
          });
        }
      } else {
        const { error } = await signInWithEmail(formData.email, formData.password);
        if (error) {
          toast({
            title: t("common.error"),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("common.welcome"),
            description: t("auth.login_success"),
          });
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) {
        toast({
          title: t("common.error"),
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={huyLogo} alt="HUY" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-serif font-semibold mb-2">
            {isLogin ? t("auth.welcome_back") : t("auth.join_community")}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? t("auth.sign_in_description")
              : t("auth.create_account_description")
            }
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isLogin ? t("auth.sign_in") : t("auth.create_account")}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? t("auth.enter_credentials")
                : t("auth.fill_details")
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 py-6"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t("auth.continue_with_google")}
              </Button>
              
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 py-6"
                onClick={() => handleSocialLogin("facebook")}
                disabled={loading}
              >
                <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {t("auth.continue_with_facebook")}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">{t("auth.continue_with_email")}</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.full_name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t("auth.enter_full_name")}
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t("auth.enter_email")}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t("auth.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={t("auth.enter_password")}
                  required
                  disabled={loading}
                />
              </div>
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirm_password")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={t("auth.confirm_your_password")}
                    required={!isLogin}
                    disabled={loading}
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? t("common.loading") : (isLogin ? t("auth.sign_in") : t("auth.create_account"))}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? t("auth.no_account") : t("auth.have_account")}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline font-medium"
                  disabled={loading}
                >
                  {isLogin ? t("auth.sign_up") : t("auth.sign_in")}
                </button>
              </p>
            </div>

            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => toast({
                    title: t("auth.password_reset"),
                    description: t("auth.password_reset_desc"),
                  })}
                  disabled={loading}
                >
                  {t("auth.forgot_password")}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            {t("auth.terms_privacy")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
