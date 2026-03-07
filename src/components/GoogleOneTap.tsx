import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = "593289885498-rn9c3bsr7d0l38m7m5jovs2v4q3rjuji.apps.googleusercontent.com";

const GoogleOneTap = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || user) return;

    const initOneTap = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });
            if (!error) {
              navigate("/dashboard", { replace: true });
            }
          } catch (err) {
            console.error("One Tap login error:", err);
          }
        },
        auto_select: true,
        cancel_on_tap_outside: true,
        context: "signin",
        itp_support: true,
      });

      window.google.accounts.id.prompt();
    };

    // Wait for GSI script to load
    const timer = setTimeout(initOneTap, 1000);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return null;
};

export default GoogleOneTap;
