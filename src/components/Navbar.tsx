import { useState } from 'react';
import { Menu, X, Phone, LayoutDashboard } from 'lucide-react';
import { useSite } from '@/lib/site';
import { useAuth } from '@/lib/auth';

interface Props {
  navigate: (to: string) => void;
  currentPath: string;
}

export default function Navbar({ navigate, currentPath }: Props) {
  const { settings, profile } = useSite();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Booking', path: '/booking' },
    { label: 'Contact', path: '/contact' },
  ];

  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) =>
    path === '/' ? currentPath === '/' : currentPath.startsWith(path);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
      <div className="section flex h-16 items-center justify-between gap-4">
        <button onClick={() => go('/')} className="flex items-center gap-2.5">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="logo" className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white font-bold">
              A
            </div>
          )}
          <span className="text-base font-bold text-stone-900 sm:text-lg">
            {settings.site_name.split('–')[0].trim()}
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.path}
              onClick={() => go(l.path)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                isActive(l.path)
                  ? 'bg-green-50 text-green-700'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${phone}`}
            className="hidden items-center gap-2 rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-green-700/20 transition hover:bg-green-800 sm:inline-flex"
          >
            <Phone size={16} />
            {phone}
          </a>
          <button
            onClick={() => go(isAdmin ? '/admin' : '/admin/login')}
            className="hidden items-center gap-1.5 rounded-full border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 md:inline-flex"
            title="Admin"
          >
            <LayoutDashboard size={16} />
            Admin
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-stone-200 bg-white md:hidden">
          <div className="section flex flex-col py-3">
            {links.map((l) => (
              <button
                key={l.path}
                onClick={() => go(l.path)}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                  isActive(l.path) ? 'bg-green-50 text-green-700' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {l.label}
              </button>
            ))}
            <a
              href={`tel:${phone}`}
              className="mt-2 flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2.5 text-sm font-semibold text-white"
            >
              <Phone size={16} /> Call {phone}
            </a>
            <button
              onClick={() => go(isAdmin ? '/admin' : '/admin/login')}
              className="mt-2 flex items-center gap-2 rounded-lg border border-stone-300 px-3 py-2.5 text-sm font-medium text-stone-700"
            >
              <LayoutDashboard size={16} /> Admin Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
