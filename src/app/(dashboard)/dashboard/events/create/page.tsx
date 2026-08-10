'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventForm } from '@/components/features/EventForm';
import { eventApi } from '@/lib/api';
import { toast } from 'sonner';

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);
      
      // Send formatting specific to backend request
      const payload = {
        title: data.title,
        description: data.description,
        start_date: new Date(data.start_date as string).toISOString(),
        end_date: new Date(data.end_date as string).toISOString(),
        venue_id: data.venue_id,
        category_id: data.category_id,
        banner_url: data.banner_url || '',
        is_online: data.is_online,
        online_url: data.online_url || '',
        max_attendees: data.max_attendees,
        status: data.status,
      };

      await eventApi.post('/api/v1/events', payload);
      
      toast.success('Event berhasil dibuat!');
      router.push('/dashboard/events');
    } catch (error) {
      console.error('Error creating event', error);
      toast.error('Gagal membuat event. Pastikan semua field terisi dengan benar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Buat Event Baru</h1>
        <p className="text-gray-400">Isi detail di bawah ini untuk membuat event baru dan mulai menjual tiket.</p>
      </div>

      <EventForm 
        onSubmit={handleSubmit} 
        onCancel={() => router.push('/dashboard/events')}
        isLoading={isSubmitting} 
      />
    </div>
  );
}
