import { ArrowRight, MapPin } from 'lucide-react';
import type { Equipment } from '@/lib/types';

interface Props {
  equipment: Equipment;
  onView: (id: string) => void;
  onBook: (id: string) => void;
}

export default function EquipmentCard({ equipment, onView, onBook }: Props) {
  const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const available = equipment.availability_status === 'available';

  return (
    <div className="card group flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        {equipment.main_image_url ? (
          <img
            src={equipment.main_image_url}
            alt={equipment.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-green-100 text-green-700">
            No image
          </div>
        )}
        <span className="absolute left-3 top-3 chip">{equipment.category}</span>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            available ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {available ? 'Available' : 'Unavailable'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-stone-900">{equipment.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-stone-600">
          {equipment.description}
        </p>

        {equipment.service_locations && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
            <MapPin size={14} className="text-green-600" />
            {equipment.service_locations}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-stone-500">Starting from</p>
            <p className="text-xl font-bold text-green-700">
              ₹{fmt.format(equipment.price)}
              <span className="ml-1 text-xs font-normal text-stone-500">{equipment.pricing_unit}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onView(equipment.id)}
            className="btn-ghost flex-1 border border-stone-300"
          >
            View Details
          </button>
          <button
            onClick={() => onBook(equipment.id)}
            className="btn-primary flex-1"
            disabled={!available}
          >
            Book Now <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
