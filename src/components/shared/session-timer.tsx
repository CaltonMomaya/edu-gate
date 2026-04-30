'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before timeout

export function SessionTimer() {
  const router = useRouter();
  const supabase = createClient();
  const [lastActivity, setLastActivity] = useState(Date.now());

  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => events.forEach(event => window.removeEventListener(event, handleActivity));
  }, [handleActivity]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const inactiveTime = Date.now() - lastActivity;
      
      if (inactiveTime >= SESSION_TIMEOUT) {
        // Auto logout
        await supabase.auth.signOut();
        toast.error('Session expired due to inactivity. Please log in again.');
        router.push('/login');
        router.refresh();
      } else if (inactiveTime >= SESSION_TIMEOUT - WARNING_TIME) {
        // Show warning
        toast.warning('Your session will expire soon due to inactivity.', { duration: 10000 });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [lastActivity, router, supabase]);

  return null; // This component doesn't render anything
}
