import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Equipment } from '@/lib/types';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

interface Props {
  navigate: (to: string) => void;
}

export default function ManageEquipment({ navigate }: Props) {
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = () => {
    supabase.from('equipment').select('*').order('sort_order')
      .then(({ data }) => {
        setItems((data as Equipment[]) || []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const toggleActive = async (eq: Equipment) => {
    await supabase.from('equipment').update({ is_active: !eq.is_active }).eq('id', eq.id);
    load();
  };

  const del = async (id: string) => {
    await supabase.from('equipment').delete().eq('id', id);
    setConfirmDel(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Manage Equipment</h1>
          <p className="mt-1 text-sm text-stone-500">{items.length} listing(s).</p>
        </div>
        <button onClick={() => navigate('/admin/equipment/new')} className="btn-primary">
          <Plus size={16} /> Add Equipment
        </button>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-stone-100" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-white p-10 text-center text-stone-500 ring-1 ring-stone-200">No equipment yet. Click "Add Equipment" to create your first listing.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((eq) => (
            <div key={eq.id} className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
              <div className="flex gap-3">
                {eq.main_image_url ? (
                  <img src={eq.main_image_url} alt={eq.name} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-stone-100 text-stone-400">No img</div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-stone-900">{eq.name}</p>
                  <p className="text-xs text-stone-500">{eq.category}</p>
                  <p className="text-sm font-semibold text-green-700">₹{eq.price} {eq.pricing_unit}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${eq.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                  {eq.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(eq)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" title={eq.is_active ? 'Hide' : 'Show'}>
                    {eq.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button onClick={() => navigate(`/admin/equipment/${eq.id}`)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => setConfirmDel(eq.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4" onClick={() => setConfirmDel(null)}>
          <div className="max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-stone-900">Delete this equipment?</h3>
            <p className="mt-2 text-sm text-stone-600">This cannot be undone. Existing bookings referencing this equipment will keep their records.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => del(confirmDel)} className="btn-primary bg-red-600 hover:bg-red-700">Delete</button>
              <button onClick={() => setConfirmDel(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
