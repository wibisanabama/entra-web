'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function DashboardOrdersPage() {
  const [orders] = useState([
    { id: 'ORD-001', buyer: 'Budi Santoso', email: 'budi@example.com', event: 'Music Festival 2024', total: 'Rp 500.000', status: 'Sukses', date: '10 Ags 2024' },
    { id: 'ORD-002', buyer: 'Siti Aminah', email: 'siti@example.com', event: 'Tech Conference', total: 'Rp 250.000', status: 'Pending', date: '11 Ags 2024' },
    { id: 'ORD-003', buyer: 'Andi Wijaya', email: 'andi@example.com', event: 'Music Festival 2024', total: 'Rp 850.000', status: 'Sukses', date: '11 Ags 2024' },
    { id: 'ORD-004', buyer: 'Dewi Lestari', email: 'dewi@example.com', event: 'Food & Beverage Expo', total: 'Rp 100.000', status: 'Dibatalkan', date: '12 Ags 2024' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manajemen Pesanan</h1>
        <p className="text-gray-400">Daftar transaksi pembelian tiket untuk event Anda.</p>
      </div>

      <Card className="bg-gray-900 overflow-hidden">
        <div className="p-4 flex justify-between items-center bg-gray-900/50">
          <Input 
            placeholder="Cari Order ID atau email..." 
            className="max-w-xs bg-gray-800 text-white"
          />
          <select className="bg-gray-800 text-white text-sm rounded-md focus:ring-[#7C3AED] ] block p-2.5">
            <option>Semua Event</option>
            <option>Music Festival 2024</option>
            <option>Tech Conference</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4">Order ID</th>
                <th scope="col" className="px-6 py-4">Pembeli</th>
                <th scope="col" className="px-6 py-4">Event</th>
                <th scope="col" className="px-6 py-4">Total</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Tanggal</th>
                <th scope="col" className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-white">
                    {order.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{order.buyer}</p>
                    <p className="text-xs text-gray-500">{order.email}</p>
                  </td>
                  <td className="px-6 py-4">{order.event}</td>
                  <td className="px-6 py-4 text-white font-medium">{order.total}</td>
                  <td className="px-6 py-4">
                    <Badge status={order.status} />
                  </td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" className="text-white hover:bg-gray-800">Detail</Button>
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
