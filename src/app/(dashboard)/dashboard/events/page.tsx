'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { eventApi, ticketApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Event as EventType } from '@/types';
import { Search, Plus, Ticket, Users, Edit3, Trash2 } from 'lucide-react';

export default function DashboardEventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [soldCountMap, setSoldCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventToDelete, setEventToDelete] = useState<EventType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sliding pill segmented control
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const filterTabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterIndicatorStyle, setFilterIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [isFilterReady, setIsFilterReady] = useState(false);

  useEffect(() => {
    const activeEl = filterTabsRef.current[statusFilter];
    if (activeEl) {
      setFilterIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });

      if (!isFilterReady) {
        const timer = setTimeout(() => setIsFilterReady(true), 50);
        return () => clearTimeout(timer);
      } else if (filterContainerRef.current) {
        const container = filterContainerRef.current;
        const targetScrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    }
  }, [statusFilter, events.length, isFilterReady]);

  useEffect(() => {
    const handleResize = () => {
      const activeEl = filterTabsRef.current[statusFilter];
      if (activeEl) {
        setFilterIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventApi.get<EventType[]>('/api/v1/organizer/events');
      const rawEvents = res.data && Array.isArray(res.data) ? res.data : [];
      setEvents(rawEvents);

      // Fetch real ticket sales count per event from ticket-service attendees
      const counts: Record<string, number> = {};
      await Promise.allSettled(
        rawEvents.map(async (ev) => {
          try {
            const attRes = await ticketApi.get<any[]>(`/api/v1/tickets/organizer/events/${ev.id}/attendees`);
            if (attRes.data && Array.isArray(attRes.data)) {
              counts[ev.id] = attRes.data.length;
            } else {
              counts[ev.id] = 0;
            }
          } catch {
            counts[ev.id] = 0;
          }
        })
      );
      setSoldCountMap(counts);
    } catch (error) {
      console.error('Failed to fetch events', error);
      toast.error('Gagal memuat daftar event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const publishedCount = events.filter((e) => e.status?.toLowerCase() === 'published').length;
  const draftCount = events.filter((e) => e.status?.toLowerCase() !== 'published').length;

  const filteredEvents = events.filter((event) => {
    const isPublished = event.status?.toLowerCase() === 'published';
    if (statusFilter === 'PUBLISHED' && !isPublished) return false;
    if (statusFilter === 'DRAFT' && isPublished) return false;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = event.title?.toLowerCase().includes(q);
      const matchVenue = event.venue?.name?.toLowerCase().includes(q) || event.venue?.city?.toLowerCase().includes(q);
      if (!matchTitle && !matchVenue) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-1">Manajemen Event</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Kelola semua event, tiket, dan manifest peserta yang Anda selenggarakan.</p>
        </div>
        <Link href="/dashboard/events/create">
          <Button className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold text-xs px-5 py-2.5 shadow-none border-0 flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Buat Event Baru
          </Button>
        </Link>
      </div>

      <Card className="bg-zinc-100 rounded-3xl p-6 space-y-4 border-0 shadow-none">
        {/* Controls Bar: Sliding Pill Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Control Pill */}
          <div
            ref={filterContainerRef}
            className="relative inline-flex items-center p-1 bg-zinc-200/80 rounded-full gap-1 overflow-x-auto no-scrollbar max-w-full border-0"
          >
            {/* Sliding Highlight */}
            <div
              className={`absolute top-1 bottom-1 rounded-full bg-white shadow-none pointer-events-none ${
                isFilterReady
                  ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                  : 'transition-none'
              }`}
              style={{
                left: `${filterIndicatorStyle.left}px`,
                width: `${filterIndicatorStyle.width}px`,
                opacity: filterIndicatorStyle.width > 0 ? 1 : 0,
              }}
            />

            {[
              { id: 'ALL', label: `Semua (${events.length})` },
              { id: 'PUBLISHED', label: `Terbit (${publishedCount})` },
              { id: 'DRAFT', label: `Draf (${draftCount})` },
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    filterTabsRef.current[tab.id] = el;
                  }}
                  onClick={() => setStatusFilter(tab.id as 'ALL' | 'PUBLISHED' | 'DRAFT')}
                  className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                    isSelected ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama event..."
              aria-label="Cari nama event"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border-0 shadow-none rounded-full text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-200/50">
              <tr>
                <th scope="col" className="px-5 py-3.5 rounded-l-2xl">Nama Event</th>
                <th scope="col" className="px-5 py-3.5">Tanggal</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5">Tiket Terjual</th>
                <th scope="col" className="px-5 py-3.5 text-right rounded-r-2xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-200/40">
                    <td className="px-5 py-4"><Skeleton className="h-5 w-48 bg-zinc-200 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-24 bg-zinc-200 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-20 bg-zinc-200 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-24 bg-zinc-200 rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-8 w-28 ml-auto bg-zinc-200 rounded-full" /></td>
                  </tr>
                ))
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 text-xs">
                    {searchQuery.trim() || statusFilter !== 'ALL'
                      ? 'Tidak ada event yang sesuai dengan filter atau pencarian Anda.'
                      : 'Belum ada event yang dibuat. Klik "Buat Event Baru" untuk memulai.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const isPublished = event.status?.toLowerCase() === 'published';
                  const soldCount = soldCountMap[event.id] ?? 0;

                  return (
                    <tr key={event.id} className="hover:bg-zinc-200/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-zinc-950 text-xs">{event.title}</div>
                        {event.venue?.name && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">{event.venue.name}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-zinc-500 whitespace-nowrap">
                        {new Date(event.start_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge
                          variant={isPublished ? 'success' : 'secondary'}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 shadow-none"
                        >
                          {isPublished ? 'Terbit' : 'Draf'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-zinc-950 bg-white px-3 py-1 rounded-full border-0 shadow-none inline-block">
                          {soldCount} Tiket
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1.5">
                          <Link href={`/dashboard/events/${event.id}/tickets`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs font-bold px-3.5 py-1.5 bg-white text-zinc-800 hover:bg-zinc-200 border-0 shadow-none cursor-pointer flex items-center gap-1"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              Tiket
                            </Button>
                          </Link>
                          <Link href={`/dashboard/events/${event.id}/attendees`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs font-bold px-3.5 py-1.5 bg-white text-zinc-800 hover:bg-zinc-200 border-0 shadow-none cursor-pointer flex items-center gap-1"
                            >
                              <Users className="w-3.5 h-3.5" />
                              Peserta
                            </Button>
                          </Link>
                          <Link href={`/dashboard/events/${event.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs font-bold px-3.5 py-1.5 bg-white text-zinc-800 hover:bg-zinc-200 border-0 shadow-none cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-xs font-bold px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border-0 shadow-none cursor-pointer flex items-center gap-1"
                            onClick={() => setEventToDelete(event)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        {!loading && filteredEvents.length > 0 && (
          <div className="pt-3 border-t border-zinc-200/50 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>
              Menampilkan {filteredEvents.length} dari {events.length} total event
            </span>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!eventToDelete}
        onClose={() => !isDeleting && setEventToDelete(null)}
        title="Hapus Event"
      >
        <div className="space-y-4">
          <p className="text-zinc-600 text-sm">
            Apakah Anda yakin ingin menghapus event <span className="font-bold text-zinc-950">&quot;{eventToDelete?.title}&quot;</span>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200/50">
            <Button
              variant="outline"
              onClick={() => setEventToDelete(null)}
              disabled={isDeleting}
              className="rounded-full text-xs font-bold px-5 py-2.5 border-0 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 shadow-none cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold px-5 py-2.5 border-0 shadow-none cursor-pointer"
              isLoading={isDeleting}
              onClick={async () => {
                if (!eventToDelete) return;
                try {
                  setIsDeleting(true);
                  await eventApi.del(`/api/v1/events/${eventToDelete.id}`);
                  toast.success('Event berhasil dihapus');
                  setEvents(events.filter((e) => e.id !== eventToDelete.id));
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
