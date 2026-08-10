'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ticketApi, authApi, eventApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AttendeeListPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    if (params.id) {
      fetchAttendees();
    }
  }, [params.id]);

  if (loading && !event) {
    return <div className="text-white text-center py-10">Memuat daftar peserta...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => router.push('/dashboard/events')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Daftar Event
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Daftar Hadir (Attendee List)</h1>
          <p className="text-gray-400 mt-1">Event: <strong className="text-white">{event?.title || 'Memuat...'}</strong></p>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Total Peserta</p>
          <p className="text-white font-bold text-xl">{attendees.length}</p>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800 p-0 overflow-hidden">
        {attendees.length === 0 && !loading ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">Belum ada peserta</h3>
            <p className="text-gray-400">Belum ada tiket yang diterbitkan untuk event ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">Informasi Peserta</th>
                  <th scope="col" className="px-6 py-4">Kode Tiket</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 rounded-tr-lg">Diterbitkan Pada</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((ticket, i) => {
                  const user = users[ticket.user_id];
                  return (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white mb-1">{user ? user.full_name : 'Memuat...'}</div>
                        <div className="text-gray-500 text-xs">{user ? user.email : ticket.user_id.substring(0,8)+'...'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-white bg-gray-800 px-2 py-1 rounded inline-block">{ticket.ticket_code}</div>
                        <div className="text-gray-500 text-xs mt-1">Tipe: {ticket.ticket_type_id.substring(0,8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(ticket.created_at).toLocaleString('id-ID')}
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
