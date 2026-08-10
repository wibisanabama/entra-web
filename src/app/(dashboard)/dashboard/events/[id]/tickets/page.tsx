'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { TicketTypeModal } from '@/components/features/TicketTypeModal';
import { TicketType, Event } from '@/types';
import { eventApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

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

  const fetchEventAndTickets = async () => {
    try {
      setLoading(true);
      const [eventRes, ticketsRes] = await Promise.all([
        eventApi.get(`/api/v1/events/${params.id}`),
        eventApi.get(`/api/v1/events/${params.id}/tickets`)
      ]);
      setEvent(eventRes.data as Event);
      setTickets((ticketsRes.data as TicketType[]) || []);
    } catch (error) {
      console.error('Error fetching tickets', error);
      toast.error('Gagal memuat data tiket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchEventAndTickets();
    }
  }, [params.id]);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (selectedTicket) {
        await eventApi.put(`/api/v1/events/${params.id}/tickets/${selectedTicket.id}`, data);
        toast.success('Tipe tiket berhasil diperbarui!');
      } else {
        await eventApi.post(`/api/v1/events/${params.id}/tickets`, data);
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
    return <div className="text-white text-center py-10">Memuat data tiket...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => router.push('/dashboard/events')}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Kembali ke Event
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white">Manajemen Tiket</h1>
          <p className="text-gray-400">Kelola tipe tiket untuk event <strong className="text-white">{event?.title}</strong></p>
        </div>
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => {
            setSelectedTicket(undefined);
            setIsModalOpen(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buat Tiket Baru
        </Button>
      </div>

      <Card className="bg-gray-900 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">Belum ada tipe tiket</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">Anda belum membuat tipe tiket apapun untuk event ini. Silakan buat minimal satu tipe tiket agar event Anda dapat dipesan.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedTicket(undefined);
                setIsModalOpen(true);
              }}
            >
              Buat Tiket Pertama
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">Nama Tiket</th>
                  <th scope="col" className="px-6 py-4">Harga</th>
                  <th scope="col" className="px-6 py-4">Terjual / Kuota</th>
                  <th scope="col" className="px-6 py-4">Jadwal Penjualan</th>
                  <th scope="col" className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const saleStart = new Date(ticket.sale_start);
                  const saleEnd = new Date(ticket.sale_end);
                  const now = new Date();
                  
                  let statusStr = "Dijual";
                  if (now < saleStart) statusStr = "Segera Hadir";
                  else if (now > saleEnd) statusStr = "Berakhir";
                  else if (ticket.sold >= ticket.quantity) statusStr = "Habis";

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white mb-1">{ticket.name}</div>
                        <Badge status={statusStr} />
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {parseFloat(ticket.price) > 0 ? formatCurrency(parseFloat(ticket.price)) : 'Gratis'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{ticket.sold}</span>
                          <span className="text-gray-500">/ {ticket.quantity}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className="bg-[#7C3AED] h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (ticket.sold / ticket.quantity) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div><span className="text-gray-500">Mulai:</span> <span className="text-gray-300">{saleStart.toLocaleDateString('id-ID')} {saleStart.getHours()}:{saleStart.getMinutes().toString().padStart(2, '0')}</span></div>
                        <div className="mt-1"><span className="text-gray-500">Akhir:</span> <span className="text-gray-300">{saleEnd.toLocaleDateString('id-ID')} {saleEnd.getHours()}:{saleEnd.getMinutes().toString().padStart(2, '0')}</span></div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-gray-700 text-xs px-3"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="hover:bg-red-900/30 text-red-400 border-red-900/50 text-xs px-3"
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
