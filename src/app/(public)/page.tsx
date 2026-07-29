'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EventCard } from '@/components/features/EventCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
// import { fetchApi } from '@/lib/api';

export default function HomePage() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Placeholder for API call
        // const data = await fetchApi('/api/v1/events?page=1&per_page=6');
        // setEvents(data.data);
        
        // Mock data
        setEvents([
          { id: '1', title: 'Music Festival 2024', date: '2024-10-12', venue: 'GBK Stadium', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Music' },
          { id: '2', title: 'Tech Conference', date: '2024-11-05', venue: 'JCC Senayan', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Technology' },
          { id: '3', title: 'Food & Beverage Expo', date: '2024-09-20', venue: 'ICE BSD', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Culinary' },
          { id: '4', title: 'Marathon 10K', date: '2024-08-30', venue: 'Sudirman Street', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Sports' },
        ]);
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
          <Link href="/events">
            <Button size="lg" className="!bg-white !text-[#7C3AED] hover:!bg-gray-200 shadow-xl text-lg px-8 py-6 rounded-full transition-all ">
              Jelajahi Event
            </Button>
          </Link>
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
            ) : (
              events.map((event) => (
                  <EventCard key={(event as any).id} event={event as any} />
              ))
            )}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/events" className="text-[#7C3AED] hover:text-[#4F46E5] font-medium">
              Lihat Semua
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 ">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Punya Event Sendiri?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-lg">
            Bergabunglah sebagai organizer dan mulai jual tiket eventmu di Entra. Dapatkan jangkauan luas dan fitur manajemen event yang lengkap.
          </p>
          <Link href="/register?role=organizer">
            <Button size="lg" className="bg-[#7C3AED] hover:opacity-90 shadow-lg px-8 py-6 rounded-full text-lg">
              Mulai Jual Tiket Eventmu
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
