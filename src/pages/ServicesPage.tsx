import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Equipment } from '@/lib/types';
import EquipmentCard from '@/components/EquipmentCard';
import { Search } from 'lucide-react';

interface Props {
  navigate: (to: string) => void;
}

export default function ServicesPage({ navigate }: Props) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    supabase.from('equipment').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => {
        setEquipment((data as Equipment[]) || []);
        setLoading(false);
      });
  }, []);

  const categories = ['all', ...Array.from(new Set(equipment.map((e) => e.category)))];
  const filtered = equipment.filter((e) => {
    const matchCat = category === 'all' || e.category === category;
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="bg-green-700 py-14 text-white">
        <div className="section">
          <h1 className="text-4xl font-bold">Our Services & Equipment</h1>
          <p className="mt-3 max-w-xl text-green-50">Browse our full range of agricultural equipment available for booking. All equipment comes with a trained operator.</p>
        </div>
      </div>

      <div className="section py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment..." className="input pl-10" />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  category === c ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 animate-pulse rounded-3xl bg-stone-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-12 rounded-2xl bg-stone-100 p-10 text-center text-stone-500">No equipment matches your search. Try different keywords.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <EquipmentCard key={e.id} equipment={e} onView={(id) => navigate(`/equipment/${id}`)} onBook={(id) => navigate(`/booking?equipment=${id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
