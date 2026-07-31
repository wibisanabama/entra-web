'use client';

import { useEffect, useState } from 'react';
import { EventCard } from '@/components/features/EventCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';


import { eventApi } from '@/lib/api';
import { Event, Category } from '@/types';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catRes = await eventApi.get('/api/v1/categories');
        if (catRes.data && Array.isArray(catRes.data.data)) {
          setCategories(catRes.data.data);
        }

        const endpoint = searchQuery ? `/api/v1/events/search?q=${encodeURIComponent(searchQuery)}` : `/api/v1/events?page=1&per_page=20`;
        const res = await eventApi.get(endpoint);
        if (res.data && Array.isArray(res.data.data)) {
          setEvents(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is automatically triggered by useEffect dependency on searchQuery,
    // but if we want it strictly onSubmit we can change dependency to a debounced or separate state.
    // For now, it will search on every keystroke due to `searchQuery` in dependency array.
  };

  const filteredEvents = activeCategory === 'All' 
    ? events 
    : events.filter(e => e.category_id === activeCategory);

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
            className="flex-grow bg-gray-900 text-white"
          />
          <Button type="submit" className="bg-[#7C3AED] hover:bg-[#4F46E5] text-white">
            Cari
          </Button>
        </form>
      </div>

      <div className="flex overflow-x-auto pb-4 mb-8 gap-2 no-scrollbar">
        <Badge 
          status="All"
          className={`px-4 py-2 text-sm rounded-full whitespace-nowrap cursor-pointer transition-colors ${
            activeCategory === 'All' 
              ? 'bg-[#7C3AED] text-white' 
              : 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white'
          }`}
          onClick={() => setActiveCategory('All')}
        />
        {categories.map((cat) => (
          <Badge 
            key={cat.id} 
            status={cat.name}
            className={`px-4 py-2 text-sm rounded-full whitespace-nowrap cursor-pointer transition-colors ${
              activeCategory === cat.id 
                ? 'bg-[#7C3AED] text-white' 
                : 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white'
            }`}
            onClick={() => setActiveCategory(cat.id)}
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
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            Tidak ada event yang ditemukan.
          </div>
        )}
      </div>

      {!loading && filteredEvents.length > 0 && (
        <div className="mt-12 flex justify-center gap-2">
          <Button variant="outline" className="text-white hover:bg-gray-800" disabled>Sebelumnya</Button>
          <Button variant="outline" className="] text-[#7C3AED] bg-gray-900 hover:bg-gray-800">1</Button>
          <Button variant="outline" className="text-white hover:bg-gray-800">2</Button>
          <Button variant="outline" className="text-white hover:bg-gray-800">3</Button>
          <Button variant="outline" className="text-white hover:bg-gray-800">Selanjutnya</Button>
        </div>
      )}
    </div>
  );
}
