import { ReactNode } from 'react';
import {
  LayoutDashboard, Calendar, Tractor, Image, User, Settings,
  KeyRound, MessageSquare, LogOut, Clock, ExternalLink, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';

interface Props {
  navigate: (to: string) => void;
  currentPath: string;
  children: ReactNode;
}

export default function AdminLayout({ navigate, currentPath, children }: Props) {
  const { signOut, profile } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
    { label: 'Equipment', path: '/admin/equipment', icon: Tractor },
    { label: 'Gallery', path: '/admin/gallery', icon: Image },
    { label: 'Availability', path: '/admin/availability', icon: Clock },
    { label: 'Enquiries', path: '/admin/enquiries', icon: MessageSquare },
    { label: 'Owner Profile', path: '/admin/profile', icon: User },
    { label: 'Website Content', path: '/admin/content', icon: Settings },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
    { label: 'Change Password', path: '/admin/password', icon: KeyRound },
  ];

  const isActive = (path: string) => path === '/admin' ? currentPath === '/admin' : currentPath.startsWith(path);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 hover:bg-stone-100 lg:hidden">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700 font-bold text-white">A</div>
            <span className="font-bold text-stone-900">AgriRent Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 sm:flex">
              <ExternalLink size={15} /> View Site
            </button>
            <span className="hidden text-sm text-stone-500 sm:block">{profile?.owner_name || profile?.email}</span>
            <button onClick={async () => { await signOut(); navigate('/admin/login'); }} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 top-14 z-30 w-60 transform border-r border-stone-200 bg-white transition-transform lg:static lg:top-0 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="flex flex-col gap-1 p-3">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <button
                  key={l.path}
                  onClick={() => go(l.path)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive(l.path) ? 'bg-green-50 text-green-700' : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon size={18} />
                  {l.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {open && <div className="fixed inset-0 top-14 z-20 bg-stone-900/40 lg:hidden" onClick={() => setOpen(false)} />}

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
