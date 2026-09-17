'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ticketApi, eventApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/lib/toast';
import { Wallet } from 'lucide-react';
import { Event as EventType } from '@/types';

interface StatsData {
  total_orders: number;
  total_revenue: number;
  tickets_sold: number;
}

interface BalanceData {
  available_balance: number;
  pending_amount: number;
  paid_amount: number;
}

interface SalesTrendItem {
  sale_date: string;
  total_revenue?: string | number;
  tickets_sold: string | number;
}

interface RecentOrder {
  id: string;
  user_id?: string;
  event_id?: string;
  total_amount: number | string;
  status: string;
  user?: { name?: string; email?: string };
  event?: { title?: string };
}

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData>({
    total_orders: 0,
    total_revenue: 0,
    tickets_sold: 0,
  });
  const [balanceData, setBalanceData] = useState<BalanceData>({
    available_balance: 0,
    pending_amount: 0,
    paid_amount: 0,
  });
  const [activeEvents, setActiveEvents] = useState(0);
  const [eventsMap, setEventsMap] = useState<Record<string, string>>({});
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, balanceRes, eventsRes, trendRes, ordersRes] = await Promise.all([
          ticketApi.get<StatsData>('/api/v1/tickets/organizer/stats').catch(() => ({ success: false, data: null })),
          ticketApi.get<BalanceData>('/api/v1/tickets/organizer/balance').catch(() => ({ success: false, data: null })),
          eventApi.get<EventType[]>('/api/v1/organizer/events').catch(() => ({ success: false, data: [] })),
          ticketApi.get<SalesTrendItem[]>('/api/v1/tickets/organizer/trend').catch(() => ({ success: false, data: [] })),
          ticketApi.get<RecentOrder[]>('/api/v1/tickets/organizer/orders').catch(() => ({ success: false, data: [] }))
        ]);

        if (statsRes.data) {
          setStatsData(statsRes.data);
        }

        if (balanceRes && balanceRes.data) {
          setBalanceData(balanceRes.data);
        }
        
        if (eventsRes.data) {
          const events = eventsRes.data || [];
          setActiveEvents(events.filter((e) => e.status?.toLowerCase() === 'published').length);
          const evMap: Record<string, string> = {};
          events.forEach((ev) => {
            if (ev.id) evMap[ev.id] = ev.title;
          });
          setEventsMap(evMap);
        }

        if (trendRes.data) {
          setSalesTrend(trendRes.data || []);
        }

        if (ordersRes.data) {
          setRecentOrders(ordersRes.data || []);
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        toast.error("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { title: 'Saldo Tersedia', value: formatCurrency(Number(balanceData.available_balance || 0)), change: 'Siap Ditarik', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', highlight: true },
    { title: 'Total Pendapatan', value: formatCurrency(Number(statsData.total_revenue || 0)), change: 'Semua Waktu', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Tiket Terjual', value: statsData.tickets_sold.toString(), change: 'Total', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { title: 'Event Aktif', value: activeEvents.toString(), change: 'Published', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  const [timeframe, setTimeframe] = useState<7 | 14 | 30>(7);

  // Process sales trend into a continuous daily timeline
  const processTrendChart = () => {
    // Build a map of sales by YYYY-MM-DD
    const trendMap = new Map<string, { tickets: number; revenue: number }>();
    salesTrend.forEach((item) => {
      try {
        const itemDate = new Date(item.sale_date);
        if (!isNaN(itemDate.getTime())) {
          const y = itemDate.getFullYear();
          const m = String(itemDate.getMonth() + 1).padStart(2, '0');
          const d = String(itemDate.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${d}`;
          const existing = trendMap.get(key) || { tickets: 0, revenue: 0 };
          trendMap.set(key, {
            tickets: existing.tickets + (Number(item.tickets_sold) || 0),
            revenue: existing.revenue + (Number(item.total_revenue) || 0),
          });
        }
      } catch (err) {
        console.error('Error parsing trend item date', err);
      }
    });

    const days = [];
    const now = new Date();
    for (let i = timeframe - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${dayStr}`;
      const entry = trendMap.get(key) || { tickets: 0, revenue: 0 };
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      days.push({
        key,
        label,
        tickets: entry.tickets,
        revenue: entry.revenue,
      });
    }

    const maxTickets = Math.max(...days.map((d) => d.tickets), 1);

    return days.map((d) => ({
      ...d,
      height: maxTickets > 0 ? Math.round((d.tickets / maxTickets) * 100) : 0,
    }));
  };

  const chartData = processTrendChart();
  const totalTicketsInPeriod = chartData.reduce((acc, curr) => acc + curr.tickets, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-1">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Ringkasan performa event dan penjualan tiket Anda.</p>
        </div>
        <Link href="/dashboard/withdrawals">
          <Button className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold text-xs px-5 py-2.5 flex items-center gap-2 shadow-none">
            <Wallet className="h-4 w-4" />
            Tarik Saldo
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 bg-zinc-100 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">{stat.title}</p>
                {loading ? <Skeleton className="h-8 w-24 mb-2 bg-zinc-200 rounded-lg" /> : <h3 className="text-2xl font-black text-zinc-950 mb-2 tracking-tight">{stat.value}</h3>}
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-zinc-700">
                  {stat.change}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white text-zinc-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Area */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-100 rounded-2xl p-6 sm:p-7 h-full min-h-[400px] flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-zinc-950">Tren Penjualan (Riwayat)</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {totalTicketsInPeriod > 0
                    ? `${totalTicketsInPeriod} tiket terjual dalam ${timeframe} hari terakhir`
                    : `Belum ada tiket terjual dalam ${timeframe} hari terakhir`}
                </p>
              </div>
              {/* Timeframe pill switcher */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-full self-start sm:self-auto border border-zinc-200/50">
                {([7, 14, 30] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setTimeframe(days)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all ${
                      timeframe === days
                        ? 'bg-zinc-950 text-white'
                        : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    {days} Hari
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 flex flex-col justify-end pt-4">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                  Memuat grafik tren...
                </div>
              ) : (
                <div className="h-48 w-full flex items-end gap-1.5 sm:gap-3">
                  {chartData.map((data) => {
                    const isZero = data.tickets === 0;
                    return (
                      <div key={data.key} className="flex-1 flex flex-col items-center h-full justify-end group min-w-0">
                        {/* Bar Track Area */}
                        <div className="w-full h-full flex items-end justify-center relative">
                          <div
                            className={`w-full ${
                              timeframe === 30
                                ? 'max-w-[12px] sm:max-w-[18px]'
                                : timeframe === 14
                                ? 'max-w-[20px] sm:max-w-[28px]'
                                : 'max-w-[32px] sm:max-w-[44px]'
                            } rounded-t-lg transition-all duration-300 relative cursor-pointer ${
                              isZero
                                ? 'bg-zinc-200/80 group-hover:bg-zinc-300'
                                : 'bg-zinc-900 group-hover:bg-zinc-700'
                            }`}
                            style={{
                              height: isZero ? '6px' : `${Math.max(12, data.height)}%`,
                            }}
                          >
                            {/* Value number on top of active bar */}
                            {!isZero && (
                              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-zinc-900 group-hover:opacity-0 transition-opacity pointer-events-none">
                                {data.tickets}
                              </span>
                            )}

                            {/* Floating Tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-all pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl whitespace-nowrap z-30 shadow-xl flex flex-col items-center gap-0.5">
                              <span>{data.tickets} Tiket</span>
                              {data.revenue > 0 && (
                                <span className="text-[9px] font-medium text-zinc-400">
                                  {formatCurrency(data.revenue)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* X-Axis Date Label */}
                        <div
                          className={`text-[10px] sm:text-xs font-semibold text-zinc-500 text-center mt-2.5 truncate w-full group-hover:text-zinc-950 transition-colors ${
                            timeframe === 30 ? 'hidden md:block' : ''
                          }`}
                        >
                          {data.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-1">
          <Card className="bg-zinc-100 rounded-2xl p-6 sm:p-7 h-full">
            <h3 className="text-base font-bold text-zinc-950 mb-6">Pesanan Terbaru</h3>
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-zinc-200 rounded-xl" />)
              ) : recentOrders.length === 0 ? (
                <div className="text-zinc-400 text-xs text-center py-8">Belum ada pesanan</div>
              ) : (
                recentOrders.slice(0, 5).map((order) => {
                  const isPaid = order.status?.toUpperCase() === 'PAID' || order.status?.toUpperCase() === 'SUCCESS' || order.status === 'SUKSES';
                  const eventTitle = (order.event_id && eventsMap[order.event_id]) || order.event?.title || 'Tiket Event';
                  const customerName = order.user?.name || (order.user_id ? `User #${order.user_id}` : 'Pelanggan');
                  return (
                    <div key={order.id} className="flex items-center gap-3.5 p-2 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-zinc-900 font-bold text-xs shrink-0">
                        {customerName[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-950 truncate">{customerName}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{eventTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-zinc-950">{formatCurrency(Number(order.total_amount))}</p>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {isPaid ? 'LUNAS' : order.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
