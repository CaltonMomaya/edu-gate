'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Branding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  schoolName: string;
}

const defaultBranding: Branding = {
  logoUrl: '',
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
  schoolName: 'EDU GATE',
};

const BrandingContext = createContext<{
  branding: Branding;
  refreshBranding: () => void;
}>({
  branding: defaultBranding,
  refreshBranding: () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const supabase = createClient();

  const loadBranding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: userData } = await supabase.from('users').select('school_id').eq('id', user.id).single();
    if (!userData?.school_id) return;
    const { data: school } = await supabase.from('schools').select('name, logo_url, primary_color, secondary_color').eq('id', userData.school_id).single();
    if (school) {
      setBranding({
        logoUrl: school.logo_url || '',
        primaryColor: school.primary_color || '#3b82f6',
        secondaryColor: school.secondary_color || '#10b981',
        schoolName: school.name || 'EDU GATE',
      });
    }
  }, []);

  useEffect(() => { loadBranding(); }, [loadBranding]);

  return (
    <BrandingContext.Provider value={{ branding, refreshBranding: loadBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const { branding } = useContext(BrandingContext);
  return branding;
}

export function useRefreshBranding() {
  const { refreshBranding } = useContext(BrandingContext);
  return refreshBranding;
}
