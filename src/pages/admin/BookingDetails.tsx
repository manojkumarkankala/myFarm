import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking, BookingStatusHistory } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import {
  ArrowLeft, Phone, MessageCircle, CheckCircle2, XCircle, Ban,
  CheckCircle, CalendarClock, StickyNote, History,
} from 'lucide-react';
import { StatusBadge } from './AdminDashboard';

interface Props {
  bookingId: string;
  navigate: (to: string) => void;
}

export default function BookingDetails({ bookingId, navigate }: Props) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [history, setHistory] = useState<BookingStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [reschedule, setReschedule] = useState({ date: '', start: '', end: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: b }, { data: h }] = await Promise.all([
        supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle(),
        supabase.from('booking_status_history').select('*').eq('booking_id', bookingId).order('created_at', { ascending: false }),
      ]);
      setBooking(b as Booking | null);
      setHistory((h as BookingStatusHistory[]) || []);
      setNotes(b?.admin_notes || '');
      setLoading(false);
    })();
  }, [bookingId]);

  const refresh = async () => {
    const { data } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
    setBooking(data as Booking | null);
    const { data: h } = await supabase.from('booking_status_history').select('*').eq('booking_id', bookingId).order('created_at', { ascending: false });
    setHistory((h as BookingStatusHistory[]) || []);
  };

  const doAction = async (kind: 'approve' | 'reject' | 'cancel' | 'complete' | 'reschedule' | 'notes') => {
    if (!booking) return;
    setBusy(true);
    setMsg(null);

    try {
      if (kind === 'notes') {
        const { error } = await supabase.from('bookings').update({ admin_notes: notes, updated_at: new Date().toISOString() }).eq('id', booking.id);
        if (error) throw error;
        setMsg({ type: 'success', text: 'Notes saved.' });
      } else if (kind === 'approve') {
        const { data, error } = await supabase.rpc('approve_booking', { p_booking_id: booking.id, p_admin_id: user?.id });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setMsg({ type: 'success', text: 'Booking approved.' });
      } else if (kind === 'reschedule') {
        const { data, error } = await supabase.rpc('update_booking_status', {
          p_booking_id: booking.id, p_new_status: 'rescheduled', p_reason: 'Rescheduled by admin', p_admin_id: user?.id,
          p_new_date: reschedule.date, p_new_start: reschedule.start, p_new_end: reschedule.end,
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setMsg({ type: 'success', text: 'Booking rescheduled.' });
      } else {
        const { data, error } = await supabase.rpc('update_booking_status', {
          p_booking_id: booking.id, p_new_status: kind, p_reason: reason || null, p_admin_id: user?.id,
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setMsg({ type: 'success', text: `Booking ${kind}.` });
      }
      await refresh();
      setAction('');
      setReason('');
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    }
    setBusy(false);
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />;
  if (!booking) return <p className="text-stone-500">Booking not found.</p>;

  const waLink = `https://wa.me/${booking.customer_mobile.replace(/[^0-9]/g, '')}`;

  return (
    <div>
      <button onClick={() => navigate('/admin/bookings')} className="btn-ghost mb-4">
        <ArrowLeft size={16} /> Back to Bookings
      </button>

      {msg && (
        <div className={`mb-4 rounded-xl p-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-stone-900">{booking.reference_number}</h1>
                <p className="text-sm text-stone-500">Submitted {new Date(booking.submitted_at).toLocaleString()}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Customer Name" value={booking.customer_name} />
              <Field label="Mobile" value={booking.customer_mobile} />
              <Field label="WhatsApp" value={booking.customer_whatsapp || '—'} />
              <Field label="Equipment" value={booking.equipment_name || '—'} />
              <Field label="Booking Date" value={booking.booking_date} />
              <Field label="Time" value={`${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`} />
              <Field label="Farm Village" value={booking.farm_village} />
              <Field label="Farm Address" value={booking.farm_address || '—'} />
              <Field label="Land Area" value={`${booking.land_area} ${booking.land_area_unit}`} />
              <Field label="Crop Type" value={booking.crop_type || '—'} />
              <Field label="Work Required" value={booking.work_required || '—'} />
              <Field label="Est. Price" value={booking.total_price ? `₹${booking.total_price}` : '—'} />
            </div>

            {booking.additional_requirements && (
              <div className="mt-4 rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Additional Requirements</p>
                <p className="mt-1 text-sm text-stone-700">{booking.additional_requirements}</p>
              </div>
            )}

            {booking.rejection_reason && (
              <div className="mt-4 rounded-xl bg-red-50 p-3">
                <p className="text-xs text-red-600">Rejection Reason</p>
                <p className="mt-1 text-sm text-red-700">{booking.rejection_reason}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`tel:${booking.customer_mobile}`} className="btn-outline"><Phone size={15} /> Call</a>
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={15} /> WhatsApp</a>
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
            <h2 className="font-bold text-stone-900">Booking Actions</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => doAction('approve')} disabled={busy || booking.status === 'approved' || booking.status === 'completed'} className="btn-primary disabled:opacity-40">
                <CheckCircle2 size={16} /> Approve
              </button>
              <button onClick={() => setAction('reject')} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200">
                <XCircle size={16} /> Reject
              </button>
              <button onClick={() => setAction('reschedule')} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200">
                <CalendarClock size={16} /> Reschedule
              </button>
              <button onClick={() => doAction('complete')} disabled={busy || booking.status !== 'approved'} className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200">
                <CheckCircle size={16} /> Complete
              </button>
              <button onClick={() => doAction('cancel')} disabled={busy || booking.status === 'completed' || booking.status === 'cancelled'} className="inline-flex items-center gap-2 rounded-full bg-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-300">
                <Ban size={16} /> Cancel
              </button>
            </div>

            {action === 'reject' && (
              <div className="mt-4 rounded-xl bg-stone-50 p-4">
                <label className="label">Rejection Reason</label>
                <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Explain why the booking is rejected..." />
                <button onClick={() => doAction('reject')} disabled={busy} className="btn-primary mt-3 bg-red-600 hover:bg-red-700">Confirm Reject</button>
                <button onClick={() => setAction('')} className="btn-ghost ml-2">Cancel</button>
              </div>
            )}

            {action === 'reschedule' && (
              <div className="mt-4 rounded-xl bg-stone-50 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className="label">New Date</label><input type="date" value={reschedule.date} onChange={(e) => setReschedule({ ...reschedule, date: e.target.value })} className="input" /></div>
                  <div><label className="label">Start</label><input type="time" value={reschedule.start} onChange={(e) => setReschedule({ ...reschedule, start: e.target.value })} className="input" /></div>
                  <div><label className="label">End</label><input type="time" value={reschedule.end} onChange={(e) => setReschedule({ ...reschedule, end: e.target.value })} className="input" /></div>
                </div>
                <button onClick={() => doAction('reschedule')} disabled={busy} className="btn-primary mt-3">Confirm Reschedule</button>
                <button onClick={() => setAction('')} className="btn-ghost ml-2">Cancel</button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
            <h2 className="flex items-center gap-2 font-bold text-stone-900"><StickyNote size={18} /> Internal Notes</h2>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="input mt-3" placeholder="Add private notes about this booking..." />
            <button onClick={() => doAction('notes')} disabled={busy} className="btn-outline mt-3">Save Notes</button>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
            <h2 className="flex items-center gap-2 font-bold text-stone-900"><History size={18} /> Status History</h2>
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">No history yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="relative pl-5">
                    <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-green-600" />
                    <span className="absolute left-[5px] top-4 h-full w-px bg-stone-200" />
                    <p className="text-sm font-semibold text-stone-900">{h.new_status}</p>
                    {h.previous_status && <p className="text-xs text-stone-500">from {h.previous_status}</p>}
                    {h.reason && <p className="text-xs text-stone-600">{h.reason}</p>}
                    <p className="text-xs text-stone-400">{new Date(h.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-stone-50 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-0.5 font-medium text-stone-900">{value}</p>
    </div>
  );
}
