'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TicketTypeModal } from '@/components/features/TicketTypeModal';
import { TicketType, Event } from '@/types';
import { eventApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/toast';

export default function EventTicketsPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  const fetchEventAndTickets = useCallback(async () => {
    if (!params.id) return;
    try {
      const eventId = String(params.id);
      const [eventRes, ticketsRes] = await Promise.all([
        eventApi.get<Event>(`/api/v1/events/${eventId}`),
        eventApi.get<TicketType[]>(`/api/v1/events/${eventId}/tickets`)
      ]);
      if (eventRes.data) {
        setEvent(eventRes.data);
      }
      setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
    } catch (error) {
      console.error('Error fetching tickets', error);
      toast.error('Gagal memuat data tiket');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchEventAndTickets();
    }
  }, [params.id, fetchEventAndTickets]);

  const handleCreateOrUpdate = async (
    data: Omit<TicketType, 'id' | 'event_id' | 'sold' | 'created_at' | 'updated_at' | 'is_active'>
  ) => {
    try {
      setIsSubmitting(true);
      const eventId = String(params.id);
      if (selectedTicket) {
        await eventApi.put(`/api/v1/events/${eventId}/tickets/${selectedTicket.id}`, data);
        toast.success('Tipe tiket berhasil diperbarui!');
      } else {
        await eventApi.post(`/api/v1/events/${eventId}/tickets`, data);
        toast.success('Tipe tiket berhasil ditambahkan!');
      }
      fetchEventAndTickets();
    } catch (error) {
      console.error('Failed to save ticket type', error);
      toast.error('Gagal menyimpan tipe tiket');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!ticketToDelete) return;
    
    try {
      await eventApi.del(`/api/v1/events/${params.id}/tickets/${ticketToDelete}`);
      toast.success('Tipe tiket berhasil dihapus');
      fetchEventAndTickets();
    } catch (error) {
      console.error('Failed to delete ticket', error);
      toast.error('Gagal menghapus tipe tiket');
    } finally {
      setTicketToDelete(null);
    }
  };

  if (loading && !event) {
    return <div className="text-zinc-500 text-center py-10 text-sm font-medium">Memuat data tiket...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => router.push('/dashboard/events')}
              className="text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Kembali ke Event
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">Manajemen Tiket</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Kelola tipe tiket untuk event <strong className="text-zinc-950 font-bold">{event?.title}</strong></p>
        </div>
        <Button 
          variant="primary" 
          className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold text-xs px-5 py-2.5 shadow-none flex items-center gap-2"
          onClick={() => {
            setSelectedTicket(undefined);
            setIsModalOpen(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buat Tiket Baru
        </Button>
      </div>

      <Card className="bg-zinc-100 rounded-3xl overflow-hidden border-0 shadow-none">
        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mx-auto mb-4 text-zinc-900 border-0 shadow-none">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-950 mb-1">Belum ada tipe tiket</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">Anda belum membuat tipe tiket apapun untuk event ini. Silakan buat minimal satu tipe tiket agar event dapat dipesan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-200/50">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Nama Tiket</th>
                  <th scope="col" className="px-6 py-3.5">Harga</th>
                  <th scope="col" className="px-6 py-3.5">Terjual / Kuota</th>
                  <th scope="col" className="px-6 py-3.5">Jadwal Penjualan</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50">
                {tickets.map((ticket) => {
                  const saleStart = new Date(ticket.sale_start);
                  const saleEnd = new Date(ticket.sale_end);
                  const now = new Date();
                  
                  let statusStr = "Dijual";
                  if (now < saleStart) statusStr = "Segera Hadir";
                  else if (now > saleEnd) statusStr = "Berakhir";
                  else if (ticket.sold >= ticket.quantity) statusStr = "Habis";

                  return (
                    <tr key={ticket.id} className="hover:bg-zinc-200/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-950 text-sm mb-1">{ticket.name}</div>
                        <Badge status={statusStr} />
                      </td>
                      <td className="px-6 py-4 text-zinc-950 font-black text-xs">
                        {parseFloat(ticket.price) > 0 ? formatCurrency(parseFloat(ticket.price)) : 'Gratis'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-950 text-xs">{ticket.sold}</span>
                          <span className="text-zinc-400 text-xs">/ {ticket.quantity}</span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className="bg-zinc-950 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (ticket.sold / ticket.quantity) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        <div><span className="text-zinc-400 font-medium">Mulai:</span> <span className="text-zinc-700 font-semibold">{saleStart.toLocaleDateString('id-ID')} {saleStart.getHours()}:{saleStart.getMinutes().toString().padStart(2, '0')}</span></div>
                        <div className="mt-1"><span className="text-zinc-400 font-medium">Akhir:</span> <span className="text-zinc-700 font-semibold">{saleEnd.toLocaleDateString('id-ID')} {saleEnd.getHours()}:{saleEnd.getMinutes().toString().padStart(2, '0')}</span></div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full text-xs font-semibold px-3.5 py-1.5 bg-white text-zinc-800 hover:bg-zinc-200 border-0 shadow-none cursor-pointer"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full text-xs font-semibold px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border-0 shadow-none cursor-pointer disabled:opacity-50"
                          onClick={() => confirmDelete(ticket.id)}
                          disabled={ticket.sold > 0}
                        >
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <TicketTypeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedTicket}
        isLoading={isSubmitting}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Tipe Tiket"
        message="Apakah Anda yakin ingin menghapus tipe tiket ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus Tiket"
      />
    </div>
  );
}
