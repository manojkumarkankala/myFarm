import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Save, Upload } from 'lucide-react';

export default function ManageProfile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      .then(({ data }) => setForm(data as Profile || {}));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true); setMsg(null);
    try {
      const payload = {
        owner_name: form.owner_name, owner_photo: form.owner_photo, business_name: form.business_name,
        biography: form.biography, farming_experience: form.farming_experience,
        mobile_number: form.mobile_number, whatsapp_number: form.whatsapp_number,
        email_address: form.email_address, business_address: form.business_address,
        village_town: form.village_town, service_areas: form.service_areas, working_hours: form.working_hours,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setBusy(false);
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `owner/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setForm({ ...form, owner_photo: data.publicUrl });
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setUploading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Owner Profile</h1>
      <p className="mt-1 text-sm text-stone-500">This information appears on the home and contact pages.</p>

      {msg && <div className={`mt-4 rounded-xl p-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="font-bold text-stone-900">Photo</h2>
          {form.owner_photo && <img src={form.owner_photo} alt="owner" className="mt-3 aspect-square w-full rounded-2xl object-cover" />}
          <label className="btn-outline mt-3 w-full cursor-pointer">
            <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Owner Name</label><input value={form.owner_name || ''} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="input" /></div>
            <div><label className="label">Business Name</label><input value={form.business_name || ''} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="input" /></div>
            <div><label className="label">Mobile Number</label><input value={form.mobile_number || ''} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="input" /></div>
            <div><label className="label">WhatsApp Number</label><input value={form.whatsapp_number || ''} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className="input" /></div>
            <div><label className="label">Email Address</label><input value={form.email_address || ''} onChange={(e) => setForm({ ...form, email_address: e.target.value })} className="input" /></div>
            <div><label className="label">Village / Town</label><input value={form.village_town || ''} onChange={(e) => setForm({ ...form, village_town: e.target.value })} className="input" /></div>
            <div className="sm:col-span-2"><label className="label">Business Address</label><input value={form.business_address || ''} onChange={(e) => setForm({ ...form, business_address: e.target.value })} className="input" /></div>
            <div><label className="label">Service Areas</label><input value={form.service_areas || ''} onChange={(e) => setForm({ ...form, service_areas: e.target.value })} className="input" placeholder="Pune, Satara..." /></div>
            <div><label className="label">Working Hours</label><input value={form.working_hours || ''} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} className="input" placeholder="Mon-Sat: 6 AM - 7 PM" /></div>
            <div className="sm:col-span-2"><label className="label">Biography</label><textarea rows={3} value={form.biography || ''} onChange={(e) => setForm({ ...form, biography: e.target.value })} className="input" /></div>
            <div className="sm:col-span-2"><label className="label">Farming Experience</label><textarea rows={2} value={form.farming_experience || ''} onChange={(e) => setForm({ ...form, farming_experience: e.target.value })} className="input" /></div>
          </div>
          <button onClick={save} disabled={busy} className="btn-primary mt-5"><Save size={16} /> {busy ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </div>
    </div>
  );
}
