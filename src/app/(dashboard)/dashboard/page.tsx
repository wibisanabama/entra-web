'use client';

import { Card } from '@/components/ui/Card';

export default function DashboardOverviewPage() {
  const stats = [
    { title: 'Total Event', value: '12', change: '+2 bulan ini', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: 'Tiket Terjual', value: '1,240', change: '+15% minggu ini', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { title: 'Total Pendapatan', value: 'Rp 45.2M', change: '+8% bulan ini', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Event Aktif', value: '3', change: '2 upcoming', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

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
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#7C3AED]/20 rounded-full blur-xl"></div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>
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
            <h3 className="text-xl font-bold text-white mb-6">Tren Penjualan (Bulan Ini)</h3>
            <div className="flex h-64 items-end gap-2 mt-8">
              {[40, 25, 60, 30, 80, 50, 90, 65, 45, 100, 75, 55].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end group">
                  <div 
                    className="w-full bg-[#7C3AED]/50 hover:bg-[#7C3AED] rounded-t-sm transition-all relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-xs py-1 px-2 rounded whitespace-nowrap">
                      {height * 5} Tiket
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-4">
              <span>1</span>
              <span>7</span>
              <span>14</span>
              <span>21</span>
              <span>28</span>
            </div>
          </Card>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 p-6 h-full">
            <h3 className="text-xl font-bold text-white mb-6">Pesanan Terbaru</h3>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-[#7C3AED] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Pembeli {i}</p>
                    <p className="text-xs text-gray-400">Music Festival 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">Rp 250k</p>
                    <p className="text-xs text-green-400">Berhasil</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
