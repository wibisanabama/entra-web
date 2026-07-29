import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Event } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  let formattedDate = 'Waktu Belum Ditentukan';
  try {
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (!isNaN(startDate.getTime())) {
        formattedDate = format(startDate, 'dd MMM yyyy, HH:mm', { locale: id });
      }
    }
  } catch (err) {
    // ignore
  }
  
  return (
    <Link href={`/events/${event.id}`}>
      <Card className="h-full flex flex-col group hover:shadow-xl transition-all duration-300">
        <div className="relative h-48 w-full overflow-hidden">
          {event.banner_url ? (
            <img 
              src={event.banner_url} 
              alt={event.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-violet-900 flex items-center justify-center">
              <span className="text-gray-500 font-medium">Tanpa Gambar</span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge status={event.status || 'ACTIVE'} className="shadow-lg backdrop-blur-md bg-opacity-90" />
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
            {event.title}
          </h3>
          <div className="space-y-2 mt-auto">
            <div className="flex items-center text-sm text-gray-400">
              <span className="mr-2">📅</span>
              {formattedDate}
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <span className="mr-2">📍</span>
              {event.is_online ? 'Online Event' : (event.venue?.name || 'TBA')}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
