import { Phone, MessageCircle, MapPin, Mail, Facebook, Instagram, Youtube } from 'lucide-react';
import { useSite } from '@/lib/site';

interface Props {
  navigate: (to: string) => void;
}

export default function Footer({ navigate }: Props) {
  const { settings, profile } = useSite();
  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const whatsapp = profile?.whatsapp_number || phone;

  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Book Equipment', path: '/booking' },
    { label: 'Contact', path: '/contact' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms & Conditions', path: '/terms' },
  ];

  return (
    <footer className="mt-20 bg-stone-900 text-stone-300">
      <div className="section py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="logo" className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white font-bold">
                  A
                </div>
              )}
              <span className="text-lg font-bold text-white">{settings.site_name.split('–')[0].trim()}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              {settings.hero_description || settings.about_description}
            </p>
            <div className="mt-4 flex gap-2">
              {settings.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="rounded-lg bg-stone-800 p-2 transition hover:bg-green-700">
                  <Facebook size={18} />
                </a>
              )}
              {settings.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="rounded-lg bg-stone-800 p-2 transition hover:bg-green-700">
                  <Instagram size={18} />
                </a>
              )}
              {settings.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="rounded-lg bg-stone-800 p-2 transition hover:bg-green-700">
                  <Youtube size={18} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {quickLinks.map((l) => (
                <li key={l.path}>
                  <button onClick={() => navigate(l.path)} className="text-stone-400 transition hover:text-green-400">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Services</h4>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li>Drone Spraying</li>
              <li>Harvesting</li>
              <li>Tractor & Ploughing</li>
              <li>Rotavator & Cultivator</li>
              <li>Seed Drill</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin size={18} className="mt-0.5 shrink-0 text-green-400" />
                <span>{profile?.business_address || settings.business_address || 'Agricultural Hub, Maharashtra'}</span>
              </li>
              <li>
                <a href={`tel:${phone}`} className="flex items-center gap-2.5 text-stone-300 hover:text-green-400">
                  <Phone size={18} className="text-green-400" /> {phone}
                </a>
              </li>
              <li>
                <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-stone-300 hover:text-green-400">
                  <MessageCircle size={18} className="text-green-400" /> WhatsApp {whatsapp}
                </a>
              </li>
              {settings.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2.5 text-stone-300 hover:text-green-400">
                    <Mail size={18} className="text-green-400" /> {settings.contact_email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-800 pt-6 text-center text-xs text-stone-500">
          {settings.footer_content || '© 2025 AgriRent. All rights reserved.'}
        </div>
      </div>
    </footer>
  );
}
