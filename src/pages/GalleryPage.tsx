import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/types';
import { X, Play, Filter } from 'lucide-react';

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [active, setActive] = useState<GalleryItem | null>(null);

  useEffect(() => {
    supabase.from('gallery').select('*').eq('is_published', true).order('sort_order')
      .then(({ data }) => {
        setItems((data as GalleryItem[]) || []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[]], [items]);
  const filtered = items.filter((i) => category === 'all' || i.category === category);

  return (
    <div>
      <div className="bg-green-700 py-14 text-white">
        <div className="section">
          <h1 className="text-4xl font-bold">Gallery</h1>
          <p className="mt-3 max-w-xl text-green-50">Photographs and videos of our agricultural work in the field.</p>
        </div>
      </div>

      <div className="section py-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-stone-600"><Filter size={16} /> Filter:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === c ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-stone-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-12 rounded-2xl bg-stone-100 p-10 text-center text-stone-500">No gallery items yet. Please check back soon.</p>
        ) : (
          <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item)}
                className="group relative block w-full overflow-hidden rounded-2xl bg-stone-200 break-inside-avoid"
              >
                <img
                  src={item.media_type === 'video' ? (item.thumbnail_url || item.media_url) : item.media_url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-3 left-3 right-3 text-left opacity-0 transition group-hover:opacity-100">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  {item.location && <p className="text-xs text-stone-200">{item.location}</p>}
                </div>
                {item.media_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-green-700">
                      <Play size={20} className="ml-1" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/90 p-4"
          onClick={() => setActive(null)}
        >
          <button className="absolute right-5 top-5 text-white" onClick={() => setActive(null)} aria-label="Close">
            <X size={28} />
          </button>
          <div className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {active.media_type === 'video' ? (
              <video src={active.media_url} controls autoPlay className="max-h-[85vh] w-full rounded-xl bg-black" />
            ) : (
              <img src={active.media_url} alt={active.title} className="max-h-[85vh] w-full rounded-xl object-contain" />
            )}
            <div className="mt-3 text-center text-white">
              <p className="font-semibold">{active.title}</p>
              {active.description && <p className="mt-1 text-sm text-stone-300">{active.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
