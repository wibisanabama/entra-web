'use client';

import { useEffect, useState } from 'react';
import { EventCard } from '@/components/features/EventCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';


export default function EventsPage() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Placeholder for API call
        // const endpoint = searchQuery ? `/api/v1/events/search?q=${searchQuery}` : `/api/v1/events?page=1&per_page=12`;
        // const data = await fetchApi(endpoint);
        
        // Mock data delay
        await new Promise(r => setTimeout(r, 800));
        setEvents([
          { id: '1', title: 'Music Festival 2024', date: '2024-10-12', venue: 'GBK Stadium', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Music' },
          { id: '2', title: 'Tech Conference', date: '2024-11-05', venue: 'JCC Senayan', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Technology' },
          { id: '3', title: 'Food & Beverage Expo', date: '2024-09-20', venue: 'ICE BSD', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Culinary' },
          { id: '4', title: 'Marathon 10K', date: '2024-08-30', venue: 'Sudirman Street', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Sports' },
          { id: '5', title: 'Art Exhibition', date: '2024-12-01', venue: 'National Museum', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Arts' },
          { id: '6', title: 'Startup Bootcamp', date: '2024-10-25', venue: 'Co-working Space', image: 'https://placehold.co/600x400/1e1e1e/8a2be2', category: 'Workshop' },
        ]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by effect dependency
  };

  const categories = ['All', 'Music', 'Technology', 'Sports', 'Culinary', 'Arts', 'Workshop'];

  const filteredEvents = activeCategory === 'All' 
    ? events 
    : events.filter(e => e.category === activeCategory);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Jelajahi Event</h1>
        <p className="text-gray-400 mb-8">Temukan berbagai event menarik yang sesuai dengan minat Anda</p>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            type="text" 
            placeholder="Cari event berdasarkan nama atau lokasi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow bg-gray-900 border-gray-700 text-white"
          />
          <Button type="submit" className="bg-[#7C3AED] hover:bg-[#4F46E5] text-white">
            Cari
          </Button>
        </form>
      </div>

      <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
        {categories.map((cat) => (
          <Badge 
            key={cat} 
            status={cat}
            className={`px-4 py-2 text-sm rounded-full whitespace-nowrap cursor-pointer transition-colors ${
              activeCategory === cat 
                ? 'bg-[#7C3AED] hover:bg-[#4F46E5] text-white border-transparent' 
                : 'border-gray-700 hover:border-[#7C3AED] bg-transparent text-gray-300'
            }`}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-48 w-full rounded-xl bg-gray-900" />
              <Skeleton className="h-6 w-3/4 bg-gray-900" />
              <Skeleton className="h-4 w-1/2 bg-gray-900" />
            </div>
          ))
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard key={(event as any).id} event={event as any} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Event tidak ditemukan</h3>
            <p className="text-gray-400">Coba gunakan kata kunci pencarian yang berbeda atau ganti kategori.</p>
          </div>
        )}
      </div>

      {!loading && filteredEvents.length > 0 && (
        <div className="mt-12 flex justify-center gap-2">
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800" disabled>Sebelumnya</Button>
          <Button variant="outline" className="border-[#7C3AED] text-[#7C3AED] bg-gray-900 hover:bg-gray-800">1</Button>
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">2</Button>
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">3</Button>
          <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">Selanjutnya</Button>
        </div>
      )}
    </div>
  );
}
