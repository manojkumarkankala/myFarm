import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Equipment, Availability } from '@/lib/types';
import { Plus, Trash2, CalendarX, Clock } from 'lucide-react';

export default function ManageAvailability() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEq, setSelectedEq] = useState<string>('');
  const [rules, setRules] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    rule_type: 'block', blocked_date: '', blocked_start_time: '09:00', blocked_end_time: '17:00',
    reason: '', is_recurring: false, day_of_week: 0,
  });

  useEffect(() => {
    supabase.from('equipment').select('*').order('sort_order')
      .then(({ data }) => {
        setEquipment((data as Equipment[]) || []);
        if (data && data.length > 0) setSelectedEq((data[0] as Equipment).id);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedEq) return;
    supabase.from('availability').select('*').eq('equipment_id', selectedEq).order('created_at', { ascending: false })
      .then(({ data }) => setRules((data as Availability[]) || []));
  }, [selectedEq]);

  const addRule = async () => {
    if (!selectedEq) return;
    const payload: any = {
      equipment_id: selectedEq, rule_type: form.rule_type, reason: form.reason || null,
      is_recurring: form.is_recurring,
    };
    if (form.rule_type === 'block') {
      payload.blocked_date = form.is_recurring ? null : form.blocked_date || null;
      payload.day_of_week = form.is_recurring ? form.day_of_week : null;
      payload.blocked_start_time = form.blocked_start_time || null;
      payload.blocked_end_time = form.blocked_end_time || null;
    }
    const { error } = await supabase.from('availability').insert(payload);
    if (error) { alert(error.message); return; }
    setForm({ ...form, blocked_date: '', reason: '' });
    const { data } = await supabase.from('availability').select('*').eq('equipment_id', selectedEq).order('created_at', { ascending: false });
    setRules((data as Availability[]) || []);
  };

  const delRule = async (id: string) => {
    await supabase.from('availability').delete().eq('id', id);
    setRules(rules.filter((r) => r.id !== id));
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Manage Availability</h1>
      <p className="mt-1 text-sm text-stone-500">Block dates, time slots, and maintenance periods for equipment.</p>

      <div className="mt-5">
        <label className="label">Select Equipment</label>
        <select value={selectedEq} onChange={(e) => setSelectedEq(e.target.value)} className="input max-w-md">
          {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="flex items-center gap-2 font-bold text-stone-900"><CalendarX size={18} /> Add Block</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Block Type</label>
              <select value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })} className="input">
                <option value="block">Block Date/Slot</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
              Recurring (weekly)
            </label>
            {form.is_recurring ? (
              <div><label className="label">Day of Week</label>
                <select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })} className="input">
                  {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            ) : (
              <div><label className="label">Date</label><input type="date" value={form.blocked_date} onChange={(e) => setForm({ ...form, blocked_date: e.target.value })} className="input" /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Start Time</label><input type="time" value={form.blocked_start_time} onChange={(e) => setForm({ ...form, blocked_start_time: e.target.value })} className="input" /></div>
              <div><label className="label">End Time</label><input type="time" value={form.blocked_end_time} onChange={(e) => setForm({ ...form, blocked_end_time: e.target.value })} className="input" /></div>
            </div>
            <div><label className="label">Reason</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input" placeholder="Maintenance, holiday, etc." /></div>
            <button onClick={addRule} className="btn-primary w-full"><Plus size={16} /> Add Block</button>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="flex items-center gap-2 font-bold text-stone-900"><Clock size={18} /> Current Rules</h2>
          {rules.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">No availability rules. Default working hours are Mon-Sat 6 AM - 7 PM.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-stone-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900 capitalize">{r.rule_type}</p>
                    <p className="text-xs text-stone-500">
                      {r.is_recurring ? `Every ${days[r.day_of_week || 0]}` : r.blocked_date}
                      {r.blocked_start_time && ` • ${r.blocked_start_time.slice(0, 5)} - ${r.blocked_end_time?.slice(0, 5)}`}
                    </p>
                    {r.reason && <p className="text-xs text-stone-600">{r.reason}</p>}
                  </div>
                  <button onClick={() => delRule(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
