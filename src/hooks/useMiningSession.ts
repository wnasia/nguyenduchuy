import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MiningSessionState {
  sessionId: string | null;
  activeSeconds: number;
  isValid: boolean;
  isActive: boolean;
  minRequired: number;
  alreadyCounted: boolean;
}

// Generate browser fingerprint
const generateFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    canvas.toDataURL(),
  ];
  
  // Simple hash function
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
};

export const useMiningSession = (postId: string | undefined) => {
  const { session } = useAuth();
  const [state, setState] = useState<MiningSessionState>({
    sessionId: null,
    activeSeconds: 0,
    isValid: false,
    isActive: true,
    minRequired: 30,
    alreadyCounted: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const fingerprintRef = useRef<string>('');
  const lastHeartbeatRef = useRef<number>(Date.now());
  const activeTimeRef = useRef<number>(0);
  
  // Track tab visibility
  const isVisibleRef = useRef<boolean>(true);

  const sendHeartbeat = useCallback(async () => {
    if (!postId || !fingerprintRef.current) return;
    
    try {
      const response = await fetch(
        'https://onihezlpgofqzutuxahv.supabase.co/functions/v1/mining-heartbeat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-fingerprint': fingerprintRef.current,
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({
            sessionId: state.sessionId,
            postId,
            isVisible: isVisibleRef.current,
            activeSeconds: activeTimeRef.current,
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          sessionId: data.sessionId || prev.sessionId,
          isValid: data.isValid || prev.isValid,
          minRequired: data.minRequired || prev.minRequired,
          alreadyCounted: data.alreadyCounted || prev.alreadyCounted,
        }));
        lastHeartbeatRef.current = Date.now();
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, [postId, session?.access_token, state.sessionId]);

  // Initialize session
  useEffect(() => {
    if (!postId) return;
    
    // Generate fingerprint once
    if (!fingerprintRef.current) {
      fingerprintRef.current = generateFingerprint();
    }
    
    // Initial heartbeat to create session
    sendHeartbeat();
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [postId]);

  // Track active time
  useEffect(() => {
    if (!postId) return;
    
    // Increment active seconds every second when visible
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        activeTimeRef.current += 1;
        setState(prev => ({
          ...prev,
          activeSeconds: activeTimeRef.current,
        }));
      }
    }, 1000);
    
    // Send heartbeat every 10 seconds
    heartbeatRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        sendHeartbeat();
      }
    }, 10000);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [postId, sendHeartbeat]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      setState(prev => ({ ...prev, isActive: isVisibleRef.current }));
      
      // Send heartbeat when tab becomes visible again
      if (isVisibleRef.current) {
        sendHeartbeat();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendHeartbeat]);

  return {
    ...state,
    progress: Math.min(100, (state.activeSeconds / state.minRequired) * 100),
  };
};
