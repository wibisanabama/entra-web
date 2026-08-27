'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { eventApi } from '@/lib/api';
import { Event as EventType, Venue } from '@/types';

export default function HomePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [res, venueRes] = await Promise.all([
          eventApi.get<EventType[]>('/api/v1/events?page=1&per_page=4'),
          eventApi.get<Venue[]>('/api/v1/venues').catch(() => ({ success: false, data: [] as Venue[] }))
        ]);
        if (res.data && Array.isArray(res.data)) {
          const venues: Venue[] = Array.isArray(venueRes.data) ? venueRes.data : [];
          const eventsWithVenues: EventType[] = res.data.map((ev) => {
            const venue = venues.find((v) => v.id === ev.venue_id);
            return { ...ev, venue: venue || ev.venue };
          });
          setEvents(eventsWithVenues);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 bg-[#7C3AED] overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md animate-fade-in-up">
            Temukan Event Terbaik <br className="hidden md:block" /> di Sekitarmu
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto drop-shadow">
            Platform terbaik untuk mencari, memesan, dan membuat event dengan mudah. Bergabunglah dengan ribuan pengguna lainnya.
          </p>
        </div>
      </section>



      {/* Featured Events Section */}
      <section className="py-20 bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Event Mendatang</h2>
              <p className="text-gray-400">Jangan lewatkan keseruan event-event ini</p>
            </div>
            <Link href="/events" className="text-[#7C3AED] hover:text-[#4F46E5] font-medium hidden md:block">
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="h-48 w-full rounded-xl bg-gray-900" />
                  <Skeleton className="h-6 w-3/4 bg-gray-900" />
                  <Skeleton className="h-4 w-1/2 bg-gray-900" />
                </div>
              ))
            ) : events.length > 0 ? (
              events.map((event) => (
                  <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400">
                Belum ada event mendatang.
              </div>
            )}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/events" className="text-[#7C3AED] hover:text-[#4F46E5] font-medium">
              Lihat Semua
            </Link>
          </div>
        </div>
      </section>


    </div>
  );
}
