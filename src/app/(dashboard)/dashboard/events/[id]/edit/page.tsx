'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EventForm } from '@/components/features/EventForm';
import { Event } from '@/types';
import { eventApi } from '@/lib/api';
import { toast } from 'sonner';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const [initialData, setInitialData] = useState<Event | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch existing event
    const fetchEvent = async () => {
      try {
        const res = await eventApi.get(`/api/v1/events/${params.id}`);
        if (res.data?.data) {
          // Format date for datetime-local input (YYYY-MM-DDThh:mm)
          const data = res.data.data;
          
          const formatDate = (dateString: string) => {
            if (!dateString) return '';
            const d = new Date(dateString);
            return d.toISOString().slice(0, 16); // Extract YYYY-MM-DDThh:mm
          };

          setInitialData({
            ...data,
            start_date: formatDate(data.start_date),
            end_date: formatDate(data.end_date),
          });
        }
      } catch (error) {
        console.error('Error fetching event', error);
        toast.error('Gagal memuat data event');
        router.push('/dashboard/events');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchEvent();
  }, [params.id, router]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      setIsSubmitting(true);
      
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
      };

      await eventApi.put(`/api/v1/events/${params.id}`, payload);
      
      toast.success('Event berhasil diperbarui!');
      router.push('/dashboard/events');
    } catch (error) {
      console.error('Error updating event', error);
      toast.error('Gagal memperbarui event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center py-10">Memuat data event...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Edit Event</h1>
        <p className="text-gray-400">Perbarui detail event Anda.</p>
      </div>

      <EventForm 
        initialData={initialData} 
        onSubmit={handleSubmit} 
        onCancel={() => router.push('/dashboard/events')} 
        isLoading={isSubmitting}
      />
    </div>
  );
}
