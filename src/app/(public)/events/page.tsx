'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { eventApi } from '@/lib/api';
import { Event, Category, Venue } from '@/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const activeEl = tabsRef.current[selectedCategory];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });

      if (!isReady) {
        const timer = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(timer);
      } else if (containerRef.current) {
        const container = containerRef.current;
        const targetScrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedCategory, categories, isReady]);

  useEffect(() => {
    const handleResize = () => {
      const activeEl = tabsRef.current[selectedCategory];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedCategory]);

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

  // Filter events by selected category and search query
  const filteredEvents = events.filter((ev) => {
    const matchCategory =
      selectedCategory === 'all' ||
      ev.category_id === selectedCategory ||
      ev.category?.id === selectedCategory ||
      ev.category?.name?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;

    if (!matchCategory) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = ev.title?.toLowerCase().includes(q);
      const matchDesc = ev.description?.toLowerCase().includes(q);
      const matchVenueName = ev.venue?.name?.toLowerCase().includes(q);
      const matchVenueCity = ev.venue?.city?.toLowerCase().includes(q);
      const matchCategoryName = ev.category?.name?.toLowerCase().includes(q);

      return matchTitle || matchDesc || matchVenueName || matchVenueCity || matchCategoryName;
    }

    return true;
  });

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

        {/* Search Bar (Above Categories) */}
        <div className="pt-3 pb-1 max-w-md mx-auto w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari event, artis, atau venue..."
              aria-label="Cari event"
              className="w-full h-11 sm:h-12 pl-11 pr-10 bg-zinc-100/80 hover:bg-zinc-100 focus:bg-white text-zinc-950 placeholder-zinc-400 text-sm font-medium rounded-full border border-transparent focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-all shadow-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer rounded-full"
                aria-label="Hapus pencarian"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Segmented Category Pill Tabs ala Mobbin */}
        <div className="pt-2 flex justify-center w-full">
          <div
            ref={containerRef}
            className="relative inline-flex items-center p-1 sm:p-1.5 bg-zinc-200/80 rounded-full gap-1 overflow-x-auto no-scrollbar max-w-full"
          >
            {/* Sliding Capsule Highlight */}
            <div
              className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] pointer-events-none ${
                isReady
                  ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                  : 'transition-none'
              }`}
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.width > 0 ? 1 : 0,
              }}
            />

            <button
              ref={(el) => {
                tabsRef.current['all'] = el;
              }}
              onClick={() => setSelectedCategory('all')}
              className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'text-zinc-950'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Semua Event
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  ref={(el) => {
                    tabsRef.current[cat.id] = el;
                  }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'text-zinc-950'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1 pt-2">
        <span>
          Menampilkan <strong className="text-zinc-950 font-semibold">{filteredEvents.length}</strong> event
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
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[320px] text-center p-8 bg-zinc-50/50 rounded-3xl border border-zinc-200 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-950 mb-1">
                {searchQuery ? 'Tidak Ada Event yang Sesuai' : 'Tidak Ada Event untuk Kategori Ini'}
              </h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto">
                {searchQuery
                  ? `Tidak menemukan event dengan kata kunci "${searchQuery}". Coba gunakan kata kunci lain atau reset filter.`
                  : 'Coba pilih kategori lain atau kembali ke semua event.'}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-5 py-2 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Reset Pencarian & Kategori
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
