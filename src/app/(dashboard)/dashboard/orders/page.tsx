'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ticketApi, eventApi } from '@/lib/api';
import { exportOrdersToCsv } from '@/lib/export-csv';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Download,
  Search,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Clock,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchOrdersAndEvents = async () => {
    try {
      setLoading(true);
      const [ordersRes, eventsRes] = await Promise.all([
        ticketApi.get('/api/v1/tickets/organizer/orders').catch(() => ({ data: [] })),
        eventApi.get('/api/v1/events').catch(() => ({ data: [] })),
      ]);

      const rawOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const rawEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];

      // Map event names
      const evMap: Record<string, string> = {};
      rawEvents.forEach((ev: any) => {
        evMap[ev.id] = ev.title;
      });

      setOrders(rawOrders);
      setEventsMap(evMap);
    } catch (error) {
      console.error('Failed to fetch orders', error);
      toast.error('Gagal memuat daftar pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndEvents();
  }, []);

  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.info('Belum ada data pesanan untuk diekspor.');
      return;
    }

    try {
      exportOrdersToCsv(orders, eventsMap);
      toast.success('Rekapitulasi pesanan berhasil diekspor ke CSV!');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Gagal mengekspor pesanan ke CSV.');
    }
  };

  const parseAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    return parseFloat(val) || 0;
  };

  // Metrics
  const paidOrders = orders.filter((o) => o.status?.toUpperCase() === 'PAID' || o.status?.toUpperCase() === 'SUCCESS');
  const pendingOrders = orders.filter((o) => o.status?.toUpperCase() === 'PENDING');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + parseAmount(o.total_amount), 0);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const isPaid = order.status?.toUpperCase() === 'PAID' || order.status?.toUpperCase() === 'SUCCESS';
    const isPending = order.status?.toUpperCase() === 'PENDING';

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && isPaid) ||
      (statusFilter === 'PENDING' && isPending) ||
      (statusFilter === 'CANCELLED' && !isPaid && !isPending);

    const eventTitle = eventsMap[order.event_id] || '';
    const matchesSearch =
      searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.event_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eventTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              Transaction Ledger
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Manajemen Pesanan</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Pantau seluruh riwayat transaksi tiket masuk, verifikasi status pembayaran, dan ekspor laporan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchOrdersAndEvents}
            disabled={loading}
            className="flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCsv}
            disabled={orders.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
            Ekspor Rekap (CSV)
          </Button>
        </div>
      </div>

      {/* 3 Summary Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-violet-950/60 via-gray-900 to-gray-900 border-violet-500/30 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-violet-400 font-semibold uppercase">Total Omset Pesanan</p>
              {loading ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{paidOrders.length} transaksi lunas</p>
            </div>
            <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-400 font-semibold uppercase">Pesanan Lunas (PAID)</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-emerald-400 mt-1">{paidOrders.length}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Pembayaran terverifikasi</p>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-400 font-medium uppercase">Menunggu Pembayaran</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-amber-400 mt-1">{pendingOrders.length}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">Pending checkout</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card with Search & Filters */}
      <Card className="bg-gray-900 border-gray-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs w-fit">
            {[
              { id: 'ALL', label: `Semua (${orders.length})` },
              { id: 'PAID', label: `Lunas (${paidOrders.length})` },
              { id: 'PENDING', label: `Menunggu (${pendingOrders.length})` },
              { id: 'CANCELLED', label: 'Batal' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === tab.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Cari ID pesanan, nama event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Table */}
        {orders.length === 0 && !loading ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Belum ada pesanan</h3>
            <p className="text-gray-400 text-sm">Belum ada pesanan tiket yang masuk untuk event Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-950/70 border-b border-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Order ID</th>
                  <th scope="col" className="px-4 py-3.5">Event</th>
                  <th scope="col" className="px-4 py-3.5">Total Tagihan</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">Waktu Transaksi</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-28 bg-gray-800" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-36 bg-gray-800" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 bg-gray-800" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 bg-gray-800" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 bg-gray-800" /></td>
                      <td className="px-4 py-3.5 text-right"><Skeleton className="h-7 w-16 ml-auto bg-gray-800" /></td>
                    </tr>
                  ))
                ) : filteredOrders.map((order) => {
                  const isPaid = order.status?.toUpperCase() === 'PAID' || order.status?.toUpperCase() === 'SUCCESS';
                  const isPending = order.status?.toUpperCase() === 'PENDING';
                  const eventName = eventsMap[order.event_id];

                  return (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-white text-xs">
                        {order.id.substring(0, 8).toUpperCase()}...
                      </td>
                      <td className="px-4 py-3.5 text-white font-medium text-xs max-w-xs truncate">
                        {eventName || (order.event_id ? `Event #${order.event_id.substring(0, 8)}` : '-')}
                      </td>
                      <td className="px-4 py-3.5 text-white font-bold text-sm">
                        {formatCurrency(parseAmount(order.total_amount))}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={isPaid ? 'success' : isPending ? 'warning' : 'error'}
                          className="text-xs"
                        >
                          {isPaid ? 'LUNAS' : isPending ? 'MENUNGGU' : 'DIBATALKAN'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-gray-300 text-xs">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="text-white hover:bg-gray-800 text-xs py-1 px-2.5 h-8">
                            Detail
                          </Button>
                        </Link>
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

