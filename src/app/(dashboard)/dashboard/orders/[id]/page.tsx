'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ticketApi, authApi } from '@/lib/api';
import { toast } from 'sonner';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [buyer, setBuyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        // Fetch order details from ticket-service
        const res = await ticketApi.get<any>(`/api/v1/tickets/organizer/orders/${params.id}`);
        const data = res.data;
        setOrder(data.order);
        setItems(data.items || []);
        setTickets(data.tickets || []);

        // Fetch buyer details from auth-service if we have the user_id
        if (data.order && data.order.user_id) {
          try {
            const userRes = await authApi.post<any>('/api/v1/auth/users/batch', {
              ids: [data.order.user_id]
            });
            if (userRes.data && userRes.data.length > 0) {
              setBuyer(userRes.data[0]);
            }
          } catch (e) {
            console.error('Failed to fetch buyer details', e);
          }
        }
      } catch (error: any) {
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
    return <div className="text-white text-center py-10">Memuat detail pesanan...</div>;
  }

  if (!order) {
    return <div className="text-white text-center py-10">Pesanan tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <button 
          onClick={() => router.push('/dashboard/orders')}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Daftar Pesanan
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Detail Pesanan</h1>
          <p className="text-gray-400 font-mono mt-1">ID: {order.id}</p>
        </div>
        <div>
          <Badge status={order.status === 'PAID' || order.status === 'SUCCESS' ? 'Sukses' : order.status === 'PENDING' ? 'Pending' : 'Dibatalkan'} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Informasi Pembeli</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-sm">Nama Lengkap</p>
              <p className="text-white font-medium">{buyer ? buyer.full_name : 'Memuat...'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Email</p>
              <p className="text-white font-medium">{buyer ? buyer.email : 'Memuat...'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">User ID</p>
              <p className="text-white font-medium text-xs font-mono">{order.user_id}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-gray-800 pb-2">Informasi Pembayaran</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-sm">Total Pembayaran</p>
              <p className="text-[#7C3AED] font-bold text-xl">Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Tanggal Pemesanan</p>
              <p className="text-white font-medium">{new Date(order.created_at).toLocaleString('id-ID')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Event ID</p>
              <p className="text-white font-medium text-xs font-mono">{order.event_id}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800 p-0 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Tiket Terbit</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-4">Kode Tiket</th>
                <th scope="col" className="px-6 py-4">Tipe Tiket ID</th>
                <th scope="col" className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? tickets.map((ticket, i) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-white">{ticket.ticket_code}</td>
                  <td className="px-6 py-4 text-xs font-mono">{ticket.ticket_type_id}</td>
                  <td className="px-6 py-4"><Badge status={ticket.status} /></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    Belum ada tiket yang terbit untuk pesanan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
