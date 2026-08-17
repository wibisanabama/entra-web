import React from 'react';
import { Calendar, Clock, MapPin, Tag } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Event } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getPgText, formatCurrency } from '@/lib/utils';

export interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  let formattedDate = 'Tanggal Belum Ditentukan';
  let formattedTime = 'Waktu Belum Ditentukan';
  try {
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (!isNaN(startDate.getTime())) {
        formattedDate = format(startDate, 'dd MMM yyyy', { locale: id });
        formattedTime = format(startDate, 'HH:mm', { locale: id }) + ' WIB';
      }
    }
  } catch (err) {
    // ignore
  }

  // Calculate starting price
  let minPrice: number | null = null;
  if (event.ticket_types && event.ticket_types.length > 0) {
    const prices = event.ticket_types.map((t) => Number(t.price) || 0);
    minPrice = Math.min(...prices);
  }

  const venueName = event.venue?.name || event.venue?.city || (event.is_online ? 'Online Event' : 'Lokasi Terdaftar');
  const banner = getPgText(event.banner_url);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="h-full flex flex-col group hover:shadow-2xl hover:border-violet-500/50 transition-all duration-300 overflow-hidden bg-gray-900 border-gray-800">
        <div className="relative h-48 w-full overflow-hidden bg-gray-950">
          {banner ? (
            <img 
              src={banner} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-950 to-gray-900 flex items-center justify-center">
              <span className="text-gray-500 font-medium text-sm">Entra Event</span>
            </div>
          )}

          {/* Category Pill Tag Overlay */}
          {event.category?.name && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 text-[11px] font-bold bg-black/60 backdrop-blur-md text-violet-300 border border-violet-400/30 rounded-full">
                {event.category.name}
              </span>
            </div>
          )}

          {/* Online badge */}
          {event.is_online && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/80 text-white rounded-md">
                ONLINE
              </span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1 justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors leading-snug">
              {event.title}
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center text-xs text-gray-400">
                <Calendar className="mr-2 h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="mr-2 h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400 truncate">
                <MapPin className="mr-2 h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{venueName}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">Harga Tiket</span>
              <p className="text-xs font-bold text-white">
                {minPrice === null
                  ? 'Lihat Kategori'
                  : minPrice === 0
                  ? 'Gratis'
                  : `Mulai ${formatCurrency(minPrice)}`}
              </p>
            </div>

            <span className="text-xs text-violet-400 font-semibold group-hover:translate-x-1 transition-transform">
              Detail &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

