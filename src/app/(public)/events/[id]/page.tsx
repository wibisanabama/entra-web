'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { TicketSelector } from '@/components/features/TicketSelector';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface EventDetail {
  id: string | string[];
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  category: string;
  organizer: string;
  tickets: Array<{
    id: string;
    name: string;
    price: number;
    quota: number;
    available: number;
  }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // Placeholder
        await new Promise(r => setTimeout(r, 800));
        setEvent({
          id: (params.id as string) || '',
          title: 'Music Festival 2024: A Journey Through Sound',
          description: 'Bergabunglah dalam festival musik terbesar tahun ini yang menampilkan lebih dari 50 artis lokal dan internasional. Nikmati pengalaman tak terlupakan dengan tata suara dan cahaya spektakuler di tiga panggung berbeda.',
          date: '12 Oktober 2024',
          time: '15:00 - 23:00 WIB',
          venue: 'Gelora Bung Karno Stadium, Jakarta',
          image: 'https://placehold.co/1200x500/1e1e1e/8a2be2',
          category: 'Music',
          organizer: 'Entra Live',
          tickets: [
            { id: 't1', name: 'Early Bird - Festival', price: 250000, quota: 100, available: 0 },
            { id: 't2', name: 'Presale - Festival', price: 350000, quota: 500, available: 120 },
            { id: 't3', name: 'VIP', price: 850000, quota: 200, available: 50 },
          ]
        });
      } catch (error) {
        console.error('Error fetching event details', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="w-full h-[400px] rounded-2xl bg-gray-900 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="w-24 h-8 rounded-full bg-gray-900" />
            <Skeleton className="w-3/4 h-12 bg-gray-900" />
            <Skeleton className="w-full h-32 bg-gray-900 mt-6" />
          </div>
          <div>
            <Skeleton className="w-full h-80 rounded-xl bg-gray-900" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) return <div className="text-center py-20 text-white">Event tidak ditemukan.</div>;

  return (
    <div className="bg-gray-950 pb-20">
      {/* Banner */}
      <div className="w-full h-[300px] md:h-[500px] relative">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-800 shadow-xl">
              <Badge status={event.category} className="bg-[#7C3AED] hover:bg-[#4F46E5] text-white mb-4" />
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{event.title}</h1>
              
              <div className="flex flex-col sm:flex-row gap-6 mt-8 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-gray-800 rounded-lg text-[#7C3AED]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Tanggal & Waktu</p>
                    <p>{event.date}</p>
                    <p className="text-sm">{event.time}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-gray-800 rounded-lg text-[#7C3AED]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Lokasi</p>
                    <p>{event.venue}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-4">Deskripsi Event</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>{event.description}</p>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-800">
                <h3 className="text-lg font-bold text-white mb-2">Diselenggarakan oleh</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center font-bold text-xl text-[#7C3AED]">
                    {event.organizer.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-200">{event.organizer}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-[#4F46E5]/20 to-[#7C3AED]/20 border-b border-gray-800">
                  <h3 className="text-xl font-bold text-white">Pilih Tiket</h3>
                </div>
                <div className="p-6">
                  <TicketSelector 
                    ticketTypes={event.tickets as any} 
                    onSelect={(selected) => console.log('Selected:', selected)} 
                  />
                </div>
              </Card>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
