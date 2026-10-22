import { ArrowRight, Phone, Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { useSite } from '@/lib/site';

interface Props {
  navigate: (to: string) => void;
}

export default function Hero({ navigate }: Props) {
  const { settings, profile } = useSite();
  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const bg = settings.hero_image_url || 'https://images.pexels.com/photos/13888402/pexels-photo-13888402.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={bg} alt="Agricultural field" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/85 via-stone-900/70 to-green-900/40" />
      </div>

      <div className="section relative py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-300/90 px-4 py-1.5 text-xs font-semibold text-green-900">
            <Sparkles size={14} /> Trusted by 200+ farmers
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {settings.hero_title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-200">
            {settings.hero_description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => navigate('/booking')} className="btn-primary">
              <Calendar size={18} /> Book Now
            </button>
            <button onClick={() => navigate('/services')} className="btn-secondary">
              Explore Services <ArrowRight size={16} />
            </button>
            <a href={`tel:${phone}`} className="btn-outline border-white/80 text-white hover:bg-white hover:text-green-800">
              <Phone size={18} /> Call Owner
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-stone-200">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-yellow-300" /> Affordable pricing</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-yellow-300" /> Trained operators</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-yellow-300" /> Timely service</span>
          </div>
        </div>
      </div>
    </section>
  );
}
