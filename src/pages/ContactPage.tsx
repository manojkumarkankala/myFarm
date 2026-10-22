import { useSite } from '@/lib/site';
import { Phone, MessageCircle, MapPin, Mail, Clock, User } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const { settings, profile } = useSite();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const whatsapp = profile?.whatsapp_number || phone;
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const { error: err } = await supabase.from('enquiries').insert({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      subject: form.subject || null,
      message: form.message,
    });
    if (err) {
      setStatus('error');
      setError(err.message);
    } else {
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    }
  };

  return (
    <div>
      <div className="bg-green-700 py-14 text-white">
        <div className="section">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="mt-3 max-w-xl text-green-50">Have questions or want to discuss a booking? Reach out to us directly.</p>
        </div>
      </div>

      <div className="section py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                {profile?.owner_photo ? (
                  <img src={profile.owner_photo} alt={profile.owner_name || 'Owner'} className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <User size={28} />
                  </div>
                )}
                <div>
                  <p className="font-bold text-stone-900">{profile?.owner_name || 'Equipment Owner'}</p>
                  <p className="text-sm text-stone-500">{profile?.business_name}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <a href={`tel:${phone}`} className="flex items-center gap-3 rounded-xl bg-green-50 p-3 transition hover:bg-green-100">
                  <Phone size={18} className="text-green-700" />
                  <div>
                    <p className="text-xs text-stone-500">Mobile</p>
                    <p className="font-semibold text-stone-900">{phone}</p>
                  </div>
                </a>
                <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-green-50 p-3 transition hover:bg-green-100">
                  <MessageCircle size={18} className="text-green-700" />
                  <div>
                    <p className="text-xs text-stone-500">WhatsApp</p>
                    <p className="font-semibold text-stone-900">{whatsapp}</p>
                  </div>
                </a>
                {settings.contact_email && (
                  <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-3 rounded-xl bg-green-50 p-3 transition hover:bg-green-100">
                    <Mail size={18} className="text-green-700" />
                    <div>
                      <p className="text-xs text-stone-500">Email</p>
                      <p className="font-semibold text-stone-900">{settings.contact_email}</p>
                    </div>
                  </a>
                )}
                <div className="flex items-start gap-3 rounded-xl bg-green-50 p-3">
                  <MapPin size={18} className="mt-0.5 text-green-700" />
                  <div>
                    <p className="text-xs text-stone-500">Address</p>
                    <p className="font-semibold text-stone-900">{profile?.business_address || settings.business_address}</p>
                    {profile?.village_town && <p className="text-sm text-stone-600">{profile.village_town}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-green-50 p-3">
                  <Clock size={18} className="mt-0.5 text-green-700" />
                  <div>
                    <p className="text-xs text-stone-500">Working Hours</p>
                    <p className="font-semibold text-stone-900">{profile?.working_hours || 'Mon-Sat: 6 AM - 7 PM'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-stone-200">
                <iframe
                  title="map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(profile?.business_address || settings.business_address || 'Maharashtra India')}&output=embed`}
                  className="h-48 w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-stone-900">Send a Message</h2>
              <p className="mt-2 text-sm text-stone-600">Fill out the form below and we'll get back to you as soon as possible.</p>

              {status === 'success' ? (
                <div className="mt-6 rounded-2xl bg-green-50 p-6 text-center">
                  <p className="text-lg font-bold text-green-800">Thank you! Your message has been sent.</p>
                  <p className="mt-1 text-sm text-green-700">We'll contact you soon.</p>
                  <button onClick={() => setStatus('idle')} className="btn-primary mt-4">Send another message</button>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Your Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Subject</label>
                    <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Message *</label>
                    <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input" />
                  </div>
                  {status === 'error' && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
                  <div className="sm:col-span-2">
                    <button type="submit" disabled={status === 'submitting'} className="btn-primary">
                      {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
