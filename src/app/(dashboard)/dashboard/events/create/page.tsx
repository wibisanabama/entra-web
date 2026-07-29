'use client';

import { useRouter } from 'next/navigation';
import { EventForm } from '@/components/features/EventForm';

export default function CreateEventPage() {
  const router = useRouter();

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      // Simulate API call
      console.log('Creating event:', data);
      await new Promise(r => setTimeout(r, 1000));
      router.push('/dashboard/events');
    } catch (error) {
      console.error('Error creating event', error);
      alert('Gagal membuat event');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Buat Event Baru</h1>
        <p className="text-gray-400">Isi detail di bawah ini untuk membuat event baru dan mulai menjual tiket.</p>
      </div>

      <EventForm onSubmit={handleSubmit} />
    </div>
  );
}
