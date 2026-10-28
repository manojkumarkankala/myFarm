import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Equipment, Booking, Availability } from '@/lib/types';
import { Calendar, CheckCircle2, Phone, MessageCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useSite } from '@/lib/site';

interface Props {
  navigate: (to: string) => void;
  query: Record<string, string>;
}

const TIME_SLOTS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

export default function BookingPage({ navigate, query }: Props) {
  const { profile, settings } = useSite();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEqId, setSelectedEqId] = useState<string>(query.equipment || '');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [form, setForm] = useState({
    customer_name: '', customer_mobile: '', customer_whatsapp: '',
    booking_date: '', start_time: '', end_time: '',
    farm_village: '', farm_address: '', land_area: '', land_area_unit: 'acres',
    crop_type: '', work_required: '', additional_requirements: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Booking | null>(null);

  useEffect(() => {
    supabase.from('equipment').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => {
        setEquipment((data as Equipment[]) || []);
        if (!selectedEqId && data && data.length > 0) setSelectedEqId((data[0] as Equipment).id);
      });
  }, []);

  useEffect(() => {
    if (!selectedEqId) return;
    Promise.all([
      supabase.from('bookings').select('*').in('status', ['pending', 'approved']),
      supabase.from('availability').select('*').eq('equipment_id', selectedEqId),
    ]).then(([b, a]) => {
      setBookings((b.data as Booking[]) || []);
      setAvailability((a.data as Availability[]) || []);
    });
  }, [selectedEqId]);

  const selectedEquipment = equipment.find((e) => e.id === selectedEqId);
  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const whatsapp = profile?.whatsapp_number || phone;
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  // Determine booked slots for selected date
  const bookedSlots = useMemo(() => {
    if (!form.booking_date || !selectedEqId) return new Set<string>();
    const set = new Set<string>();
    bookings.filter((b) => b.equipment_id === selectedEqId && b.booking_date === form.booking_date).forEach((b) => {
      const sh = b.start_time.slice(0, 5);
      const eh = b.end_time.slice(0, 5);
      TIME_SLOTS.forEach((slot) => {
        if (slot >= sh && slot < eh) set.add(slot);
      });
    });
    availability.filter((a) => a.rule_type === 'block').forEach((a) => {
      const matchDate = a.blocked_date === form.booking_date || (a.is_recurring && a.day_of_week === new Date(form.booking_date + 'T00:00').getDay());
      if (matchDate) {
        const sh = (a.blocked_start_time || '').slice(0, 5);
        const eh = (a.blocked_end_time || '').slice(0, 5);
        TIME_SLOTS.forEach((slot) => {
          if (sh && eh && slot >= sh && slot < eh) set.add(slot);
        });
      }
    });
    return set;
  }, [bookings, availability, form.booking_date, selectedEqId]);

  const today = new Date().toISOString().slice(0, 10);

  // Normalize land area to acres: 1 hectare = 2.471 acres
  const areaInAcres = useMemo(() => {
    const area = parseFloat(form.land_area) || 0;
    return form.land_area_unit === 'hectares' ? area * 2.471 : area;
  }, [form.land_area, form.land_area_unit]);

  // Number of hours between start and end time
  const hoursCount = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0;
    const sh = parseInt(form.start_time.slice(0, 2), 10);
    const sm = parseInt(form.start_time.slice(3, 5), 10);
    const eh = parseInt(form.end_time.slice(0, 2), 10);
    const em = parseInt(form.end_time.slice(3, 5), 10);
    const diff = eh + em / 60 - (sh + sm / 60);
    return Math.max(1, diff);
  }, [form.start_time, form.end_time]);

  const estPrice = useMemo(() => {
    if (!selectedEquipment) return 0;
    const unit = selectedEquipment.pricing_unit.toLowerCase();
    if (unit.includes('hour')) return Math.round(selectedEquipment.price * hoursCount);
    if (unit.includes('acre')) return Math.round(selectedEquipment.price * areaInAcres);
    return selectedEquipment.price;
  }, [selectedEquipment, areaInAcres, hoursCount]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    // Basic validation
    if (!/^\d{10}$/.test(form.customer_mobile.replace(/[^0-9]/g, '')) || form.customer_mobile.replace(/[^0-9]/g, '').length < 10) {
      setStatus('error');
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const { data, error: err } = await supabase.rpc('create_booking', {
      p_customer_name: form.customer_name,
      p_customer_mobile: form.customer_mobile,
      p_customer_whatsapp: form.customer_whatsapp || null,
      p_equipment_id: selectedEqId,
      p_booking_date: form.booking_date,
      p_start_time: form.start_time,
      p_end_time: form.end_time,
      p_farm_village: form.farm_village,
      p_farm_address: form.farm_address || null,
      p_land_area: parseFloat(form.land_area) || 0,
      p_land_area_unit: form.land_area_unit,
      p_crop_type: form.crop_type || null,
      p_work_required: form.work_required || null,
      p_additional_requirements: form.additional_requirements || null,
    });

    if (err) {
      setStatus('error');
      setError(err.message);
      return;
    }

    if (data && data.error) {
      setStatus('error');
      setError(data.error);
      return;
    }

    setResult(data.booking as Booking);
    setStatus('success');
  };

  if (status === 'success' && result) {
    return (
      <div className="section py-16">
        <div className="mx-auto max-w-2xl">
          <div className="card p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-stone-900">Booking Request Submitted!</h1>
            <p className="mt-2 text-stone-600">Your booking reference number is:</p>
            <p className="mt-3 text-3xl font-extrabold tracking-wide text-green-700">{result.reference_number}</p>
            <div className="mt-6 rounded-2xl bg-yellow-50 p-4 text-left text-sm text-stone-700">
              <p className="font-semibold text-stone-900">Important:</p>
              <p className="mt-1">Your booking is <strong>Pending Approval</strong> and not yet confirmed. The owner will review your request and contact you. Please save your reference number to track your booking.</p>
            </div>

            <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Equipment</p>
                <p className="font-semibold">{result.equipment_name}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Date & Time</p>
                <p className="font-semibold">{result.booking_date} • {result.start_time.slice(0, 5)} - {result.end_time.slice(0, 5)}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Location</p>
                <p className="font-semibold">{result.farm_village}</p>
              </div>
              <div className="rounded-xl bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Est. Price</p>
                <p className="font-semibold">₹{result.total_price}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href={`tel:${phone}`} className="btn-primary"><Phone size={16} /> Call Owner</a>
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> WhatsApp</a>
              <button onClick={() => navigate('/')} className="btn-ghost">Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-green-700 py-12 text-white">
        <div className="section">
          <h1 className="text-4xl font-bold">Book Equipment</h1>
          <p className="mt-2 text-green-50">Fill in your farm details to request a booking.</p>
        </div>
      </div>

      <div className="section py-10">
        <button onClick={() => navigate('/services')} className="btn-ghost mb-6">
          <ArrowLeft size={16} /> Back to Services
        </button>

        {equipment.length === 0 ? (
          <p className="rounded-2xl bg-stone-100 p-10 text-center text-stone-500">No equipment is available for booking right now. Please check back later or call the owner.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Equipment selection */}
              <div className="card p-6">
                <h2 className="text-lg font-bold text-stone-900">1. Select Equipment</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {equipment.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSelectedEqId(e.id)}
                      className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                        selectedEqId === e.id ? 'border-green-600 bg-green-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {e.main_image_url && <img src={e.main_image_url} alt={e.name} className="h-14 w-14 rounded-lg object-cover" />}
                      <div>
                        <p className="font-semibold text-stone-900">{e.name}</p>
                        <p className="text-xs text-stone-500">₹{e.price} {e.pricing_unit}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="card p-6">
                <h2 className="text-lg font-bold text-stone-900">2. Select Date & Time</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">Booking Date *</label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={form.booking_date}
                      onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Start Time *</label>
                    <select required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input">
                      <option value="">Select</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t} disabled={bookedSlots.has(t)}>{t}{bookedSlots.has(t) ? ' (booked)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">End Time *</label>
                    <select required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input">
                      <option value="">Select</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t} disabled={Boolean(form.start_time) && t <= form.start_time}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {form.booking_date && bookedSlots.size > 0 && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                    <Calendar size={14} /> Greyed-out time slots are already booked or blocked for this date.
                  </p>
                )}
                {form.booking_date && bookedSlots.size === TIME_SLOTS.length && (
                  <p className="mt-3 flex items-center gap-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
                    <AlertCircle size={14} /> All slots for this date are booked. Please choose another date.
                  </p>
                )}
              </div>

              {/* Farm details */}
              <div className="card p-6">
                <h2 className="text-lg font-bold text-stone-900">3. Farm & Contact Details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Full Name *</label>
                    <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Mobile Number *</label>
                    <input required value={form.customer_mobile} onChange={(e) => setForm({ ...form, customer_mobile: e.target.value })} className="input" placeholder="10-digit number" />
                  </div>
                  <div>
                    <label className="label">WhatsApp Number</label>
                    <input value={form.customer_whatsapp} onChange={(e) => setForm({ ...form, customer_whatsapp: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Farm Village *</label>
                    <input required value={form.farm_village} onChange={(e) => setForm({ ...form, farm_village: e.target.value })} className="input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Farm Address / Location Details</label>
                    <input value={form.farm_address} onChange={(e) => setForm({ ...form, farm_address: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Land Area *</label>
                    <input type="number" step="0.1" required value={form.land_area} onChange={(e) => setForm({ ...form, land_area: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select value={form.land_area_unit} onChange={(e) => setForm({ ...form, land_area_unit: e.target.value })} className="input">
                      <option value="acres">Acres</option>
                      <option value="hectares">Hectares</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Crop Type</label>
                    <input value={form.crop_type} onChange={(e) => setForm({ ...form, crop_type: e.target.value })} className="input" placeholder="e.g. Wheat, Sugarcane" />
                  </div>
                  <div>
                    <label className="label">Work Required</label>
                    <input value={form.work_required} onChange={(e) => setForm({ ...form, work_required: e.target.value })} className="input" placeholder="e.g. Spraying, Ploughing" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Additional Requirements</label>
                    <textarea rows={3} value={form.additional_requirements} onChange={(e) => setForm({ ...form, additional_requirements: e.target.value })} className="input" />
                  </div>
                </div>
              </div>
            </div>

            {/* Price breakdown — full width bottom */}
            <div className="lg:col-span-3">
              <div className="card overflow-hidden p-0">
                <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <span className="text-2xl">₹</span> Price Breakdown
                  </h2>
                </div>
                <div className="p-6">
                  {selectedEquipment ? (
                    <div className="space-y-4">
                      {/* Rate info */}
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-stone-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Rate</p>
                          <p className="mt-1 text-2xl font-bold text-stone-900">₹{selectedEquipment.price}</p>
                          <p className="text-xs text-stone-500">{selectedEquipment.pricing_unit}</p>
                        </div>
                        <div className="rounded-xl bg-stone-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                            {selectedEquipment.pricing_unit.toLowerCase().includes('hour') ? 'Hours' : 'Land Area'}
                          </p>
                          <p className="mt-1 text-2xl font-bold text-stone-900">
                            {selectedEquipment.pricing_unit.toLowerCase().includes('hour')
                              ? hoursCount
                              : `${form.land_area || 0} ${form.land_area_unit}`}
                          </p>
                          <p className="text-xs text-stone-500">
                            {selectedEquipment.pricing_unit.toLowerCase().includes('hour')
                              ? `${form.start_time || '--'} – ${form.end_time || '--'}`
                              : form.land_area_unit === 'hectares'
                                ? `≈ ${areaInAcres.toFixed(2)} acres`
                                : 'total area'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-green-50 p-4 ring-1 ring-green-200">
                          <p className="text-xs font-medium uppercase tracking-wide text-green-700">Estimated Total</p>
                          <p className="mt-1 text-2xl font-bold text-green-700">
                            ₹{new Intl.NumberFormat('en-IN').format(estPrice)}
                          </p>
                          <p className="text-xs text-stone-500">Final price confirmed by owner</p>
                        </div>
                      </div>

                      {/* Calculation detail */}
                      <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <p className="mb-3 text-sm font-semibold text-stone-700">How the price is calculated</p>
                        <div className="space-y-2 text-sm">
                          {selectedEquipment.pricing_unit.toLowerCase().includes('hour') ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-stone-500">Rate per hour</span>
                                <span className="font-medium text-stone-900">₹{selectedEquipment.price}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-500">× Number of hours ({form.start_time || '–'} to {form.end_time || '–'})</span>
                                <span className="font-medium text-stone-900">× {hoursCount}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-stone-500">Rate per acre</span>
                                <span className="font-medium text-stone-900">₹{selectedEquipment.price}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-500">× Land area</span>
                                <span className="font-medium text-stone-900">
                                  {form.land_area || 0} {form.land_area_unit}
                                  {form.land_area_unit === 'hectares' && ` (≈ ${areaInAcres.toFixed(2)} acres)`}
                                </span>
                              </div>
                            </>
                          )}
                          <div className="border-t border-dashed border-stone-300 pt-2">
                            <div className="flex justify-between text-base">
                              <span className="font-bold text-stone-900">Estimated Total</span>
                              <span className="font-bold text-green-700">₹{new Intl.NumberFormat('en-IN').format(estPrice)}</span>
                            </div>
                          </div>
                        </div>
                        {!form.land_area && !selectedEquipment.pricing_unit.toLowerCase().includes('hour') && (
                          <p className="mt-3 text-xs text-amber-600">Enter your land area to see the price calculation.</p>
                        )}
                        {selectedEquipment.pricing_unit.toLowerCase().includes('hour') && (!form.start_time || !form.end_time) && (
                          <p className="mt-3 text-xs text-amber-600">Select start and end time to see the price calculation.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-stone-500">Select equipment to see the price breakdown.</p>
                  )}

                  {status === 'error' && (
                    <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
                  )}

                  <button type="submit" disabled={status === 'submitting'} className="btn-primary mt-6 w-full sm:w-auto">
                    {status === 'submitting' ? 'Submitting...' : 'Submit Booking Request'}
                  </button>
                  <p className="mt-3 text-xs text-stone-400">Your request will be reviewed before confirmation.</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-20 p-6">
                <h2 className="text-lg font-bold text-stone-900">Booking Summary</h2>
                {selectedEquipment && (
                  <div className="mt-4 space-y-3 text-sm">
                    {selectedEquipment.main_image_url && (
                      <img src={selectedEquipment.main_image_url} alt={selectedEquipment.name} className="aspect-video w-full rounded-xl object-cover" />
                    )}
                    <div className="flex justify-between"><span className="text-stone-500">Equipment</span><span className="font-semibold">{selectedEquipment.name}</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Price</span><span className="font-semibold">₹{selectedEquipment.price} {selectedEquipment.pricing_unit}</span></div>
                    {form.booking_date && <div className="flex justify-between"><span className="text-stone-500">Date</span><span className="font-semibold">{form.booking_date}</span></div>}
                    {form.start_time && form.end_time && <div className="flex justify-between"><span className="text-stone-500">Time</span><span className="font-semibold">{form.start_time} - {form.end_time}</span></div>}
                    {form.land_area && <div className="flex justify-between"><span className="text-stone-500">Land</span><span className="font-semibold">{form.land_area} {form.land_area_unit}</span></div>}
                    {estPrice > 0 && (
                      <div className="border-t border-stone-200 pt-3">
                        <div className="flex justify-between text-base">
                          <span className="font-bold text-stone-900">Estimated Total</span>
                          <span className="font-bold text-green-700">₹{new Intl.NumberFormat('en-IN').format(estPrice)}</span>
                        </div>
                        <p className="mt-1 text-xs text-stone-400">Final price confirmed by the owner.</p>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-4 text-center text-xs text-stone-400">Review the price breakdown below before submitting.</p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
