'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ticketApi } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await ticketApi.get('/api/v1/tickets/organizer/orders');
        if (res.data) {
          setOrders(res.data as any);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
        toast.error("Gagal memuat daftar pesanan");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manajemen Pesanan</h1>
        <p className="text-gray-400">Daftar transaksi pembelian tiket untuk event Anda.</p>
      </div>

      <Card className="bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4">Order ID</th>
                <th scope="col" className="px-6 py-4">Event</th>
                <th scope="col" className="px-6 py-4">Total</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Tanggal</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32 bg-gray-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-40 bg-gray-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 bg-gray-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-gray-800" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 bg-gray-800" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto bg-gray-800" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada pesanan yang masuk.
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-0">
                  <td className="px-6 py-4 font-mono font-medium text-white">
                    {order.id.substring(0, 8).toUpperCase()}...
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {order.event_id ? `Event ID: ${order.event_id.substring(0, 8)}...` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    Rp {Number(order.total_amount).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={order.status === 'PAID' || order.status === 'SUCCESS' ? 'Sukses' : order.status === 'PENDING' ? 'Pending' : 'Dibatalkan'} />
                  </td>
                  <td className="px-6 py-4">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="text-white hover:bg-gray-800">Detail</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
