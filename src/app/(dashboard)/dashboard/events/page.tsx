'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function DashboardEventsPage() {
  // Mock data
  const [events] = useState([
    { id: '1', title: 'Music Festival 2024', date: '12 Okt 2024', status: 'Published', sold: 450, total: 1000 },
    { id: '2', title: 'Tech Conference', date: '05 Nov 2024', status: 'Draft', sold: 0, total: 500 },
    { id: '3', title: 'Food & Beverage Expo', date: '20 Sep 2024', status: 'Completed', sold: 2000, total: 2000 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manajemen Event</h1>
          <p className="text-gray-400">Kelola semua event yang Anda buat.</p>
        </div>
        <Link href="/dashboard/events/create">
          <Button className="bg-[#7C3AED] hover:bg-[#4F46E5] text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Buat Event Baru
          </Button>
        </Link>
      </div>

      <Card className="bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-gray-400 uppercase bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-4">Nama Event</th>
                <th scope="col" className="px-6 py-4">Tanggal</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Tiket Terjual</th>
                <th scope="col" className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {event.title}
                  </td>
                  <td className="px-6 py-4">{event.date}</td>
                  <td className="px-6 py-4">
                    <Badge status={event.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-[#7C3AED] h-2 rounded-full" 
                          style={{ width: `${(event.sold / event.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{event.sold}/{event.total}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm" className="text-white hover:bg-gray-800 hover:text-[#7C3AED]">
                          Edit
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-white hover:bg-red-500/10 hover:text-red-500 ">
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">Menampilkan 1-3 dari 3 event</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="text-gray-400 px-2 py-1" disabled>&lt;</Button>
            <Button variant="outline" size="sm" className="] bg-gray-800 text-[#7C3AED] px-3 py-1">1</Button>
            <Button variant="outline" size="sm" className="text-gray-400 px-2 py-1" disabled>&gt;</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
