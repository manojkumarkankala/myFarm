import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import type { WebsiteSettings, Profile } from './types';

interface SiteContextValue {
  settings: WebsiteSettings;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSettings: WebsiteSettings = {
  id: '',
  site_name: 'AgriRent – Agricultural Equipment Booking',
  logo_url: null,
  favicon_url: null,
  hero_title: 'Book Agricultural Equipment for Your Farming Needs',
  hero_description: 'Affordable and convenient agricultural equipment rental services for modern farmers.',
  hero_image_url: null,
  hero_video_url: null,
  primary_color: '#16a34a',
  secondary_color: '#fef9c3',
  accent_color: '#facc15',
  contact_email: null,
  contact_phone: '8555895018',
  business_address: null,
  service_areas: 'Pune, Satara, Sangli, Kolhapur, Solapur',
  footer_content: '© 2025 AgriRent – Agricultural Equipment Booking. All rights reserved.',
  facebook_url: null,
  instagram_url: null,
  youtube_url: null,
  twitter_url: null,
  about_title: 'About AgriRent',
  about_description:
    'We provide modern agricultural equipment on rent to help farmers increase productivity and reduce manual labour.',
  why_choose_us:
    'Affordable pricing, well-maintained equipment, trained operators, timely service, and friendly support.',
  created_at: '',
  updated_at: '',
};

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WebsiteSettings>(defaultSettings);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [s, p] = await Promise.all([
      supabase.from('website_settings').select('*').limit(1).maybeSingle(),
      supabase.from('profiles').select('*').limit(1).maybeSingle(),
    ]);
    if (s.data) setSettings(s.data as WebsiteSettings);
    if (p.data) setProfile(p.data as Profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SiteContext.Provider value={{ settings, profile, loading, refresh }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
