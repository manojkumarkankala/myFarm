import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Enquiry } from '@/lib/types';
import { Trash2, Phone, Mail, MessageCircle } from 'lucide-react';

export default function ManageEnquiries() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [notes, setNotes] = useState('');

  const load = () => {
    supabase.from('enquiries').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setItems((data as Enquiry[]) || []); setLoading(false); });
  };
  useEffect(load, []);

  const updateStatus = async (status: string) => {
    if (!selected) return;
    await supabase.from('enquiries').update({ status, admin_notes: notes }).eq('id', selected.id);
    load();
    setSelected({ ...selected, status, admin_notes: notes });
  };

  const del = async (id: string) => {
    await supabase.from('enquiries').delete().eq('id', id);
    setSelected(null);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Enquiries</h1>
      <p className="mt-1 text-sm text-stone-500">{items.length} enquiry(s).</p>

      {loading ? (
        <div className="mt-5 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-stone-100" />)}</div>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-white p-10 text-center text-stone-500 ring-1 ring-stone-200">No enquiries yet.</p>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            {items.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelected(e); setNotes(e.admin_notes || ''); }}
                className={`flex w-full items-center justify-between rounded-xl bg-white p-4 text-left ring-1 transition hover:ring-green-300 ${selected?.id === e.id ? 'ring-green-400' : 'ring-stone-200'}`}
              >
                <div>
                  <p className="font-semibold text-stone-900">{e.name}</p>
                  <p className="text-xs text-stone-500">{e.subject || e.message.slice(0, 40)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    e.status === 'new' ? 'bg-yellow-100 text-yellow-700' :
                    e.status === 'read' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>{e.status}</span>
                  <span className="text-xs text-stone-400">{new Date(e.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-stone-900">Details</h2>
                <button onClick={() => del(selected.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="text-stone-500">Name:</span> <span className="font-medium">{selected.name}</span></p>
                {selected.email && <p className="flex items-center gap-1.5"><Mail size={14} className="text-stone-400" /> <a href={`mailto:${selected.email}`} className="text-green-700 hover:underline">{selected.email}</a></p>}
                {selected.phone && <p className="flex items-center gap-1.5"><Phone size={14} className="text-stone-400" /> <a href={`tel:${selected.phone}`} className="text-green-700 hover:underline">{selected.phone}</a></p>}
                {selected.phone && <a href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-green-700"><MessageCircle size={14} /> WhatsApp</a>}
                {selected.subject && <p><span className="text-stone-500">Subject:</span> {selected.subject}</p>}
                <div className="rounded-lg bg-stone-50 p-3"><p className="text-xs text-stone-500">Message</p><p className="mt-1 text-stone-700">{selected.message}</p></div>
              </div>
              <div className="mt-4">
                <label className="label">Admin Notes</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => updateStatus('read')} className="btn-outline flex-1">Mark Read</button>
                <button onClick={() => updateStatus('resolved')} className="btn-primary flex-1">Resolve</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
