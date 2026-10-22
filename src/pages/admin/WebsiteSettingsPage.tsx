import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WebsiteSettings } from '@/lib/types';
import { useSite } from '@/lib/site';
import { Save, Upload } from 'lucide-react';

export default function WebsiteSettingsPage() {
  const { settings, refresh } = useSite();
  const [form, setForm] = useState<Partial<WebsiteSettings>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.from('website_settings').update({
        site_name: form.site_name, logo_url: form.logo_url, favicon_url: form.favicon_url,
        hero_title: form.hero_title, hero_description: form.hero_description,
        hero_image_url: form.hero_image_url, hero_video_url: form.hero_video_url,
        primary_color: form.primary_color, secondary_color: form.secondary_color, accent_color: form.accent_color,
        contact_email: form.contact_email, contact_phone: form.contact_phone,
        business_address: form.business_address, service_areas: form.service_areas,
        footer_content: form.footer_content, facebook_url: form.facebook_url,
        instagram_url: form.instagram_url, youtube_url: form.youtube_url, twitter_url: form.twitter_url,
        updated_at: new Date().toISOString(),
      }).eq('id', form.id);
      if (error) throw error;
      await refresh();
      setMsg({ type: 'success', text: 'Settings saved.' });
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setBusy(false);
  };

  const upload = async (file: File, field: 'logo_url' | 'hero_image_url') => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `branding/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setForm({ ...form, [field]: data.publicUrl });
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setUploading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Website Settings</h1>
      <p className="mt-1 text-sm text-stone-500">Branding, hero, contact info and social links.</p>

      {msg && <div className={`mt-4 rounded-xl p-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="font-bold text-stone-900">Branding</h2>
          <div className="mt-4 space-y-3">
            <div><label className="label">Website Name</label><input value={form.site_name || ''} onChange={(e) => setForm({ ...form, site_name: e.target.value })} className="input" /></div>
            <div>
              <label className="label">Logo</label>
              {form.logo_url && <img src={form.logo_url} alt="logo" className="h-12 w-12 rounded-lg object-cover" />}
              <label className="btn-outline mt-2 w-full cursor-pointer">
                <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'logo_url')} />
              </label>
              <input value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="input mt-2" placeholder="or paste URL" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Primary</label><input type="color" value={form.primary_color || '#16a34a'} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-full rounded-lg border border-stone-300" /></div>
              <div><label className="label">Secondary</label><input type="color" value={form.secondary_color || '#fef9c3'} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-10 w-full rounded-lg border border-stone-300" /></div>
              <div><label className="label">Accent</label><input type="color" value={form.accent_color || '#facc15'} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 w-full rounded-lg border border-stone-300" /></div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="font-bold text-stone-900">Hero Section</h2>
          <div className="mt-4 space-y-3">
            <div><label className="label">Hero Title</label><input value={form.hero_title || ''} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} className="input" /></div>
            <div><label className="label">Hero Description</label><textarea rows={2} value={form.hero_description || ''} onChange={(e) => setForm({ ...form, hero_description: e.target.value })} className="input" /></div>
            <div>
              <label className="label">Hero Image</label>
              {form.hero_image_url && <img src={form.hero_image_url} alt="hero" className="mt-1 aspect-video w-full rounded-xl object-cover" />}
              <label className="btn-outline mt-2 w-full cursor-pointer">
                <Upload size={16} /> Upload Hero Image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'hero_image_url')} />
              </label>
              <input value={form.hero_image_url || ''} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} className="input mt-2" placeholder="or paste URL" />
            </div>
            <div><label className="label">Hero Video URL (optional)</label><input value={form.hero_video_url || ''} onChange={(e) => setForm({ ...form, hero_video_url: e.target.value })} className="input" /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="font-bold text-stone-900">Contact & Address</h2>
          <div className="mt-4 space-y-3">
            <div><label className="label">Contact Phone</label><input value={form.contact_phone || ''} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="input" /></div>
            <div><label className="label">Contact Email</label><input value={form.contact_email || ''} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="input" /></div>
            <div><label className="label">Business Address</label><input value={form.business_address || ''} onChange={(e) => setForm({ ...form, business_address: e.target.value })} className="input" /></div>
            <div><label className="label">Service Areas</label><input value={form.service_areas || ''} onChange={(e) => setForm({ ...form, service_areas: e.target.value })} className="input" /></div>
            <div><label className="label">Footer Content</label><textarea rows={2} value={form.footer_content || ''} onChange={(e) => setForm({ ...form, footer_content: e.target.value })} className="input" /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="font-bold text-stone-900">Social Media</h2>
          <div className="mt-4 space-y-3">
            <div><label className="label">Facebook URL</label><input value={form.facebook_url || ''} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} className="input" /></div>
            <div><label className="label">Instagram URL</label><input value={form.instagram_url || ''} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} className="input" /></div>
            <div><label className="label">YouTube URL</label><input value={form.youtube_url || ''} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} className="input" /></div>
            <div><label className="label">Twitter URL</label><input value={form.twitter_url || ''} onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} className="input" /></div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={busy} className="btn-primary mt-6"><Save size={16} /> {busy ? 'Saving...' : 'Save Settings'}</button>
    </div>
  );
}
