'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Fetch user tickets placeholder
    setTickets([
      { id: 'TRX-12345', event: 'Music Festival 2024', type: 'VIP', code: 'MF24-ABC-123', status: 'Active', date: '12 Okt 2024' },
      { id: 'TRX-12346', event: 'Tech Conference', type: 'General', code: 'TC-XYZ-987', status: 'Used', date: '5 Nov 2024' }
    ]);
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return <div className="min-h-screen flex items-center justify-center text-white">Memuat...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-8">Profil Akun</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1">
          <Card className="bg-gray-900 border-gray-800 p-6 shadow-xl sticky top-24">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
              <p className="text-gray-400 mb-4">{user.email}</p>
              <Badge status={user.role === 'organizer' ? 'Organizer' : 'Pembeli'} className="border-[#7C3AED] text-[#7C3AED] mb-6" />
            </div>
            
            <div className="space-y-4 border-t border-gray-800 pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">No. HP</span>
                <span className="text-white font-medium">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Bergabung</span>
                <span className="text-white font-medium">Jan 2024</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-8 border-red-500/50 text-red-500 hover:bg-red-500/10"
              onClick={() => logout()}
            >
              Keluar Akun
            </Button>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-6">Tiket Saya</h2>
          
          <div className="space-y-4">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <Card key={ticket.id} className="bg-gray-900 border-gray-800 p-0 overflow-hidden flex flex-col sm:flex-row shadow-lg">
                  <div className="bg-[#7C3AED] w-full sm:w-2 md:w-3 flex-shrink-0 hidden sm:block"></div>
                  <div className="p-6 flex-grow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 sm:border-l-0 border-[#7C3AED] sm:border-none">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{ticket.event}</h3>
                      <p className="text-sm text-gray-400 mb-2">{ticket.date} • {ticket.type}</p>
                      <div className="inline-block bg-gray-800 rounded px-3 py-1 font-mono text-sm text-[#7C3AED] border border-gray-700">
                        {ticket.code}
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <Badge status={ticket.status} />
                      <div className="mt-4 sm:mt-2">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto border-gray-700 text-white hover:bg-gray-800">
                          Lihat E-Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
                <p className="text-gray-400 mb-4">Anda belum memiliki tiket.</p>
                <Button className="bg-[#7C3AED] text-white">Cari Event</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
