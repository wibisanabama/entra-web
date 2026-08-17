'use client';

import { useEffect, useState } from 'react';
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

export default function AttendeeListPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HADIR' | 'BELUM'>('ALL');

  const fetchAttendees = async () => {
    try {
      setLoading(true);
      // Fetch event details
      const eventRes = await eventApi.get<any>(`/api/v1/events/${params.id}`);
      setEvent(eventRes.data);

      // Fetch tickets (attendees) for this event
      const ticketRes = await ticketApi.get<any>(`/api/v1/tickets/organizer/events/${params.id}/attendees`);
      const tickets = ticketRes.data || [];
      setAttendees(tickets);

      // Extract unique user IDs
      const userIds = [...new Set(tickets.map((t: any) => t.user_id))];
      
      if (userIds.length > 0) {
        try {
          // Fetch user details in batch
          const usersRes = await authApi.post<any>('/api/v1/auth/users/batch', {
            ids: userIds
          });
          
          // Map users for easy lookup O(1)
          const userMap: Record<string, any> = {};
          if (usersRes.data) {
            usersRes.data.forEach((u: any) => {
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
  };

  useEffect(() => {
    if (params.id) {
      fetchAttendees();
    }
  }, [params.id]);

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
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Event
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TicketIcon className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Manifest Kehadiran Event
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Daftar Hadir (Attendee List)</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Event: <strong className="text-white">{event?.title || 'Memuat...'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchAttendees}
            disabled={loading}
            className="flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCsv}
            disabled={attendees.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
            Ekspor Manifest (CSV)
          </Button>
        </div>
      </div>

      {/* 3 Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase">Total Peserta</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white mt-1">{attendees.length}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Tiket diterbitkan</p>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-400 font-semibold uppercase">Sudah Hadir (Gate In)</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-emerald-400 mt-1">{checkedInCount}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Check-in terverifikasi</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-400 font-medium uppercase">Belum Hadir</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {attendees.length - checkedInCount}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Menunggu scan di gate</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card with Search & Filters */}
      <Card className="bg-gray-900 border-gray-800 p-5 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs w-fit">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ALL' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Semua ({attendees.length})
            </button>
            <button
              onClick={() => setStatusFilter('HADIR')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'HADIR' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Hadir ({checkedInCount})
            </button>
            <button
              onClick={() => setStatusFilter('BELUM')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'BELUM' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Belum Hadir ({attendees.length - checkedInCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Cari nama, email, kode tiket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Table */}
        {attendees.length === 0 && !loading ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Belum ada peserta</h3>
            <p className="text-gray-400 text-sm">Belum ada tiket yang diterbitkan untuk event ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-950/70 border-b border-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Informasi Peserta</th>
                  <th scope="col" className="px-4 py-3.5">Kode Tiket</th>
                  <th scope="col" className="px-4 py-3.5">Status Kehadiran</th>
                  <th scope="col" className="px-4 py-3.5">Diterbitkan Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredAttendees.map((ticket, i) => {
                  const user = users[ticket.user_id];
                  const isUsed = ticket.status?.toUpperCase() === 'USED' || ticket.status?.toUpperCase() === 'CHECKED_IN';

                  return (
                    <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white mb-0.5">{user ? user.full_name : 'Pengunjung'}</div>
                        <div className="text-gray-500 text-xs">{user ? user.email : ticket.user_id.substring(0,8)+'...'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs text-violet-400 bg-gray-950 px-2 py-1 rounded border border-gray-800 inline-block font-bold">
                          {ticket.ticket_code}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-0.5 font-mono">
                          ID: {ticket.ticket_type_id.substring(0,8)}...
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={isUsed ? 'success' : 'warning'}
                          className="text-xs"
                        >
                          {isUsed ? 'HADIR' : 'BELUM HADIR'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-gray-300 text-xs">
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

