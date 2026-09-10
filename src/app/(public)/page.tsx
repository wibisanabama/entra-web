'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { eventApi } from '@/lib/api';
import { Event as EventType, Category, Venue } from '@/types';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Only display categories that actually have at least one event
  const activeCategories = useMemo(() => {
    return categories.filter((cat) =>
      events.some(
        (ev) =>
          ev.category_id === cat.id ||
          ev.category?.id === cat.id ||
          ev.category?.name?.toLowerCase().replace(/\s+/g, '-') === cat.id
      )
    );
  }, [categories, events]);

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
  }, [selectedCategory, activeCategories, isReady]);

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
    const fetchData = async () => {
      try {
        setLoadError(false);
        const [eventRes, catRes, venueRes] = await Promise.all([
          eventApi.get<EventType[]>('/api/v1/events?page=1&per_page=16'),
          eventApi.get<Category[]>('/api/v1/categories').catch(() => ({ success: false, data: [] as Category[] })),
          eventApi.get<Venue[]>('/api/v1/venues').catch(() => ({ success: false, data: [] as Venue[] }))
        ]);

        const rawCategories = catRes.data && Array.isArray(catRes.data) ? catRes.data : [];
        const rawVenues = venueRes.data && Array.isArray(venueRes.data) ? venueRes.data : [];
        setCategories(rawCategories);

        if (eventRes.data && Array.isArray(eventRes.data)) {
          const eventsWithDetails: EventType[] = await Promise.all(
            eventRes.data.map(async (ev) => {
              const venue = rawVenues.find((v) => v.id === ev.venue_id);
              const category = rawCategories.find((c) => c.id === ev.category_id);
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
                venue: venue || ev.venue,
                category: category || ev.category,
                ticket_types: ticketTypes,
              };
            })
          );
          setEvents(eventsWithDetails);
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);



  // Filter events by category
  const filteredEvents = events.filter((ev) => {
    const matchCategory =
      selectedCategory === 'all' ||
      ev.category_id === selectedCategory ||
      ev.category?.id === selectedCategory ||
      ev.category?.name?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    return matchCategory;
  });

  return (
    <div className="w-full bg-white text-zinc-900 min-h-screen">
      
      <section className="px-6 sm:px-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-12 sm:py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-[60px] font-semibold leading-[1.1] tracking-[-0.035em] text-zinc-950">
            Temukan pengalaman nyata <br className="hidden sm:inline" />di sekitar Anda.
          </h1>
          <p className="mt-5 max-w-[620px] text-base sm:text-lg text-zinc-500 font-normal leading-relaxed">
            Cari event, pilih tiket, lalu masuk dengan QR. Praktis, aman, dan instan <br className="hidden sm:inline" />untuk semua pengunjung.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link 
              href="/events" 
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-[15px] font-semibold text-white hover:bg-zinc-800 transition-all shadow-none tracking-[-0.01em]"
            >
              Jelajahi event
            </Link>
            <Link 
              href="/register" 
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-6 text-[15px] font-semibold text-zinc-950 hover:bg-zinc-50 transition-all shadow-none tracking-[-0.01em]"
            >
              Mulai sebagai organizer <ArrowRight className="h-4 w-4 stroke-[2]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Event Discovery Section ala Mobbin */}
      <section className="pt-20 sm:pt-28 pb-20 sm:pb-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Heading & Segmented Category Pill Tabs */}
          <div className="flex flex-col items-center text-center">
            <h2 className="text-4xl sm:text-6xl lg:text-[68px] font-semibold leading-[1.08] tracking-[-0.035em] text-zinc-950">
              Temukan event <br />dalam hitungan detik.
            </h2>

            {/* Segmented Control Pill ala Mobbin */}
            <div className="mt-8 sm:mt-10 flex justify-center w-full">
              <div
                ref={containerRef}
                className="relative inline-flex items-center p-1 sm:p-1.5 bg-zinc-200/80 rounded-full gap-1 overflow-x-auto no-scrollbar max-w-full"
              >
                {/* Sliding Capsule Highlight */}
                <div
                  className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-white pointer-events-none ${
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
                {activeCategories.map((cat) => {
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

          {/* Event Cards Grid */}
          <div className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {loading ? 'Memuat Event...' : `Menampilkan ${filteredEvents.length} Event`}
              </span>
              <Link 
                href="/events" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors group"
              >
                <span>Lihat Katalog Lengkap</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2]" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col rounded-2xl bg-zinc-100 p-3">
                    <Skeleton className="aspect-[16/10] w-full rounded-xl bg-zinc-200/80" />
                    <div className="pt-3 pb-1 px-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded-md bg-zinc-200/80" />
                      <Skeleton className="h-3 w-1/2 rounded-md bg-zinc-200/80" />
                      <div className="pt-2 flex justify-between items-center">
                        <Skeleton className="h-3 w-16 rounded-md bg-zinc-200/80" />
                        <Skeleton className="h-6 w-20 rounded-full bg-zinc-200/80" />
                      </div>
                    </div>
                  </div>
                ))
              ) : loadError ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl bg-zinc-100 px-6 py-16 sm:py-20 text-center">
                  <p className="text-base font-bold text-zinc-950">Event belum dapat dimuat</p>
                  <p className="mt-2 max-w-md text-sm text-zinc-500">Periksa koneksi ke layanan event, lalu coba kembali.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-5 h-10 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl bg-zinc-100 p-8 sm:p-12 text-center min-h-[300px]">
                  <div className="max-w-md mx-auto">
                    <p className="text-base font-bold text-zinc-950 mb-1">
                      {events.length === 0 ? 'Belum ada event yang tersedia' : 'Tidak ada event untuk filter ini'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {events.length === 0
                        ? 'Event baru akan segera hadir. Silakan periksa kembali nanti.'
                        : 'Coba pilih kategori lain atau reset filter pilihan Anda.'}
                    </p>
                    {events.length > 0 && selectedCategory !== 'all' && (
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="mt-4 px-5 py-2 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      <section className="bg-white px-4 pt-20 sm:pt-28 pb-0">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Cara kerja</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl">Dari pencarian sampai pintu masuk.</h2>
          </div>
          <div className="mt-16 sm:mt-20 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {[
              ['01', 'Temukan event', 'Gunakan katalog, kategori, waktu, lokasi, dan harga untuk mempersempit pilihan.'],
              ['02', 'Pesan tiket', 'Pilih jenis dan jumlah tiket, periksa ringkasan, lalu selesaikan pembayaran.'],
              ['03', 'Tunjukkan QR', 'Buka tiket aktif dari akun Anda dan tunjukkan QR saat tiba di gate.'],
            ].map(([number, title, description]) => (
              <article key={number} className="bg-zinc-100 rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
                <span className="text-xs font-bold text-zinc-400">{number}</span>
                <h3 className="mt-8 text-xl font-bold text-zinc-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-8 sm:pt-12 pb-20 sm:pb-28">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[2rem] bg-zinc-950 p-8 text-white sm:p-12 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Untuk organizer</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Kelola event dari publikasi hingga check-in.</h2>
          </div>
          <Link href="/register" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-zinc-950 hover:bg-zinc-100">
            Buat akun organizer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
