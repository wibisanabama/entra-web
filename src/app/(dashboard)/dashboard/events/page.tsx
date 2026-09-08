'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { eventApi } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Event as EventType } from '@/types';

export default function DashboardEventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToDelete, setEventToDelete] = useState<EventType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await eventApi.get<EventType[]>('/api/v1/organizer/events');
        if (res.data) {
          setEvents(Array.isArray(res.data) ? res.data : []);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
        toast.error("Gagal memuat daftar event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-1">Manajemen Event</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Kelola semua event yang Anda buat.</p>
        </div>
        <Link href="/dashboard/events/create">
          <Button className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold text-xs px-5 py-2.5 shadow-sm flex items-center gap-1.5">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            Buat Event Baru
          </Button>
        </Link>
      </div>

      <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th scope="col" className="px-6 py-3.5">Nama Event</th>
                <th scope="col" className="px-6 py-3.5">Tanggal</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5">Tiket Terjual</th>
                <th scope="col" className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-100">
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-zinc-100 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto bg-zinc-100 rounded-full" /></td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-xs">
                    Belum ada event yang dibuat.
                  </td>
                </tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-950 whitespace-nowrap">
                    {event.title}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                    {new Date(event.start_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={event.status?.toLowerCase() === 'published' ? 'Published' : 'Draft'} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-500 font-medium">Tidak Tersedia</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/dashboard/events/${event.id}/tickets`}>
                        <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-3 py-1 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">
                          Tiket
                        </Button>
                      </Link>
                      <Link href={`/dashboard/events/${event.id}/attendees`}>
                        <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-3 py-1 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">
                          Peserta
                        </Button>
                      </Link>
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-3 py-1 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950">
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full text-xs font-semibold px-3 py-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setEventToDelete(event)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && events.length > 0 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">Menampilkan 1-{events.length} dari {events.length} event</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-zinc-400 rounded-full px-3 py-1 border-zinc-200" disabled>&lt;</Button>
              <Button variant="outline" size="sm" className="bg-zinc-950 text-white rounded-full px-3 py-1 border-zinc-950 font-bold">1</Button>
              <Button variant="outline" size="sm" className="text-zinc-400 rounded-full px-3 py-1 border-zinc-200" disabled>&gt;</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!eventToDelete}
        onClose={() => !isDeleting && setEventToDelete(null)}
        title="Hapus Event"
      >
        <div className="space-y-4">
          <p className="text-zinc-600 text-sm">
            Apakah Anda yakin ingin menghapus event <span className="font-bold text-zinc-950">&quot;{eventToDelete?.title}&quot;</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100">
            <Button
              variant="outline"
              onClick={() => setEventToDelete(null)}
              disabled={isDeleting}
              className="rounded-full text-xs font-semibold px-4 py-2 border-zinc-200 text-zinc-700"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold px-4 py-2"
              isLoading={isDeleting}
              onClick={async () => {
                if (!eventToDelete) return;
                try {
                  setIsDeleting(true);
                  await eventApi.del(`/api/v1/events/${eventToDelete.id}`);
                  toast.success('Event berhasil dihapus');
                  setEvents(events.filter(e => e.id !== eventToDelete.id));
                  setEventToDelete(null);
                } catch (error) {
                  console.error('Error deleting event', error);
                  toast.error('Gagal menghapus event');
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
