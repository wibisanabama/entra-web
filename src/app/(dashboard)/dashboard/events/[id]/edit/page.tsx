'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EventForm } from '@/components/features/EventForm';
import { Event } from '@/types';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const [initialData, setInitialData] = useState<Event | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing event
    const fetchEvent = async () => {
      try {
        await new Promise(r => setTimeout(r, 800));
        setInitialData({
          title: 'Music Festival 2024',
          description: 'Festival musik terbesar...',
          start_date: '2024-10-12',
          end_date: '2024-10-12',
          venue_id: '',
          category_id: '',
          banner_url: '',
        } as Event);
      } catch (error) {
        console.error('Error fetching event', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchEvent();
  }, [params.id]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      // Simulate API call
      console.log('Updating event:', params.id, data);
      await new Promise(r => setTimeout(r, 1000));
      router.push('/dashboard/events');
    } catch (error) {
      console.error('Error updating event', error);
      alert('Gagal memperbarui event');
    }
  };

  if (loading) {
    return <div className="text-white">Memuat data event...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Edit Event</h1>
        <p className="text-gray-400">Perbarui detail event Anda.</p>
      </div>

      <EventForm initialData={initialData} onSubmit={handleSubmit} onCancel={() => router.push('/dashboard/events')} />
    </div>
  );
}
