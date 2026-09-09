'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ticketApi, eventApi } from '@/lib/api';
import { exportOrdersToCsv } from '@/lib/export-csv';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  Download,
  Search,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { Order, Event as EventType } from '@/types';

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchOrdersAndEvents = useCallback(async () => {
    try {
      const [ordersRes, eventsRes] = await Promise.all([
        ticketApi.get<Order[]>('/api/v1/tickets/organizer/orders').catch(() => ({ success: false, data: [] as Order[] })),
        eventApi.get<EventType[]>('/api/v1/events').catch(() => ({ success: false, data: [] as EventType[] })),
      ]);

      const rawOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const rawEvents = Array.isArray(eventsRes.data) ? eventsRes.data : [];

      // Map event names
      const evMap: Record<string, string> = {};
      rawEvents.forEach((ev) => {
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
  }, []);

  useEffect(() => {
    fetchOrdersAndEvents();
  }, [fetchOrdersAndEvents]);

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

  const parseAmount = (val: number | string | undefined | null): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
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
            <ShoppingCart className="h-4 w-4 text-zinc-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Transaction Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">Manajemen Pesanan</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Pantau seluruh riwayat transaksi tiket masuk, verifikasi status pembayaran, dan ekspor laporan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchOrdersAndEvents}
            disabled={loading}
            className="rounded-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 text-xs font-bold px-4 py-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportCsv}
            disabled={orders.length === 0}
            className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 text-xs font-bold px-5 py-2 shadow-none"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor Rekap (CSV)
          </Button>
        </div>
      </div>

      {/* 3 Summary Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Omset Pesanan</p>
              {loading ? (
                <Skeleton className="h-7 w-28 mt-1 bg-zinc-100 rounded-lg" />
              ) : (
                <p className="text-2xl font-black text-zinc-950 mt-1 tracking-tight">{formatCurrency(totalRevenue)}</p>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{paidOrders.length} transaksi lunas</p>
            </div>
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 text-zinc-900 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Pesanan Lunas (PAID)</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1 bg-zinc-100 rounded-lg" />
              ) : (
                <p className="text-2xl font-black text-emerald-600 mt-1 tracking-tight">{paidOrders.length}</p>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Pembayaran terverifikasi</p>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Menunggu Pembayaran</p>
              {loading ? (
                <Skeleton className="h-7 w-12 mt-1 bg-zinc-100 rounded-lg" />
              ) : (
                <p className="text-2xl font-black text-amber-600 mt-1 tracking-tight">{pendingOrders.length}</p>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Pending checkout</p>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card with Search & Filters */}
      <Card className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-zinc-100 p-1 rounded-full border border-zinc-200 text-xs w-fit">
            {[
              { id: 'ALL', label: `Semua (${orders.length})` },
              { id: 'PAID', label: `Lunas (${paidOrders.length})` },
              { id: 'PENDING', label: `Menunggu (${pendingOrders.length})` },
              { id: 'CANCELLED', label: 'Batal' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id ? 'bg-zinc-950 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari ID pesanan, nama event..."
              aria-label="Cari ID pesanan atau nama event"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-950 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {/* Table */}
        {orders.length === 0 && !loading ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
            <h3 className="text-base font-bold text-zinc-950 mb-1">Belum ada pesanan</h3>
            <p className="text-zinc-400 text-xs">Belum ada pesanan tiket yang masuk untuk event Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Order ID</th>
                  <th scope="col" className="px-4 py-3.5">Event</th>
                  <th scope="col" className="px-4 py-3.5">Total Tagihan</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">Waktu Transaksi</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-28 bg-zinc-100 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-36 bg-zinc-100 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 bg-zinc-100 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 bg-zinc-100 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 bg-zinc-100 rounded-full" /></td>
                      <td className="px-4 py-3.5 text-right"><Skeleton className="h-7 w-16 ml-auto bg-zinc-100 rounded-full" /></td>
                    </tr>
                  ))
                ) : filteredOrders.map((order) => {
                  const isPaid = order.status?.toUpperCase() === 'PAID' || order.status?.toUpperCase() === 'SUCCESS';
                  const isPending = order.status?.toUpperCase() === 'PENDING';
                  const eventName = eventsMap[order.event_id];

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-medium text-zinc-600 text-xs">
                        {order.id.substring(0, 8).toUpperCase()}...
                      </td>
                      <td className="px-4 py-3.5 text-zinc-950 font-bold text-xs max-w-xs truncate">
                        {eventName || (order.event_id ? `Event #${order.event_id.substring(0, 8)}` : '-')}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-950 font-black text-xs">
                        {formatCurrency(parseAmount(order.total_amount))}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={isPaid ? 'success' : isPending ? 'warning' : 'error'}
                          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        >
                          {isPaid ? 'LUNAS' : isPending ? 'MENUNGGU' : 'DIBATALKAN'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-500 text-xs">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="rounded-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs py-1 px-3.5 h-8 font-bold">
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

