import { Phone, MessageCircle } from 'lucide-react';
import { useSite } from '@/lib/site';

export default function FloatingButtons() {
  const { settings, profile } = useSite();
  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const whatsapp = profile?.whatsapp_number || phone;
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="flex h-13 w-13 items-center justify-center rounded-full bg-green-500 p-3.5 text-white shadow-lg shadow-green-500/30 transition hover:scale-110 hover:bg-green-600"
        aria-label="WhatsApp"
      >
        <MessageCircle size={24} />
      </a>
      <a
        href={`tel:${phone}`}
        className="flex h-13 w-13 items-center justify-center rounded-full bg-green-700 p-3.5 text-white shadow-lg shadow-green-700/30 transition hover:scale-110 hover:bg-green-800"
        aria-label="Call owner"
      >
        <Phone size={24} />
      </a>
    </div>
  );
}
