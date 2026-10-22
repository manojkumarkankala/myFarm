import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Equipment, EquipmentImage } from '@/lib/types';
import { ArrowLeft, ArrowRight, Phone, CheckCircle2, MapPin } from 'lucide-react';
import { useSite } from '@/lib/site';

interface Props {
  equipmentId: string;
  navigate: (to: string) => void;
}

export default function EquipmentDetailsPage({ equipmentId, navigate }: Props) {
  const { profile, settings } = useSite();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [images, setImages] = useState<EquipmentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: eq }, { data: imgs }] = await Promise.all([
        supabase.from('equipment').select('*').eq('id', equipmentId).maybeSingle(),
        supabase.from('equipment_images').select('*').eq('equipment_id', equipmentId).order('sort_order'),
      ]);
      setEquipment(eq as Equipment | null);
      setImages((imgs as EquipmentImage[]) || []);
      setLoading(false);
    })();
  }, [equipmentId]);

  if (loading) {
    return <div className="section py-20"><div className="h-80 animate-pulse rounded-3xl bg-stone-200" /></div>;
  }

  if (!equipment) {
    return (
      <div className="section py-20 text-center">
        <p className="text-stone-500">Equipment not found.</p>
        <button onClick={() => navigate('/services')} className="btn-primary mt-4">Browse Services</button>
      </div>
    );
  }

  const phone = profile?.mobile_number || settings.contact_phone || '8555895018';
  const allImages = [equipment.main_image_url, ...images.map((i) => i.image_url)].filter(Boolean) as string[];
  const specs = equipment.specifications || {};

  return (
    <div>
      <div className="section py-8">
        <button onClick={() => navigate('/services')} className="btn-ghost mb-6">
          <ArrowLeft size={16} /> Back to Services
        </button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-3xl bg-stone-100">
              {allImages[activeImg] && (
                <img src={allImages[activeImg]} alt={equipment.name} className="aspect-[4/3] w-full object-cover" />
              )}
            </div>
            {allImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImg === i ? 'border-green-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="chip">{equipment.category}</span>
            <h1 className="mt-3 text-3xl font-bold text-stone-900">{equipment.name}</h1>
            <p className="mt-3 text-stone-600">{equipment.description}</p>

            <div className="mt-6 rounded-2xl bg-green-50 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-stone-500">Rental Price</p>
                  <p className="text-3xl font-bold text-green-700">₹{new Intl.NumberFormat('en-IN').format(equipment.price)}</p>
                  <p className="text-sm text-stone-600">{equipment.pricing_unit}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${equipment.availability_status === 'available' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                  {equipment.availability_status === 'available' ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>

            {Object.keys(specs).length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-stone-900">Specifications</h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-stone-50 p-3">
                      <dt className="text-xs capitalize text-stone-500">{k.replace(/_/g, ' ')}</dt>
                      <dd className="font-semibold text-stone-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {equipment.service_locations && (
              <p className="mt-4 flex items-center gap-2 text-sm text-stone-600">
                <MapPin size={16} className="text-green-700" /> Service area: {equipment.service_locations}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => navigate(`/booking?equipment=${equipment.id}`)} className="btn-primary" disabled={equipment.availability_status !== 'available'}>
                Book Now <ArrowRight size={16} />
              </button>
              <a href={`tel:${phone}`} className="btn-outline"><Phone size={16} /> Call Owner</a>
            </div>

            <div className="mt-6 rounded-2xl bg-stone-50 p-5">
              <h3 className="font-bold text-stone-900">What's Included</h3>
              <ul className="mt-3 space-y-2 text-sm text-stone-600">
                {['Trained operator included', 'Well-maintained equipment', 'Fuel costs covered', 'Timely arrival guaranteed'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-600" /> {f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
