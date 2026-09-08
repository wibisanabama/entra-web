import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
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
  } catch {
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
    <Link href={`/events/${event.id}`} className="block h-full group">
      <div className="h-full flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-xl hover:border-zinc-300 transition-all duration-300 overflow-hidden">
        {/* Banner Thumbnail (16:10 aspect ratio) */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 border-b border-zinc-100">
          {banner ? (
            <img 
              src={banner} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">
              <span className="font-semibold text-xs tracking-wider uppercase">Entra Event</span>
            </div>
          )}

          {/* Category Pill Tag Overlay */}
          {event.category?.name && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/95 backdrop-blur-md text-zinc-900 border border-zinc-200/90 rounded-full shadow-2xs">
                {event.category.name}
              </span>
            </div>
          )}

          {/* Online badge */}
          {event.is_online && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-zinc-950/90 backdrop-blur-md text-white rounded-full tracking-wider uppercase">
                Online
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-white">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 line-clamp-2 group-hover:text-zinc-700 transition-colors leading-snug">
              {event.title}
            </h3>

            <div className="mt-2 space-y-1 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{formattedDate}</span>
                <span className="text-zinc-300">•</span>
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{venueName}</span>
              </div>
            </div>
          </div>

          {/* Card Footer: Price Pill */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">Harga Tiket</span>
            <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200/60">
              {minPrice === null
                ? 'Informasi Belum Ada'
                : minPrice === 0
                ? 'Gratis'
                : `Mulai ${formatCurrency(minPrice)}`}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
