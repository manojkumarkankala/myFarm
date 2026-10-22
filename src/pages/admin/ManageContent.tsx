import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WebsiteSettings, Testimonial, Faq } from '@/lib/types';
import { useSite } from '@/lib/site';
import { Save, Plus, Trash2, Pencil, X } from 'lucide-react';

export default function ManageContent() {
  const { settings, refresh } = useSite();
  const [form, setForm] = useState<Partial<WebsiteSettings>>({});
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [editT, setEditT] = useState<Partial<Testimonial> | null>(null);
  const [editF, setEditF] = useState<Partial<Faq> | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
    supabase.from('testimonials').select('*').order('sort_order').then(({ data }) => setTestimonials((data as Testimonial[]) || []));
    supabase.from('faqs').select('*').order('sort_order').then(({ data }) => setFaqs((data as Faq[]) || []));
  }, [settings]);

  const saveContent = async () => {
    setBusy(true); setMsg(null);
    try {
      const { error } = await supabase.from('website_settings').update({
        about_title: form.about_title, about_description: form.about_description, why_choose_us: form.why_choose_us,
        updated_at: new Date().toISOString(),
      }).eq('id', form.id);
      if (error) throw error;
      await refresh();
      setMsg({ type: 'success', text: 'Content saved.' });
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setBusy(false);
  };

  const saveTestimonial = async () => {
    if (!editT) return;
    const payload = {
      customer_name: editT.customer_name, rating: Number(editT.rating) || 5, review: editT.review,
      location: editT.location || null, is_published: editT.is_published !== false,
      sort_order: Number(editT.sort_order) || 0,
    };
    if (editT.id) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editT.id);
      if (error) return setMsg({ type: 'error', text: error.message });
    } else {
      const { error } = await supabase.from('testimonials').insert(payload);
      if (error) return setMsg({ type: 'error', text: error.message });
    }
    setEditT(null);
    supabase.from('testimonials').select('*').order('sort_order').then(({ data }) => setTestimonials((data as Testimonial[]) || []));
  };

  const saveFaq = async () => {
    if (!editF) return;
    const payload = {
      question: editF.question, answer: editF.answer, category: editF.category || null,
      is_published: editF.is_published !== false, sort_order: Number(editF.sort_order) || 0,
    };
    if (editF.id) {
      const { error } = await supabase.from('faqs').update(payload).eq('id', editF.id);
      if (error) return setMsg({ type: 'error', text: error.message });
    } else {
      const { error } = await supabase.from('faqs').insert(payload);
      if (error) return setMsg({ type: 'error', text: error.message });
    }
    setEditF(null);
    supabase.from('faqs').select('*').order('sort_order').then(({ data }) => setFaqs((data as Faq[]) || []));
  };

  const delT = async (id: string) => {
    await supabase.from('testimonials').delete().eq('id', id);
    setTestimonials(testimonials.filter((t) => t.id !== id));
  };
  const delF = async (id: string) => {
    await supabase.from('faqs').delete().eq('id', id);
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Website Content</h1>
      <p className="mt-1 text-sm text-stone-500">About section, testimonials and FAQs.</p>

      {msg && <div className={`mt-4 rounded-xl p-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}

      <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <h2 className="font-bold text-stone-900">About Section</h2>
        <div className="mt-4 space-y-3">
          <div><label className="label">About Title</label><input value={form.about_title || ''} onChange={(e) => setForm({ ...form, about_title: e.target.value })} className="input" /></div>
          <div><label className="label">About Description</label><textarea rows={3} value={form.about_description || ''} onChange={(e) => setForm({ ...form, about_description: e.target.value })} className="input" /></div>
          <div><label className="label">Why Choose Us</label><textarea rows={2} value={form.why_choose_us || ''} onChange={(e) => setForm({ ...form, why_choose_us: e.target.value })} className="input" /></div>
          <button onClick={saveContent} disabled={busy} className="btn-primary"><Save size={16} /> Save Content</button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900">Testimonials</h2>
          <button onClick={() => setEditT({ rating: 5, is_published: true })} className="btn-outline"><Plus size={16} /> Add</button>
        </div>
        <div className="mt-4 space-y-2">
          {testimonials.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
              <div>
                <p className="font-semibold text-stone-900">{t.customer_name} <span className="text-yellow-500">{'★'.repeat(t.rating)}</span></p>
                <p className="text-xs text-stone-600 line-clamp-1">{t.review}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditT({ ...t })} className="p-1.5 text-stone-500 hover:bg-stone-200 rounded"><Pencil size={15} /></button>
                <button onClick={() => delT(t.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900">FAQs</h2>
          <button onClick={() => setEditF({ is_published: true })} className="btn-outline"><Plus size={16} /> Add</button>
        </div>
        <div className="mt-4 space-y-2">
          {faqs.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
              <div>
                <p className="font-semibold text-stone-900">{f.question}</p>
                <p className="text-xs text-stone-600 line-clamp-1">{f.answer}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditF({ ...f })} className="p-1.5 text-stone-500 hover:bg-stone-200 rounded"><Pencil size={15} /></button>
                <button onClick={() => delF(f.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editT && (
        <Modal title={editT.id ? 'Edit Testimonial' : 'Add Testimonial'} onClose={() => setEditT(null)} onSave={saveTestimonial}>
          <div className="space-y-3">
            <div><label className="label">Customer Name</label><input value={editT.customer_name || ''} onChange={(e) => setEditT({ ...editT, customer_name: e.target.value })} className="input" /></div>
            <div><label className="label">Location</label><input value={editT.location || ''} onChange={(e) => setEditT({ ...editT, location: e.target.value })} className="input" /></div>
            <div><label className="label">Rating</label><select value={editT.rating} onChange={(e) => setEditT({ ...editT, rating: Number(e.target.value) })} className="input"><option value={5}>5</option><option value={4}>4</option><option value={3}>3</option><option value={2}>2</option><option value={1}>1</option></select></div>
            <div><label className="label">Review</label><textarea rows={3} value={editT.review || ''} onChange={(e) => setEditT({ ...editT, review: e.target.value })} className="input" /></div>
          </div>
        </Modal>
      )}

      {editF && (
        <Modal title={editF.id ? 'Edit FAQ' : 'Add FAQ'} onClose={() => setEditF(null)} onSave={saveFaq}>
          <div className="space-y-3">
            <div><label className="label">Question</label><input value={editF.question || ''} onChange={(e) => setEditF({ ...editF, question: e.target.value })} className="input" /></div>
            <div><label className="label">Answer</label><textarea rows={3} value={editF.answer || ''} onChange={(e) => setEditF({ ...editF, answer: e.target.value })} className="input" /></div>
            <div><label className="label">Category</label><input value={editF.category || ''} onChange={(e) => setEditF({ ...editF, category: e.target.value })} className="input" /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900">{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mt-4">{children}</div>
        <button onClick={onSave} className="btn-primary mt-4 w-full">Save</button>
      </div>
    </div>
  );
}
