import { useEffect, useState } from 'react';
import { ArrowRight, Phone, MessageCircle, MapPin, Clock, User, Sprout } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSite } from '@/lib/site';
import type { Equipment, Testimonial, Faq } from '@/lib/types';
import EquipmentCard from '@/components/EquipmentCard';
import Hero from '@/components/Hero';

interface Props {
  navigate: (to: string) => void;
}

export default function HomePage({ navigate }: Props) {
  const { settings, profile } = useSite();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [eq, ts, fq] = await Promise.all([
        supabase.from('equipment').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('testimonials').select('*').eq('is_published', true).order('sort_order'),
        supabase.from('faqs').select('*').eq('is_published', true).order('sort_order'),
      ]);
      setEquipment((eq.data as Equipment[]) || []);
      setTestimonials((ts.data as Testimonial[]) || []);
      setFaqs((fq.data as Faq[]) || []);
      setLoading(false);
    })();
  }, []);

  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const whatsapp = profile?.whatsapp_number || phone;
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  const steps = [
    { n: 1, title: 'Select Equipment', desc: 'Choose from drones, harvesters, tractors and more.' },
    { n: 2, title: 'Enter Farm Details', desc: 'Provide your farm location, date and preferred time.' },
    { n: 3, title: 'Submit Request', desc: 'Get a unique booking reference number instantly.' },
    { n: 4, title: 'Owner Approval', desc: 'The owner reviews and approves your booking.' },
  ];

  const whyChoose = [
    { icon: '💰', title: 'Affordable Pricing', desc: 'Fair rental rates with no hidden charges.' },
    { icon: '🚜', title: 'Well-Maintained Fleet', desc: 'Regularly serviced equipment for reliable performance.' },
    { icon: '👨‍🌾', title: 'Trained Operators', desc: 'Experienced operators included with every booking.' },
    { icon: '⏱️', title: 'Timely Service', desc: 'On-time arrival and efficient work completion.' },
  ];

  return (
    <div>
      <Hero navigate={navigate} />

      {/* Owner Info Section */}
      {profile && (
        <section className="section py-16">
          <div className="card overflow-hidden">
            <div className="grid gap-0 md:grid-cols-3">
              <div className="bg-green-700 p-8 text-white">
                {profile.owner_photo ? (
                  <img src={profile.owner_photo} alt={profile.owner_name || 'Owner'} className="h-32 w-32 rounded-2xl object-cover ring-4 ring-white/20" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white/15 text-5xl">
                    <User size={56} />
                  </div>
                )}
                <h3 className="mt-4 text-xl font-bold">{profile.owner_name || 'Equipment Owner'}</h3>
                {profile.business_name && <p className="text-green-100">{profile.business_name}</p>}
                {profile.farming_experience && (
                  <p className="mt-3 text-sm text-green-50">{profile.farming_experience}</p>
                )}
              </div>
              <div className="p-8 md:col-span-2">
                <h2 className="text-2xl font-bold text-stone-900">Meet the Owner</h2>
                <p className="mt-3 text-stone-600">{profile.biography || 'A trusted agricultural equipment provider serving local farmers with modern machinery.'}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="mt-0.5 text-green-700" />
                    <div>
                      <p className="text-xs text-stone-500">Mobile</p>
                      <a href={`tel:${phone}`} className="font-semibold text-stone-900 hover:text-green-700">{phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle size={18} className="mt-0.5 text-green-700" />
                    <div>
                      <p className="text-xs text-stone-500">WhatsApp</p>
                      <a href={waLink} target="_blank" rel="noreferrer" className="font-semibold text-stone-900 hover:text-green-700">{whatsapp}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="mt-0.5 text-green-700" />
                    <div>
                      <p className="text-xs text-stone-500">Address</p>
                      <p className="font-medium text-stone-900">{profile.business_address || settings.business_address}</p>
                      <p className="text-sm text-stone-600">{profile.village_town}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={18} className="mt-0.5 text-green-700" />
                    <div>
                      <p className="text-xs text-stone-500">Working Hours</p>
                      <p className="font-medium text-stone-900">{profile.working_hours || 'Mon-Sat: 6 AM - 7 PM'}</p>
                    </div>
                  </div>
                </div>
                {profile.service_areas && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.service_areas.split(',').map((a) => (
                      <span key={a} className="chip">{a.trim()}</span>
                    ))}
                  </div>
                )}
                <div className="mt-6 flex gap-3">
                  <a href={`tel:${phone}`} className="btn-primary"><Phone size={16} /> Call Owner</a>
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> WhatsApp</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Equipment */}
      <section className="section py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip"><Sprout size={14} /> Our Fleet</span>
            <h2 className="mt-3 text-3xl font-bold text-stone-900">Featured Equipment</h2>
            <p className="mt-2 max-w-xl text-stone-600">Browse our range of agricultural machinery available for booking.</p>
          </div>
          <button onClick={() => navigate('/services')} className="btn-ghost border border-stone-300">
            View All <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl bg-stone-200" />
            ))}
          </div>
        ) : equipment.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-stone-100 p-8 text-center text-stone-500">No equipment available right now. Please check back soon.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.slice(0, 6).map((e) => (
              <EquipmentCard key={e.id} equipment={e} onView={(id) => navigate(`/equipment/${id}`)} onBook={(id) => navigate(`/booking?equipment=${id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-green-50/60 py-16">
        <div className="section">
          <div className="text-center">
            <span className="chip">Simple Process</span>
            <h2 className="mt-3 text-3xl font-bold text-stone-900">How It Works</h2>
            <p className="mt-2 text-stone-600">Book your equipment in four easy steps.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-700 text-lg font-bold text-white">{s.n}</div>
                <h3 className="mt-4 text-lg font-bold text-stone-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-stone-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section py-16">
        <div className="text-center">
          <span className="chip">Why Farmers Trust Us</span>
          <h2 className="mt-3 text-3xl font-bold text-stone-900">Why Choose Us</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((w) => (
            <div key={w.title} className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200 transition hover:shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">{w.icon}</div>
              <h3 className="mt-4 font-bold text-stone-900">{w.title}</h3>
              <p className="mt-1.5 text-sm text-stone-600">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-stone-900 py-16 text-white">
          <div className="section">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-green-600/20 px-3 py-1 text-xs font-medium text-green-300">Testimonials</span>
              <h2 className="mt-3 text-3xl font-bold">What Farmers Say</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <div key={t.id} className="rounded-3xl bg-stone-800 p-6 ring-1 ring-stone-700">
                  <div className="flex gap-0.5 text-yellow-400">
                    {Array.from({ length: t.rating }).map((_, i) => <span key={i}>★</span>)}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-stone-200">"{t.review}"</p>
                  <div className="mt-4 flex items-center gap-3">
                    {t.customer_photo ? (
                      <img src={t.customer_photo} alt={t.customer_name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 font-bold">{t.customer_name[0]}</div>
                    )}
                    <div>
                      <p className="font-semibold">{t.customer_name}</p>
                      {t.location && <p className="text-xs text-stone-400">{t.location}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="section py-16">
          <div className="text-center">
            <span className="chip">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold text-stone-900">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {faqs.slice(0, 6).map((f) => (
              <details key={f.id} className="group rounded-2xl bg-white p-5 ring-1 ring-stone-200">
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-stone-900">
                  {f.question}
                  <span className="text-green-700 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-stone-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section pb-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-700 to-green-600 p-10 text-center text-white sm:p-14">
          <h2 className="text-3xl font-bold">Ready to Book Agricultural Equipment?</h2>
          <p className="mx-auto mt-3 max-w-xl text-green-50">Browse our fleet and submit a booking request in minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => navigate('/booking')} className="btn-secondary">Book Now</button>
            <a href={`tel:${phone}`} className="btn-outline border-white/80 text-white hover:bg-white hover:text-green-800"><Phone size={16} /> Call Owner</a>
          </div>
        </div>
      </section>
    </div>
  );
}
