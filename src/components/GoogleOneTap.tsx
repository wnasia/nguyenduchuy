import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const GOOGLE_CLIENT_ID = '208313812353-lb8hh2jl1l2sgqgprnq7j5jl87ar6fc3.apps.googleusercontent.com';

const GoogleOneTap = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
        cancel_on_tap_outside: false,
      });
      window.google.accounts.id.prompt();
    };
    document.head.appendChild(script);

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
      script.remove();
    };
  }, [user]);

  const handleCredentialResponse = async (response: any) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      if (error) console.error('Google One Tap sign-in error:', error);
    } catch (err) {
      console.error('Google One Tap error:', err);
    }
  };

  return null;
};

export default GoogleOneTap;
