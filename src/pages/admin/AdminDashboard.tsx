import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';
import { Calendar, Clock, CheckCircle2, XCircle, Hourglass, X, TrendingUp } from 'lucide-react';

interface Props {
  navigate: (to: string) => void;
}

export default function AdminDashboard({ navigate }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => {
        setBookings((data as Booking[]) || []);
        setLoading(false);
      });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const counts = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'approved').length,
    rejected: bookings.filter((b) => b.status === 'rejected').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    today: bookings.filter((b) => b.booking_date === today && b.status === 'approved').length,
  };

  const cards = [
    { label: 'Total Bookings', value: counts.total, icon: TrendingUp, color: 'bg-stone-100 text-stone-700' },
    { label: 'Pending', value: counts.pending, icon: Hourglass, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
    { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'bg-red-100 text-red-700' },
    { label: 'Completed', value: counts.completed, icon: CheckCircle2, color: 'bg-blue-100 text-blue-700' },
    { label: 'Cancelled', value: counts.cancelled, icon: X, color: 'bg-stone-100 text-stone-500' },
    { label: "Today's Work", value: counts.today, icon: Calendar, color: 'bg-green-700 text-white' },
  ];

  const recent = bookings.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
      <p className="mt-1 text-sm text-stone-500">Overview of bookings and activity.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                <Icon size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold text-stone-900">{c.value}</p>
              <p className="text-sm text-stone-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900">Recent Bookings</h2>
          <button onClick={() => navigate('/admin/bookings')} className="text-sm font-medium text-green-700 hover:text-green-800">
            View all →
          </button>
        </div>

        {loading ? (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />)}
          </div>
        ) : recent.length === 0 ? (
          <p className="mt-6 text-center text-sm text-stone-500">No bookings yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {recent.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/admin/bookings/${b.id}`)}
                className="flex w-full items-center justify-between rounded-xl border border-stone-200 p-3 text-left transition hover:border-green-300 hover:bg-green-50/40"
              >
                <div>
                  <p className="font-semibold text-stone-900">{b.reference_number}</p>
                  <p className="text-xs text-stone-500">{b.customer_name} • {b.equipment_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-500">{b.booking_date}</span>
                  <StatusBadge status={b.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button onClick={() => navigate('/admin/equipment')} className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-200 transition hover:ring-green-300">
          <TractorIcon />
          <p className="mt-3 font-bold text-stone-900">Manage Equipment</p>
          <p className="text-sm text-stone-500">Add or edit equipment listings.</p>
        </button>
        <button onClick={() => navigate('/admin/content')} className="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-200 transition hover:ring-green-300">
          <Clock size={24} className="text-green-700" />
          <p className="mt-3 font-bold text-stone-900">Website Content</p>
          <p className="text-sm text-stone-500">Edit homepage, testimonials, FAQs.</p>
        </button>
      </div>
    </div>
  );
}

function TractorIcon() {
  return <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700"><TrendingUp size={20} /></div>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-stone-200 text-stone-600',
    completed: 'bg-blue-100 text-blue-800',
    rescheduled: 'bg-purple-100 text-purple-800',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status] || 'bg-stone-100 text-stone-600'}`}>{status}</span>;
}
