'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TicketSelector } from '@/components/features/TicketSelector';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { eventApi, ticketApi } from '@/lib/api';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/providers/auth-provider';

interface EventDetail {
  id: string | string[];
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  category: string;
  organizer: string;
  tickets: Array<{
    id: string;
    name: string;
    price: number;
    quota: number;
    available: number;
  }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [modalData, setModalData] = useState<{isOpen: boolean, title: string, message: string, type: 'success' | 'error'}>({isOpen: false, title: '', message: '', type: 'success'});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [res, ticketRes, catRes, venueRes] = await Promise.all([
          eventApi.get<any>(`/api/v1/events/${params.id}`),
          eventApi.get<any>(`/api/v1/events/${params.id}/tickets`).catch(() => ({ data: { data: [] } })),
          eventApi.get<any>(`/api/v1/categories`).catch(() => ({ data: [] })),
          eventApi.get<any>(`/api/v1/venues`).catch(() => ({ data: [] }))
        ]);

        if (res.data) {
          const apiEvent = res.data.data || res.data;
          const apiTickets = ticketRes.data?.data || ticketRes.data || [];
          const categories = catRes.data || [];
          
          let dateStr = 'TBA';
          let timeStr = 'TBA';
          if (apiEvent.start_date) {
            const startDate = new Date(apiEvent.start_date);
            dateStr = format(startDate, 'dd MMMM yyyy', { locale: localeId });
            timeStr = format(startDate, 'HH:mm', { locale: localeId }) + ' WIB';
          }

          let categoryName = 'Kategori';
          if (apiEvent.category_id) {
            const cat = categories.find((c: any) => c.id === apiEvent.category_id);
            if (cat) categoryName = cat.name;
          }
          
          let venueName = 'Lokasi Belum Ditentukan';
          if (apiEvent.is_online) {
            venueName = 'Online Event';
          } else if (apiEvent.venue?.name) {
            venueName = `${apiEvent.venue.name}, ${apiEvent.venue.city}`;
          } else if (apiEvent.venue_id) {
            const venues = (venueRes as any).data?.data || (venueRes as any).data || [];
            const venue = venues.find((v: any) => v.id === apiEvent.venue_id);
            if (venue) {
              venueName = `${venue.name}, ${venue.city}`;
            }
          }
          
          setEvent({
            id: apiEvent.id,
            title: apiEvent.title,
            description: apiEvent.description || 'Tidak ada deskripsi',
            date: dateStr,
            time: timeStr,
            venue: venueName,
            image: apiEvent.banner_url || 'https://placehold.co/1200x500/1e1e1e/8a2be2?text=Tanpa+Gambar',
            category: apiEvent.category?.name || categoryName,
            organizer: 'Organizer Event',
            tickets: Array.isArray(apiTickets) ? apiTickets.map((t: any) => ({
              id: t.id,
              name: t.name,
              price: parseFloat(t.price) || 0,
              quota: t.quantity,
              available: t.quantity - (t.sold || 0)
            })) : []
          });
        }
      } catch (error) {
        console.error('Error fetching event details', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="w-full h-[400px] rounded-2xl bg-gray-900 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="w-24 h-8 rounded-full bg-gray-900" />
            <Skeleton className="w-3/4 h-12 bg-gray-900" />
            <Skeleton className="w-full h-32 bg-gray-900 mt-6" />
          </div>
          <div>
            <Skeleton className="w-full h-80 rounded-xl bg-gray-900" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) return <div className="text-center py-20 text-white">Event tidak ditemukan.</div>;

  return (
    <div className="bg-gray-950 pb-20">
      {/* Banner */}
      <div className="w-full h-[300px] md:h-[500px] relative">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gray-950/80"></div>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-900 p-6 md:p-8 rounded-2xl shadow-xl">
              <Badge status={event.category} className="bg-[#7C3AED] text-white mb-4 rounded-full px-3 py-1" />
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{event.title}</h1>
              
              <div className="flex flex-col sm:flex-row gap-6 mt-8 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-gray-800 rounded-lg text-[#7C3AED]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Tanggal</p>
                    <p>{event.date}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-3 bg-gray-800 rounded-lg text-[#7C3AED]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Waktu</p>
                    <p>{event.time}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-gray-800 rounded-lg text-[#7C3AED]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Lokasi</p>
                    <p>{event.venue}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 md:p-8 rounded-2xl ">
              <h2 className="text-2xl font-bold text-white mb-4">Deskripsi Event</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>{event.description}</p>
              </div>
              
              <div className="mt-8 pt-8 ">
                <h3 className="text-lg font-bold text-white mb-2">Diselenggarakan oleh</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center font-bold text-xl text-[#7C3AED]">
                    {event.organizer.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-200">{event.organizer}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="bg-gray-900 shadow-xl overflow-hidden">
                <div className="p-6 bg-[#7C3AED]/20 ">
                  <h3 className="text-xl font-bold text-white">Pilih Tiket</h3>
                </div>
                <div className="p-6">
                  <TicketSelector 
                    ticketTypes={event.tickets as any} 
                    onSelect={async (selected) => {
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      
                      if (selected.length === 0) return;
                      try {
                        setCheckoutLoading(true);
                        // For simplicity, we create one order per selected ticket type
                        for (const item of selected) {
                          const ticketData = event.tickets.find(t => t.id === item.ticketTypeId);
                          await ticketApi.post('/api/v1/tickets/orders', {
                            event_id: event.id,
                            ticket_type_id: item.ticketTypeId,
                            quantity: item.quantity,
                            price: ticketData?.price || 0
                          });
                        }
                        setModalData({
                          isOpen: true,
                          title: 'Pemesanan Berhasil',
                          message: 'Pesanan tiket Anda berhasil dibuat dan berstatus PENDING. Silakan selesaikan pembayaran di halaman Profil Anda.',
                          type: 'success'
                        });
                      } catch (error: any) {
                        setModalData({
                          isOpen: true,
                          title: 'Gagal Memesan Tiket',
                          message: 'Terjadi kesalahan: ' + (error.response?.data?.message || error.message),
                          type: 'error'
                        });
                      } finally {
                        setCheckoutLoading(false);
                      }
                    }} 
                  />
                  {checkoutLoading && <p className="text-sm text-violet-400 mt-4 text-center animate-pulse">Memproses pesanan...</p>}
                </div>
              </Card>
            </div>
          </div>
          
        </div>
      </div>

      <Modal 
        isOpen={modalData.isOpen} 
        onClose={() => {
          setModalData({...modalData, isOpen: false});
          if (modalData.type === 'success') {
            router.push('/profile');
          }
        }} 
        title={modalData.title}
      >
        <div className="text-center py-4">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${modalData.type === 'success' ? 'bg-green-100' : 'bg-red-100'} mb-6`}>
            {modalData.type === 'success' ? (
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <p className="text-gray-300 text-lg mb-8">{modalData.message}</p>
          <Button 
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            onClick={() => {
              setModalData({...modalData, isOpen: false});
              if (modalData.type === 'success') {
                router.push('/profile');
              }
            }}
          >
            {modalData.type === 'success' ? 'Lanjut ke Pembayaran' : 'Tutup'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
