'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { eventApi } from '@/lib/api';
import { Event as EventType, Category, Venue } from '@/types';
import { Sparkles, Compass, Music, Laptop, Briefcase, Users, Palette, Utensils, Trophy } from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'free'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, catRes, venueRes] = await Promise.all([
          eventApi.get<EventType[]>('/api/v1/events?page=1&per_page=16'),
          eventApi.get<Category[]>('/api/v1/categories').catch(() => ({ success: false, data: [] as Category[] })),
          eventApi.get<Venue[]>('/api/v1/venues').catch(() => ({ success: false, data: [] as Venue[] }))
        ]);

        if (catRes.data && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }

        if (eventRes.data && Array.isArray(eventRes.data)) {
          const venues: Venue[] = Array.isArray(venueRes.data) ? venueRes.data : [];
          const eventsWithVenues: EventType[] = eventRes.data.map((ev) => {
            const venue = venues.find((v) => v.id === ev.venue_id);
            return { ...ev, venue: venue || ev.venue };
          });
          setEvents(eventsWithVenues);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (identifier?: string) => {
    const key = identifier?.toLowerCase().replace(/\s+/g, '-');
    switch (key) {
      case 'music':
      case 'musik': return <Music className="w-3.5 h-3.5" />;
      case 'technology':
      case 'teknologi': return <Laptop className="w-3.5 h-3.5" />;
      case 'business':
      case 'bisnis': return <Briefcase className="w-3.5 h-3.5" />;
      case 'community':
      case 'komunitas': return <Users className="w-3.5 h-3.5" />;
      case 'arts-culture':
      case 'seni-budaya':
      case 'seni': return <Palette className="w-3.5 h-3.5" />;
      case 'food-drink':
      case 'kuliner': return <Utensils className="w-3.5 h-3.5" />;
      case 'sports':
      case 'olahraga': return <Trophy className="w-3.5 h-3.5" />;
      default: return <Compass className="w-3.5 h-3.5" />;
    }
  };

  // Filter events by category and status
  const filteredEvents = events.filter((ev) => {
    const matchCategory =
      selectedCategory === 'all' ||
      ev.category_id === selectedCategory ||
      ev.category?.id === selectedCategory ||
      ev.category?.name?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    if (!matchCategory) return false;

    if (selectedFilter === 'online') {
      return ev.is_online === true;
    }
    if (selectedFilter === 'free') {
      const minPrice = ev.ticket_types?.length ? Math.min(...ev.ticket_types.map(t => Number(t.price) || 0)) : null;
      return minPrice === 0;
    }
    return true;
  });

  return (
    <div className="w-full bg-white text-zinc-900 min-h-screen">
      
      {/* Sub-header / Page Title */}
      <section className="pt-8 pb-4 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
              <span>Jelajahi Pengalaman Nyata</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Temukan Event, Konser & Festival Terbaik
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Pesan e-tiket ber-QR resmi, transaksi cashless di venue, dan akses gate instan tanpa antre.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedFilter(selectedFilter === 'online' ? 'all' : 'online')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedFilter === 'online'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950'
              }`}
            >
              🌐 Online Saja
            </button>
            <button
              onClick={() => setSelectedFilter(selectedFilter === 'free' ? 'all' : 'free')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedFilter === 'free'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950'
              }`}
            >
              🎟️ Gratis
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Pill Filter Bar ala Mobbin */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Semua Kategori</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200'
                  }`}
                >
                  {getCategoryIcon(cat.name)}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Gallery Grid Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {loading ? 'Memuat Event...' : `Menampilkan ${filteredEvents.length} Event`}
            </span>
            <Link 
              href="/events" 
              className="text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              Lihat Katalog Lengkap &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-3 bg-white">
                  <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                  <div className="pt-2 border-t border-zinc-100 flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                <p className="text-sm font-semibold text-zinc-800">Tidak ada event untuk filter ini</p>
                <p className="text-xs text-zinc-500 mt-1">Coba pilih kategori lain atau reset filter pilihan Anda.</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSelectedFilter('all'); }}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}
