import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { playNotificationSound, primeNotificationSound } from '@/lib/notificationSound';
import type { Notification } from '@/lib/types';

interface Props {
  navigate: (to: string) => void;
}

const POLL_INTERVAL_MS = 30000;

export default function NotificationBell({ navigate }: Props) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const knownIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return;
    const fresh = (data as Notification[]) || [];
    const seen = knownIds.current;
    if (seen && fresh.some((n) => !n.is_read && !seen.has(n.id))) playNotificationSound();
    knownIds.current = new Set(fresh.map((n) => n.id));
    setItems(fresh);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    document.addEventListener('pointerdown', primeNotificationSound, { once: true });
    return () => {
      clearInterval(timer);
      document.removeEventListener('pointerdown', primeNotificationSound);
    };
  }, [load]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) load();
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    if (error) load();
  };

  const openNotification = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
    if (n.booking_id) navigate(`/admin/bookings/${n.booking_id}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        className="relative rounded-lg p-2 text-stone-600 transition hover:bg-stone-100"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
              <p className="font-semibold text-stone-900">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800">
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-stone-500">No notifications yet.</p>
            ) : (
              <ul className="max-h-96 divide-y divide-stone-100 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openNotification(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-stone-50 ${n.is_read ? '' : 'bg-green-50/60'}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-green-600'}`} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm text-stone-900 ${n.is_read ? 'font-medium' : 'font-semibold'}`}>{n.title}</span>
                        <span className="mt-0.5 block text-xs text-stone-600">{n.message}</span>
                        <span className="mt-1 block text-[11px] text-stone-400">{new Date(n.created_at).toLocaleString()}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
