'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EventCard } from '@/components/features/EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { eventApi } from '@/lib/api';
import { Event as EventType, Category, Venue } from '@/types';
import { ArrowRight, Compass, Music, Laptop, Briefcase, Users, Palette, Utensils, Trophy } from 'lucide-react';

export default function HomePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(false);
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
      } catch {
        setLoadError(true);
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
      
      <section className="border-b border-zinc-200 px-6 sm:px-8 min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center py-12 sm:py-16">
        <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
          <h1 className="max-w-[840px] text-4xl sm:text-5xl lg:text-[64px] font-semibold leading-[1.1] tracking-[-0.035em] text-zinc-950">
            Temukan pengalaman nyata di sekitar Anda.
          </h1>
          <p className="mt-5 max-w-lg text-base sm:text-lg text-zinc-500 font-normal leading-relaxed">
            Cari event, pilih tiket, lalu masuk dengan QR. Praktis, aman, dan instan untuk semua pengunjung.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link 
              href="/events" 
              className="inline-flex h-11 sm:h-12 items-center justify-center rounded-full bg-zinc-950 px-7 sm:px-8 text-sm font-semibold text-white hover:bg-zinc-800 transition-all shadow-xs active:scale-95"
            >
              Jelajahi event
            </Link>
            <Link 
              href="/register" 
              className="inline-flex h-11 sm:h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-7 sm:px-8 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 transition-all shadow-xs active:scale-95"
            >
              Mulai sebagai organizer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky Pill Filter Bar ala Mobbin */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
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
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(6).fill(0).map((_, i) => (
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
            ) : loadError ? (
              <div className="col-span-full flex flex-col items-center rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-20 text-center">
                <p className="text-base font-bold text-zinc-950">Event belum dapat dimuat</p>
                <p className="mt-2 max-w-md text-sm text-zinc-500">Periksa koneksi ke layanan event, lalu coba kembali.</p>
                <button onClick={() => window.location.reload()} className="mt-5 h-10 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white">Coba lagi</button>
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                <p className="text-sm font-semibold text-zinc-800">Tidak ada event untuk filter ini</p>
                <p className="text-xs text-zinc-500 mt-1">Coba pilih kategori lain atau reset filter pilihan Anda.</p>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-[900px] px-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Cara kerja</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl">Dari pencarian sampai pintu masuk.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 md:grid-cols-3">
            {[
              ['01', 'Temukan event', 'Gunakan katalog, kategori, waktu, lokasi, dan harga untuk mempersempit pilihan.'],
              ['02', 'Pesan tiket', 'Pilih jenis dan jumlah tiket, periksa ringkasan, lalu selesaikan pembayaran.'],
              ['03', 'Tunjukkan QR', 'Buka tiket aktif dari akun Anda dan tunjukkan QR saat tiba di gate.'],
            ].map(([number, title, description]) => (
              <article key={number} className="bg-white p-8 sm:p-10">
                <span className="text-xs font-bold text-zinc-400">{number}</span>
                <h3 className="mt-8 text-xl font-bold text-zinc-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto flex max-w-[900px] flex-col items-start justify-between gap-8 rounded-[2rem] bg-zinc-950 p-8 text-white sm:p-12 lg:flex-row lg:items-end">
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
