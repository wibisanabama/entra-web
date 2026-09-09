'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ticketApi, authApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';
import { Order, Ticket, User } from '@/types';

interface OrderDetailData {
  order: Order;
  tickets?: Ticket[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [buyer, setBuyer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const orderId = String(params.id);
        // Fetch order details from ticket-service
        const res = await ticketApi.get<OrderDetailData>(`/api/v1/tickets/organizer/orders/${orderId}`);
        const data = res.data;
        if (data?.order) {
          setOrder(data.order);
          setTickets(Array.isArray(data.tickets) ? data.tickets : []);

          // Fetch buyer details from auth-service if we have the user_id
          if (data.order.user_id) {
            try {
              const userRes = await authApi.post<User[]>('/api/v1/auth/users/batch', {
                ids: [data.order.user_id]
              });
              if (Array.isArray(userRes.data) && userRes.data.length > 0) {
                setBuyer(userRes.data[0]);
              }
            } catch (e) {
              console.error('Failed to fetch buyer details', e);
            }
          }
        }
      } catch (error: unknown) {
        console.error('Failed to fetch order details', error);
        toast.error('Gagal memuat detail pesanan');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-zinc-500">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white border border-zinc-200 rounded-3xl shadow-sm">
        <p className="text-base font-semibold text-zinc-900 mb-4">Pesanan tidak ditemukan.</p>
        <button
          onClick={() => router.push('/dashboard/orders')}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-semibold bg-zinc-950 text-white hover:bg-zinc-800 transition-colors"
        >
          Kembali ke Daftar Pesanan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => router.push('/dashboard/orders')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Daftar Pesanan
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Detail Pesanan</h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">ID: {order.id}</p>
        </div>
        <div>
          <Badge status={order.status === 'PAID' || order.status === 'SUCCESS' ? 'Sukses' : order.status === 'PENDING' ? 'Pending' : 'Dibatalkan'} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">
            Informasi Pembeli
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Nama Lengkap</p>
              <p className="text-sm font-semibold text-zinc-900">{buyer?.full_name || (loading ? 'Memuat...' : `Pengguna #${order.user_id.slice(0, 8)}`)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Email</p>
              <p className="text-sm font-medium text-zinc-800">{buyer?.email || (loading ? 'Memuat...' : '-')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">User ID</p>
              <p className="text-xs font-mono text-zinc-600 bg-zinc-50 p-1.5 rounded-lg border border-zinc-100 inline-block">{order.user_id}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">
            Informasi Pembayaran
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Total Pembayaran</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-950">{formatCurrency(order.total_amount)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Tanggal Pemesanan</p>
              <p className="text-sm font-medium text-zinc-800">{new Date(order.created_at).toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Event ID</p>
              <p className="text-xs font-mono text-zinc-600 bg-zinc-50 p-1.5 rounded-lg border border-zinc-100 inline-block">{order.event_id}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">Tiket Terbit</h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            {tickets.length} Tiket
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-50/75 border-b border-zinc-200">
              <tr>
                <th scope="col" className="px-6 py-3.5">Kode Tiket</th>
                <th scope="col" className="px-6 py-3.5">Tipe Tiket ID</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tickets.length > 0 ? tickets.map((ticket, i) => (
                <tr key={i} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="px-6 py-4 font-mono font-semibold text-zinc-950">{ticket.ticket_code}</td>
                  <td className="px-6 py-4 text-xs font-mono text-zinc-500">{ticket.ticket_type_id}</td>
                  <td className="px-6 py-4"><Badge status={ticket.status} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-zinc-400 text-sm">
                    Belum ada tiket yang terbit untuk pesanan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
