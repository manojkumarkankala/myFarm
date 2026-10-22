import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking } from '@/lib/types';
import { Search, Download, Filter } from 'lucide-react';
import { StatusBadge } from './AdminDashboard';

interface Props {
  navigate: (to: string) => void;
}

const PAGE_SIZE = 12;

export default function ManageBookings({ navigate }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    supabase.from('bookings').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookings((data as Booking[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.reference_number.toLowerCase().includes(q) ||
        b.customer_name.toLowerCase().includes(q) ||
        b.customer_mobile.includes(q) ||
        (b.equipment_name || '').toLowerCase().includes(q) ||
        b.farm_village.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [bookings, search, statusFilter]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCsv = () => {
    const headers = ['Reference', 'Customer', 'Mobile', 'Equipment', 'Date', 'Start', 'End', 'Village', 'Land', 'Status', 'Submitted'];
    const rows = filtered.map((b) => [
      b.reference_number, b.customer_name, b.customer_mobile, b.equipment_name,
      b.booking_date, b.start_time, b.end_time, b.farm_village,
      `${b.land_area} ${b.land_area_unit}`, b.status, b.submitted_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Manage Bookings</h1>
          <p className="mt-1 text-sm text-stone-500">{filtered.length} booking(s) found.</p>
        </div>
        <button onClick={exportCsv} className="btn-outline">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search by reference, name, mobile, village..." className="input pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-stone-400" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="input w-auto">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-stone-100" />)}
        </div>
      ) : pageItems.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-white p-10 text-center text-stone-500 ring-1 ring-stone-200">No bookings match your filters.</p>
      ) : (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Equipment</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pageItems.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/admin/bookings/${b.id}`)}
                      className="cursor-pointer transition hover:bg-green-50/40"
                    >
                      <td className="px-4 py-3 font-semibold text-stone-900">{b.reference_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-900">{b.customer_name}</p>
                        <p className="text-xs text-stone-500">{b.customer_mobile}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-700">{b.equipment_name}</td>
                      <td className="px-4 py-3 text-stone-700">{b.booking_date}</td>
                      <td className="px-4 py-3 text-stone-700">{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</td>
                      <td className="px-4 py-3 text-stone-700">{b.farm_village}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="btn-ghost border border-stone-300 disabled:opacity-40">Prev</button>
              <span className="text-sm text-stone-600">Page {page + 1} of {pageCount}</span>
              <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} className="btn-ghost border border-stone-300 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
