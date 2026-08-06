'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ticketApi, eventApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>({
    total_orders: 0,
    total_revenue: 0,
    tickets_sold: 0,
  });
  const [activeEvents, setActiveEvents] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, eventsRes, trendRes, ordersRes] = await Promise.all([
          ticketApi.get('/api/v1/tickets/organizer/stats').catch(() => ({ data: { data: null } })),
          eventApi.get('/api/v1/organizer/events').catch(() => ({ data: { data: [] } })),
          ticketApi.get('/api/v1/tickets/organizer/trend').catch(() => ({ data: { data: [] } })),
          ticketApi.get('/api/v1/tickets/organizer/orders').catch(() => ({ data: { data: [] } }))
        ]);

        if (statsRes.data?.data) {
          setStatsData(statsRes.data.data);
        }
        
        if (eventsRes.data?.data) {
          const events = eventsRes.data.data || [];
          setTotalEvents(events.length);
          setActiveEvents(events.filter((e: any) => e.status === 'PUBLISHED').length);
        }

        if (trendRes.data?.data) {
          setSalesTrend(trendRes.data.data || []);
        }

        if (ordersRes.data?.data) {
          setRecentOrders(ordersRes.data.data || []);
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
    { title: 'Total Event', value: totalEvents.toString(), change: 'Keseluruhan', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: 'Tiket Terjual', value: statsData.tickets_sold.toString(), change: 'Total', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { title: 'Total Pendapatan', value: formatCurrency(parseFloat(statsData.total_revenue || 0)), change: 'Semua Waktu', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Event Aktif', value: activeEvents.toString(), change: 'Published', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  // Process sales trend to fit 30 days
  const processTrendChart = () => {
    // A simple representation mapping the trend to heights (percentage 0-100)
    if (salesTrend.length === 0) return Array(12).fill(0); // empty state
    
    // For MVP, just map the actual dates or last 12 entries
    const recent = salesTrend.slice(-12);
    const maxTickets = Math.max(...recent.map(t => parseInt(t.tickets_sold) || 0), 1);
    
    return recent.map(t => {
      const sold = parseInt(t.tickets_sold) || 0;
      const height = Math.max(5, Math.floor((sold / maxTickets) * 100));
      return { height, label: new Date(t.sale_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), tickets: sold };
    });
  };

  const chartData = processTrendChart();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-gray-400">Ringkasan performa event dan penjualan tiket Anda.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gray-900 p-6 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                {loading ? <Skeleton className="h-8 w-24 mb-2 bg-gray-800" /> : <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>}
                <p className="text-xs text-green-400">{stat.change}</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg text-[#7C3AED]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
          <Card className="bg-gray-900 p-6 h-full min-h-[400px]">
            <h3 className="text-xl font-bold text-white mb-6">Tren Penjualan (Riwayat)</h3>
            <div className="flex h-64 items-end gap-2 mt-8">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500">Memuat grafik...</div>
              ) : chartData.every(d => d === 0 || d.tickets === 0) ? (
                 <div className="w-full h-full flex items-center justify-center text-gray-500">Belum ada data penjualan</div>
              ) : (
                chartData.map((data, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group">
                    <div 
                      className="w-full bg-[#7C3AED]/50 hover:bg-[#7C3AED] rounded-t-sm transition-all relative"
                      style={{ height: `${data.height}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                        {data.tickets} Tiket
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 text-center mt-2 truncate">{data.label}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 p-6 h-full">
            <h3 className="text-xl font-bold text-white mb-6">Pesanan Terbaru</h3>
            <div className="space-y-6">
              {loading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-gray-800" />)
              ) : recentOrders.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-4">Belum ada pesanan</div>
              ) : (
                recentOrders.slice(0, 5).map((order: any, i) => (
                  <div key={order.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-[#7C3AED] font-bold shrink-0">
                      {(order.user?.name || "U")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{order.user?.name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{order.event?.title || 'Event Tiket'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-white">{formatCurrency(parseFloat(order.total_amount))}</p>
                      <p className={`text-xs ${order.status === 'SUKSES' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
