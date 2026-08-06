'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { authApi, ticketApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, isLoading, logout, loadProfile } = useAuth();
  const isAuthenticated = !!user;
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await authApi.post('/api/v1/auth/upgrade');
      await loadProfile();
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to upgrade role:', error);
      toast.error('Gagal meningkatkan akun. Silakan coba lagi.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const fetchTicketsAndOrders = async () => {
    try {
      const [ticketsRes, ordersRes] = await Promise.all([
        ticketApi.get('/api/v1/tickets').catch(() => ({ data: [] })),
        ticketApi.get('/api/v1/tickets/orders').catch(() => ({ data: [] }))
      ]);
      setTickets((ticketsRes as any).data || []);
      setOrders((ordersRes as any).data || []);
    } catch (error) {
      console.error('Failed to fetch tickets and orders', error);
    }
  };

  const handlePayOrder = async (orderId: string) => {
    try {
      setIsPaying(true);
      const res = await ticketApi.post<any>(`/api/v1/tickets/orders/${orderId}/pay`);
      const token = (res as any).data?.token;
      
      if (!token) {
        throw new Error('Gagal mendapatkan token pembayaran dari server.');
      }

      // @ts-ignore
      if (window.snap) {
        // @ts-ignore
        window.snap.pay(token, {
          onSuccess: async function (result: any) {
            // FOR LOCALHOST TESTING: Manually trigger the webhook 
            try {
              await ticketApi.post('/api/v1/tickets/midtrans/webhook', result);
            } catch (e) {
              console.error("Webhook trigger failed", e);
            }
            toast.success('Pembayaran berhasil!');
            fetchTicketsAndOrders();
          },
          onPending: function (result: any) {
            toast.info('Menunggu pembayaran Anda.');
            fetchTicketsAndOrders();
          },
          onError: function (result: any) {
            toast.error('Pembayaran gagal.');
            fetchTicketsAndOrders();
          },
          onClose: function () {
            toast.warning('Anda menutup jendela pembayaran.');
          }
        });
      } else {
        toast.error('Midtrans Snap gagal dimuat. Coba refresh halaman.');
      }
    } catch (error: any) {
      toast.error('Gagal memproses pembayaran: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchTicketsAndOrders();
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold text-white mb-8">Profil Akun</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1">
          <Card className="bg-gray-900 p-6 shadow-xl sticky top-24">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#7C3AED] rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
              <p className="text-gray-400 mb-4">{user.email}</p>
              <Badge status={user.role === 'organizer' ? 'Organizer' : 'Pembeli'} className="] text-[#7C3AED] mb-6" />
            </div>
            
            <div className="space-y-4 pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">No. HP</span>
                <span className="text-white font-medium">{user.phone || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Bergabung</span>
                <span className="text-white font-medium">Jan 2024</span>
              </div>
            </div>

            {user.role === 'user' && (
              <div className="mt-8 pt-6 border-t border-gray-800">
                <h3 className="text-white font-medium mb-2">Ingin membuat event sendiri?</h3>
                <p className="text-gray-400 text-sm mb-4">Tingkatkan akun Anda menjadi Organizer Event untuk mulai membuat dan menjual tiket.</p>
                <Button 
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Memproses...' : 'Tingkatkan ke Organizer'}
                </Button>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full mt-3 text-red-500 hover:bg-red-500/10 border-red-500/20"
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
                <Card key={ticket.id} className="bg-gray-900 p-0 overflow-hidden flex flex-col sm:flex-row shadow-lg">
                  <div className="p-6 flex-grow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ] ">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Event ID: {ticket.event_id}</h3>
                      <p className="text-sm text-gray-400 mb-2">Tipe Tiket: {ticket.ticket_type_id}</p>
                      <div className="inline-block bg-gray-800 rounded px-3 py-1 font-mono text-sm text-[#7C3AED] ">
                        {ticket.ticket_code}
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <Badge status={ticket.status} />
                      <div className="mt-4 sm:mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto text-white hover:bg-gray-800"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          Lihat E-Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-900 rounded-xl ">
                <p className="text-gray-400">Anda belum memiliki e-ticket aktif.</p>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-6 mt-12">Pesanan Menunggu Pembayaran</h2>
          <div className="space-y-4">
            {orders.filter(o => o.status === 'PENDING').length > 0 ? (
              orders.filter(o => o.status === 'PENDING').map((order) => (
                <Card key={order.id} className="bg-gray-900 p-0 overflow-hidden flex flex-col sm:flex-row shadow-lg">
                  <div className="p-6 flex-grow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ] ">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Order #{order.id.substring(0, 8)}</h3>
                      <p className="text-sm text-gray-400 mb-2">Event ID: {order.event_id}</p>
                      <p className="text-sm font-semibold text-yellow-500">Total: Rp {parseFloat(order.total_amount).toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <Badge status={order.status} />
                      <div className="mt-4 sm:mt-2">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="w-full sm:w-auto"
                          disabled={isPaying}
                          onClick={() => handlePayOrder(order.id)}
                        >
                          {isPaying ? 'Memproses...' : 'Bayar Sekarang'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-6 bg-gray-900 rounded-xl ">
                <p className="text-gray-400">Tidak ada pesanan tertunda.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal E-Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            
            {/* Header */}
            <div className="bg-[#7C3AED] p-6 text-center relative">
              <button 
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors bg-black/20 rounded-full p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <h2 className="text-2xl font-bold text-white mb-1">Tiket Event {selectedTicket.event_id.substring(0,8)}</h2>
              <p className="text-white/80 text-sm">Issued at: {new Date(selectedTicket.created_at).toLocaleString('id-ID')}</p>
            </div>
            
            {/* Body */}
            <div className="p-8 text-center bg-gray-900 relative">
              {/* Ticket Type & Status */}
              <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                <div className="text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tipe Tiket</p>
                  <p className="font-bold text-white text-lg">{selectedTicket.ticket_type_id.substring(0,8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                  <Badge status={selectedTicket.status} />
                </div>
              </div>
              
              {/* QR Code Placeholder */}
              <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-md mx-auto relative group">
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M7 7h.01"></path><path d="M17 7h.01"></path><path d="M7 17h.01"></path><path d="M17 17h.01"></path><path d="M12 7v10"></path><path d="M7 12h10"></path></svg>
                    <span className="text-gray-400 text-sm font-medium">QR Code</span>
                  </div>
                </div>
                {/* Decorative scanning line */}
                {selectedTicket.status === 'Active' && (
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#7C3AED] shadow-[0_0_8px_#7C3AED] animate-[scan_2s_ease-in-out_infinite]"></div>
                )}
              </div>
              
              {/* Ticket Code */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Kode Tiket</p>
                <div className="bg-gray-800 py-3 px-6 rounded-lg inline-block">
                  <p className="font-mono text-xl tracking-widest text-white">{selectedTicket.ticket_code}</p>
                </div>
              </div>
              
              <div className="mt-8 text-xs text-gray-500 text-center">
                <p>Tunjukkan e-ticket ini saat masuk ke area acara.</p>
              </div>
            </div>
            
            {/* Cutout effect circles */}
            <div className="absolute left-[-12px] top-[108px] w-6 h-6 bg-black/80 rounded-full"></div>
            <div className="absolute right-[-12px] top-[108px] w-6 h-6 bg-black/80 rounded-full"></div>
            
            {/* Dashed line across ticket */}
            <div className="absolute left-4 right-4 top-[120px] h-[1px] bg-white/20 border-t border-dashed border-white/40"></div>
          </div>
        </div>
      )}
    </div>
  );
}
