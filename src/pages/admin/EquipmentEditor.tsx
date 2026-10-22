import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Equipment, EquipmentImage } from '@/lib/types';
import { ArrowLeft, Save, Plus, Trash2, Upload } from 'lucide-react';

interface Props {
  equipmentId: string | null; // null = new
  navigate: (to: string) => void;
}

const empty: Partial<Equipment> = {
  name: '', category: '', slug: '', main_image_url: '',
  description: '', price: 0, pricing_unit: 'per acre',
  service_locations: '', availability_status: 'available', is_active: true,
  sort_order: 0, specifications: {},
};

export default function EquipmentEditor({ equipmentId, navigate }: Props) {
  const [form, setForm] = useState<Partial<Equipment>>(empty);
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [images, setImages] = useState<EquipmentImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!equipmentId) return;
    (async () => {
      const [{ data: eq }, { data: imgs }] = await Promise.all([
        supabase.from('equipment').select('*').eq('id', equipmentId).maybeSingle(),
        supabase.from('equipment_images').select('*').eq('equipment_id', equipmentId).order('sort_order'),
      ]);
      if (eq) setForm(eq as Equipment);
      setImages((imgs as EquipmentImage[]) || []);
    })();
  }, [equipmentId]);

  const uploadFile = async (file: File, kind: 'main' | 'gallery') => {
    setUploading(true);
    setMsg(null);
    try {
      const ext = file.name.split('.').pop();
      const path = `equipment/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
      const url = pub.publicUrl;

      if (kind === 'main') {
        setForm({ ...form, main_image_url: url });
      } else if (equipmentId) {
        await supabase.from('equipment_images').insert({ equipment_id: equipmentId, image_url: url, sort_order: images.length });
        const { data } = await supabase.from('equipment_images').select('*').eq('equipment_id', equipmentId).order('sort_order');
        setImages((data as EquipmentImage[]) || []);
      }
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setUploading(false);
  };

  const addSpec = () => {
    if (!specKey) return;
    setForm({ ...form, specifications: { ...(form.specifications || {}), [specKey]: specVal } });
    setSpecKey(''); setSpecVal('');
  };

  const removeSpec = (key: string) => {
    const next = { ...(form.specifications || {}) };
    delete next[key];
    setForm({ ...form, specifications: next });
  };

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      const payload = {
        name: form.name, category: form.category, slug: form.slug || null,
        main_image_url: form.main_image_url || null, description: form.description || null,
        specifications: form.specifications || {}, price: Number(form.price) || 0,
        pricing_unit: form.pricing_unit, service_locations: form.service_locations || null,
        availability_status: form.availability_status, is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };
      if (equipmentId) {
        const { error } = await supabase.from('equipment').update(payload).eq('id', equipmentId);
        if (error) throw error;
        setMsg({ type: 'success', text: 'Equipment updated.' });
      } else {
        const { data, error } = await supabase.from('equipment').insert(payload).select().single();
        if (error) throw error;
        setMsg({ type: 'success', text: 'Equipment created.' });
        navigate(`/admin/equipment/${(data as Equipment).id}`);
      }
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setBusy(false);
  };

  const addImageUrl = async () => {
    if (!newImageUrl || !equipmentId) return;
    await supabase.from('equipment_images').insert({ equipment_id: equipmentId, image_url: newImageUrl, sort_order: images.length });
    setNewImageUrl('');
    const { data } = await supabase.from('equipment_images').select('*').eq('equipment_id', equipmentId).order('sort_order');
    setImages((data as EquipmentImage[]) || []);
  };

  const delImage = async (id: string) => {
    await supabase.from('equipment_images').delete().eq('id', id);
    setImages(images.filter((i) => i.id !== id));
  };

  return (
    <div>
      <button onClick={() => navigate('/admin/equipment')} className="btn-ghost mb-4">
        <ArrowLeft size={16} /> Back to Equipment
      </button>
      <h1 className="text-2xl font-bold text-stone-900">{equipmentId ? 'Edit Equipment' : 'Add Equipment'}</h1>

      {msg && <div className={`mt-4 rounded-xl p-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
            <h2 className="font-bold text-stone-900">Basic Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label className="label">Name *</label><input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></div>
              <div><label className="label">Category *</label><input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" placeholder="Drone, Tractor, etc." /></div>
              <div><label className="label">Slug (optional)</label><input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" placeholder="my-equipment" /></div>
              <div><label className="label">Availability Status</label>
                <select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })} className="input">
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" /></div>
              <div><label className="label">Price *</label><input type="number" value={form.price ?? 0} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input" /></div>
              <div><label className="label">Pricing Unit</label>
                <select value={form.pricing_unit} onChange={(e) => setForm({ ...form, pricing_unit: e.target.value })} className="input">
                  <option value="per acre">Per Acre</option>
                  <option value="per hour">Per Hour</option>
                  <option value="per day">Per Day</option>
                  <option value="per job">Per Job</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label">Service Locations</label><input value={form.service_locations || ''} onChange={(e) => setForm({ ...form, service_locations: e.target.value })} className="input" placeholder="Pune, Satara..." /></div>
              <div><label className="label">Sort Order</label><input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input" /></div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="active" className="text-sm font-medium text-stone-700">Active (visible on website)</label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
            <h2 className="font-bold text-stone-900">Specifications</h2>
            <div className="mt-4 flex gap-2">
              <input value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="Key (e.g. engine)" className="input" />
              <input value={specVal} onChange={(e) => setSpecVal(e.target.value)} placeholder="Value (e.g. 120 HP)" className="input" />
              <button type="button" onClick={addSpec} className="btn-outline"><Plus size={16} /> Add</button>
            </div>
            <div className="mt-3 space-y-2">
              {Object.entries(form.specifications || {}).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-lg bg-stone-50 p-2.5">
                  <span className="text-sm"><strong className="capitalize">{k.replace(/_/g, ' ')}:</strong> {v}</span>
                  <button onClick={() => removeSpec(k)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
            <h2 className="font-bold text-stone-900">Main Image</h2>
            {form.main_image_url && <img src={form.main_image_url} alt="main" className="mt-3 aspect-video w-full rounded-xl object-cover" />}
            <label className="btn-outline mt-3 w-full cursor-pointer">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'main')} />
            </label>
            <input value={form.main_image_url || ''} onChange={(e) => setForm({ ...form, main_image_url: e.target.value })} className="input mt-2" placeholder="or paste image URL" />
          </div>

          {equipmentId && (
            <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
              <h2 className="font-bold text-stone-900">Gallery Images</h2>
              <div className="mt-3 space-y-2">
                {images.map((img) => (
                  <div key={img.id} className="flex items-center gap-2 rounded-lg bg-stone-50 p-2">
                    <img src={img.image_url} alt="" className="h-12 w-12 rounded object-cover" />
                    <span className="flex-1 truncate text-xs text-stone-600">{img.image_url}</span>
                    <button onClick={() => delImage(img.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="Image URL" className="input" />
                <button onClick={addImageUrl} className="btn-outline"><Plus size={16} /></button>
              </div>
              <label className="btn-outline mt-2 w-full cursor-pointer">
                <Upload size={16} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'gallery')} />
              </label>
            </div>
          )}

          <button onClick={save} disabled={busy} className="btn-primary w-full">
            <Save size={16} /> {busy ? 'Saving...' : 'Save Equipment'}
          </button>
        </div>
      </div>
    </div>
  );
}
