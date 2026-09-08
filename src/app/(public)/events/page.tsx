'use client';

import { useEffect, useState } from 'react';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { eventApi } from '@/lib/api';
import { Event, Category, Venue } from '@/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, venueRes, res] = await Promise.all([
          eventApi.get<Category[]>('/api/v1/categories').catch(() => ({ success: false, data: [] as Category[] })),
          eventApi.get<Venue[]>('/api/v1/venues').catch(() => ({ success: false, data: [] as Venue[] })),
          eventApi.get<Event[]>('/api/v1/events?page=1&per_page=50').catch(() => ({ success: false, data: [] as Event[] })),
        ]);

        const rawCategories = Array.isArray(catRes.data) ? catRes.data : [];
        const rawVenues = Array.isArray(venueRes.data) ? venueRes.data : [];
        const rawEvents = Array.isArray(res.data) ? res.data : [];

        setCategories(rawCategories);
        setVenues(rawVenues);

        // Enrich events with venue, category & ticket_types models
        const enrichedEvents = await Promise.all(
          rawEvents.map(async (ev) => {
            const matchedVenue = rawVenues.find((v) => v.id === ev.venue_id);
            const matchedCat = rawCategories.find((c) => c.id === ev.category_id);
            let ticketTypes = ev.ticket_types || [];
            try {
              const ticketRes = await eventApi.get<any[]>(`/api/v1/events/${ev.id}/tickets`);
              if (ticketRes.data && Array.isArray(ticketRes.data)) {
                ticketTypes = ticketRes.data;
              }
            } catch {
              // ignore
            }
            return {
              ...ev,
              venue: matchedVenue || ev.venue,
              category: matchedCat || ev.category,
              ticket_types: ticketTypes,
            };
          })
        );

        setEvents(enrichedEvents);
      } catch (error) {
        console.error('Error fetching event directory data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8 text-zinc-900">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 tracking-tight">
          Jelajahi Event & Konser Spektakuler
        </h1>
        <p className="text-zinc-500 text-sm sm:text-base">
          Temukan tiket festival musik, seminar teknologi, workshop seni, dan turnamen olahraga terbaik di Indonesia.
        </p>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span>
          Menampilkan <strong className="text-zinc-950 font-semibold">{events.length}</strong> event
        </span>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex flex-col rounded-2xl bg-white p-3">
                <Skeleton className="aspect-[16/10] w-full rounded-xl bg-zinc-100" />
                <div className="pt-3 pb-1 px-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-zinc-100 rounded-md" />
                  <Skeleton className="h-3 w-1/2 bg-zinc-100 rounded-md" />
                </div>
              </div>
            ))
        ) : events.length > 0 ? (
          events.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[360px] text-center p-8 bg-zinc-50/50 rounded-3xl border border-zinc-200 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-950 mb-1">Belum Ada Event</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto">
                Belum ada event yang dipublikasikan saat ini. Silakan periksa kembali nanti.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
