import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/types';
import { Plus, Trash2, Upload, Pencil, X, Eye, EyeOff } from 'lucide-react';

const emptyForm: Partial<GalleryItem> = {
  title: '', media_type: 'image', media_url: '', category: '', equipment_type: '',
  location: '', description: '', is_published: true, sort_order: 0,
};

export default function ManageGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<GalleryItem> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = () => {
    supabase.from('gallery').select('*').order('sort_order')
      .then(({ data }) => { setItems((data as GalleryItem[]) || []); setLoading(false); });
  };
  useEffect(load, []);

  const save = async () => {
    if (!editing) return;
    setBusy(true); setMsg(null);
    try {
      const payload = {
        title: editing.title, media_type: editing.media_type, media_url: editing.media_url,
        thumbnail_url: editing.thumbnail_url || null, category: editing.category || null,
        equipment_type: editing.equipment_type || null, location: editing.location || null,
        description: editing.description || null, is_published: editing.is_published,
        sort_order: Number(editing.sort_order) || 0,
      };
      if (editing.id) {
        const { error } = await supabase.from('gallery').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gallery').insert(payload);
        if (error) throw error;
      }
      setEditing(null);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setBusy(false);
  };

  const del = async (id: string) => {
    await supabase.from('gallery').delete().eq('id', id);
    setConfirmDel(null);
    load();
  };

  const togglePublish = async (item: GalleryItem) => {
    await supabase.from('gallery').update({ is_published: !item.is_published }).eq('id', item.id);
    load();
  };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      setEditing({ ...editing, media_url: data.publicUrl, media_type: file.type.startsWith('video') ? 'video' : 'image' });
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Manage Gallery</h1>
          <p className="mt-1 text-sm text-stone-500">{items.length} item(s).</p>
        </div>
        <button onClick={() => { setEditing({ ...emptyForm }); setMsg(null); }} className="btn-primary">
          <Plus size={16} /> Add Media
        </button>
      </div>

      {msg && <div className={`mt-4 rounded-xl p-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-stone-100" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-white p-10 text-center text-stone-500 ring-1 ring-stone-200">No gallery items yet.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-3 ring-1 ring-stone-200">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
                <img src={item.media_type === 'video' ? (item.thumbnail_url || item.media_url) : item.media_url} alt={item.title} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-stone-900/70 px-2 py-0.5 text-xs text-white capitalize">{item.media_type}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-stone-900 line-clamp-1">{item.title}</p>
              <p className="text-xs text-stone-500">{item.category || 'Uncategorized'}</p>
              <div className="mt-2 flex gap-1">
                <button onClick={() => togglePublish(item)} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100" title={item.is_published ? 'Published' : 'Hidden'}>
                  {item.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => { setEditing({ ...item }); setMsg(null); }} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"><Pencil size={15} /></button>
                <button onClick={() => setConfirmDel(item.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-stone-900">{editing.id ? 'Edit Media' : 'Add Media'}</h2>
              <button onClick={() => setEditing(null)}><X size={20} /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div><label className="label">Title *</label><input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input" /></div>
              <div><label className="label">Media Type</label>
                <select value={editing.media_type} onChange={(e) => setEditing({ ...editing, media_type: e.target.value as 'image' | 'video' })} className="input">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label className="label">Media URL *</label>
                <input value={editing.media_url || ''} onChange={(e) => setEditing({ ...editing, media_url: e.target.value })} className="input" placeholder="Paste URL or upload below" />
                <label className="btn-outline mt-2 w-full cursor-pointer">
                  <Upload size={16} /> {busy ? 'Uploading...' : 'Upload File'}
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
              </div>
              {editing.media_url && (
                <div className="rounded-xl bg-stone-50 p-2">
                  {editing.media_type === 'video' ? (
                    <video src={editing.media_url} className="h-32 w-full rounded object-cover" controls />
                  ) : (
                    <img src={editing.media_url} alt="" className="h-32 w-full rounded object-cover" />
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Category</label><input value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="input" /></div>
                <div><label className="label">Equipment Type</label><input value={editing.equipment_type || ''} onChange={(e) => setEditing({ ...editing, equipment_type: e.target.value })} className="input" /></div>
                <div><label className="label">Location</label><input value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="input" /></div>
                <div><label className="label">Sort Order</label><input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="input" /></div>
              </div>
              <div><label className="label">Description</label><textarea rows={2} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="input" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.is_published} onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })} /> Published</label>
              <button onClick={save} disabled={busy} className="btn-primary w-full">{busy ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4" onClick={() => setConfirmDel(null)}>
          <div className="max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-stone-900">Delete this media?</h3>
            <div className="mt-5 flex gap-2">
              <button onClick={() => del(confirmDel)} className="btn-primary bg-red-600 hover:bg-red-700">Delete</button>
              <button onClick={() => setConfirmDel(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
