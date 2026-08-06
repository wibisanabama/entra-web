'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { eventApi } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await eventApi.get('/api/v1/organizer/events');
        if (res.data?.data) {
          setEvents(res.data.data);
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
          <h1 className="text-3xl font-bold text-white mb-2">Manajemen Event</h1>
          <p className="text-gray-400">Kelola semua event yang Anda buat.</p>
        </div>
        <Link href="/dashboard/events/create">
          <Button className="bg-[#7C3AED] hover:bg-[#4F46E5] text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Buat Event Baru
          </Button>
        </Link>
      </div>

      <Card className="bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nama Event</th>
                <th scope="col" className="px-6 py-4">Tanggal</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Tiket Terjual</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="px-6 py-4"><Skeleton className="h-6 w-48 bg-gray-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 bg-gray-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-gray-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 bg-gray-800" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto bg-gray-800" /></td>
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Belum ada event yang dibuat.
                  </td>
                </tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {event.title}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(event.start_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={event.status === 'PUBLISHED' ? 'Published' : 'Draft'} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">Tidak Tersedia</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm" className="text-white hover:bg-gray-800 hover:text-[#7C3AED]">
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-white hover:bg-red-500/10 hover:text-red-500"
                        onClick={async () => {
                          if (window.confirm('Yakin ingin menghapus event ini?')) {
                            try {
                              await eventApi.delete(`/api/v1/events/${event.id}`);
                              toast.success('Event berhasil dihapus');
                              // Trigger reload
                              setEvents(events.filter(e => e.id !== event.id));
                            } catch (error) {
                              console.error('Error deleting event', error);
                              toast.error('Gagal menghapus event');
                            }
                          }
                        }}
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
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm text-gray-400">Menampilkan 1-{events.length} dari {events.length} event</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-gray-400 px-2 py-1" disabled>&lt;</Button>
              <Button variant="outline" size="sm" className="] bg-gray-800 text-[#7C3AED] px-3 py-1">1</Button>
              <Button variant="outline" size="sm" className="text-gray-400 px-2 py-1" disabled>&gt;</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
