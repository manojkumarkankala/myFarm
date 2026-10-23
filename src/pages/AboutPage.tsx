import { useSite } from '@/lib/site';
import { Phone, MessageCircle, Sprout, Users, Award, MapPin } from 'lucide-react';

interface Props {
  navigate: (to: string) => void;
}

export default function AboutPage({ navigate }: Props) {
  const { settings, profile } = useSite();
  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const whatsapp = profile?.whatsapp_number || phone;
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  const stats = [
    { icon: <Users size={22} />, label: 'Happy Farmers', value: '200+' },
    { icon: <Sprout size={22} />, label: 'Equipment Types', value: '10+' },
    { icon: <Award size={22} />, label: 'Years Experience', value: '8+' },
    { icon: <MapPin size={22} />, label: 'Service Areas', value: '5+' },
  ];

  return (
    <div>
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src="https://images.pexels.com/photos/38885471/pexels-photo-38885471.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" alt="farm" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 to-green-900/50" />
        </div>
        <div className="section relative py-24 text-white">
          <h1 className="text-4xl font-bold sm:text-5xl">{settings.about_title || 'About AgriRent'}</h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-200">{settings.about_description}</p>
        </div>
      </div>

      <div className="section py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">{s.icon}</div>
              <p className="mt-3 text-3xl font-bold text-stone-900">{s.value}</p>
              <p className="text-sm text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="section py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">Our Story</h2>
            <p className="mt-4 text-stone-600">{profile?.biography || settings.about_description}</p>
            {profile?.farming_experience && <p className="mt-3 text-stone-600">{profile.farming_experience}</p>}
            <p className="mt-3 text-stone-600">We are committed to helping farmers access modern agricultural equipment without the high cost of ownership. Our fleet is regularly serviced and operated by trained professionals.</p>
            <div className="mt-6 flex gap-3">
              <a href={`tel:${phone}`} className="btn-primary"><Phone size={16} /> Call Owner</a>
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> WhatsApp</a>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl">
            <img src="https://res.cloudinary.com/dptxuxhbm/image/upload/v1792747230/Telugu_Agricultural_Drone_and_Harvester_Services_Banner_xowvle.png" alt="farmers" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="bg-green-50/60 py-16">
        <div className="section">
          <h2 className="text-center text-3xl font-bold text-stone-900">Why Choose Us</h2>
          <p className="mt-3 text-center text-stone-600">{settings.why_choose_us}</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {['Affordable rental rates with no hidden charges', 'Well-maintained, modern equipment', 'Trained operators included with every booking', 'Timely arrival and efficient work', 'Easy booking process with quick approval', 'Serving multiple regions across Maharashtra'].map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
                <Sprout size={20} className="mt-0.5 shrink-0 text-green-700" />
                <p className="text-sm text-stone-700">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section py-16">
        <div className="overflow-hidden rounded-3xl bg-green-700 p-10 text-center text-white">
          <h2 className="text-3xl font-bold">Need Equipment for Your Farm?</h2>
          <p className="mx-auto mt-3 max-w-xl text-green-50">Browse our fleet and book online in minutes.</p>
          <button onClick={() => navigate('/booking')} className="btn-secondary mt-5">Book Now</button>
        </div>
      </div>
    </div>
  );
}
