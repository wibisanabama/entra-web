'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ticketApi, authApi, eventApi } from '@/lib/api';
import { exportAttendeesToCsv } from '@/lib/export-csv';
import { toast } from 'sonner';
import {
  Download,
  Search,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
  Ticket as TicketIcon
} from 'lucide-react';

import { Event as EventType, Ticket, User } from '@/types';

export default function AttendeeListPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventType | null>(null);
  const [attendees, setAttendees] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HADIR' | 'BELUM'>('ALL');

  const fetchAttendees = useCallback(async () => {
    if (!params.id) return;
    try {
      const eventId = String(params.id);
      // Fetch event details
      const eventRes = await eventApi.get<EventType>(`/api/v1/events/${eventId}`);
      if (eventRes.data) {
        setEvent(eventRes.data);
      }

      // Fetch tickets (attendees) for this event
      const ticketRes = await ticketApi.get<Ticket[]>(`/api/v1/tickets/organizer/events/${eventId}/attendees`);
      const tickets = Array.isArray(ticketRes.data) ? ticketRes.data : [];
      setAttendees(tickets);

      // Extract unique user IDs
      const userIds = [...new Set(tickets.map((t) => t.user_id))];
      
      if (userIds.length > 0) {
        try {
          // Fetch user details in batch
          const usersRes = await authApi.post<User[]>('/api/v1/auth/users/batch', {
            ids: userIds
          });
          
          // Map users for easy lookup O(1)
          const userMap: Record<string, User> = {};
          if (Array.isArray(usersRes.data)) {
            usersRes.data.forEach((u) => {
              userMap[u.id] = u;
            });
          }
          setUsers(userMap);
        } catch (e) {
          console.error('Failed to fetch user details', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch attendees', error);
      toast.error('Gagal memuat daftar peserta');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchAttendees();
    }
  }, [params.id, fetchAttendees]);

  const handleExportCsv = () => {
    if (attendees.length === 0) {
      toast.info('Belum ada data peserta untuk diekspor.');
      return;
    }

    try {
      exportAttendeesToCsv(event?.title || 'Event', attendees, users);
      toast.success('Manifest peserta berhasil diekspor ke CSV!');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Gagal mengekspor data peserta ke CSV.');
    }
  };

  // Filter attendees
  const filteredAttendees = attendees.filter((t) => {
    const user = users[t.user_id];
    const isUsed = t.status?.toUpperCase() === 'USED' || t.status?.toUpperCase() === 'CHECKED_IN';

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'HADIR' && isUsed) ||
      (statusFilter === 'BELUM' && !isUsed);

    const matchesSearch =
      searchQuery === '' ||
      t.ticket_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const checkedInCount = attendees.filter(
    (t) => t.status?.toUpperCase() === 'USED' || t.status?.toUpperCase() === 'CHECKED_IN'
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => router.push('/dashboard/events')}
          className="text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Event
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TicketIcon className="h-4 w-4 text-zinc-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Manifest Kehadiran Event
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">Daftar Hadir (Attendee List)</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Event: <strong className="text-zinc-950 font-bold">{event?.title || 'Memuat...'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchAttendees}
            disabled={loading}
            className="rounded-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 text-xs font-bold px-4 py-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCsv}
            disabled={attendees.length === 0}
            className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 text-xs font-bold px-5 py-2 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor Manifest (CSV)
          </Button>
        </div>
      </div>

      {/* 3 Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Peserta</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1 bg-zinc-100 rounded-lg" />
              ) : (
                <p className="text-2xl font-black text-zinc-950 mt-1 tracking-tight">{attendees.length}</p>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Tiket diterbitkan</p>
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Sudah Hadir (Gate In)</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1 bg-zinc-100 rounded-lg" />
              ) : (
                <p className="text-2xl font-black text-emerald-600 mt-1 tracking-tight">{checkedInCount}</p>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Check-in terverifikasi</p>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Belum Hadir</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1 bg-zinc-100 rounded-lg" />
              ) : (
                <p className="text-2xl font-black text-amber-600 mt-1 tracking-tight">
                  {attendees.length - checkedInCount}
                </p>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Menunggu scan di gate</p>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card with Search & Filters */}
      <Card className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-zinc-100 p-1 rounded-full border border-zinc-200 text-xs w-fit">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Semua ({attendees.length})
            </button>
            <button
              onClick={() => setStatusFilter('HADIR')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                statusFilter === 'HADIR' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Hadir ({checkedInCount})
            </button>
            <button
              onClick={() => setStatusFilter('BELUM')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                statusFilter === 'BELUM' ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Belum Hadir ({attendees.length - checkedInCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama, email, kode tiket..."
              aria-label="Cari nama, email, atau kode tiket peserta"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Table */}
        {attendees.length === 0 && !loading ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-base font-bold text-zinc-950 mb-1">Belum ada peserta</h3>
            <p className="text-zinc-400 text-xs">Belum ada tiket yang diterbitkan untuk event ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Informasi Peserta</th>
                  <th scope="col" className="px-4 py-3.5">Kode Tiket</th>
                  <th scope="col" className="px-4 py-3.5">Status Kehadiran</th>
                  <th scope="col" className="px-4 py-3.5">Diterbitkan Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAttendees.map((ticket, i) => {
                  const user = users[ticket.user_id];
                  const isUsed = ticket.status?.toUpperCase() === 'USED' || ticket.status?.toUpperCase() === 'CHECKED_IN';

                  return (
                    <tr key={i} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-zinc-950 text-xs mb-0.5">{user ? user.full_name : 'Pengunjung'}</div>
                        <div className="text-zinc-400 text-[11px]">{user ? user.email : ticket.user_id.substring(0,8)+'...'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-zinc-900 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200 inline-block font-bold">
                          {ticket.ticket_code}
                        </div>
                        <div className="text-zinc-400 text-[10px] mt-0.5 font-mono">
                          ID: {ticket.ticket_type_id.substring(0,8)}...
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={isUsed ? 'success' : 'warning'}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        >
                          {isUsed ? 'HADIR' : 'BELUM HADIR'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500 text-xs">
                        {new Date(ticket.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

