import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
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
    <Link href={`/events/${event.id}`} className="block h-full">
      <div className="h-full flex flex-col rounded-2xl bg-white p-3">
        {/* Banner Thumbnail (16:10 aspect ratio) */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-zinc-100">
          {banner ? (
            <img 
              src={banner} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">
              <span className="font-semibold text-xs tracking-wider uppercase">Entra Event</span>
            </div>
          )}

          {/* Category Pill Tag Overlay */}
          {event.category?.name && (
            <div className="absolute top-2.5 left-2.5">
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/95 backdrop-blur-md text-zinc-900 rounded-full">
                {event.category.name}
              </span>
            </div>
          )}

          {/* Online badge */}
          {event.is_online && (
            <div className="absolute top-2.5 right-2.5">
              <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-zinc-950/90 backdrop-blur-md text-white rounded-full tracking-wider uppercase">
                Online
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="pt-3 pb-1 px-1 flex flex-col flex-1 justify-between gap-2.5">
          <div>
            <h3 className="text-[15px] font-semibold text-zinc-950 line-clamp-2 leading-snug tracking-[-0.01em]">
              {event.title}
            </h3>

            <div className="mt-2 space-y-1.5 text-xs text-zinc-500">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{formattedTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{venueName}</span>
              </div>
            </div>
          </div>

          {/* Card Footer: Price Pill */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Harga Tiket</span>
            <div className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900">
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
