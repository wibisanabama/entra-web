'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TicketSelector } from '@/components/features/TicketSelector';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { eventApi, ticketApi, authApi } from '@/lib/api';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useAuth } from '@/providers/auth-provider';
import { getPgText } from '@/lib/utils';
import { Event as EventType, Category, Venue, User, TicketType } from '@/types';
import { toast } from 'sonner';

interface EventDetail {
  id: string;
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
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const handlePayOrder = async (orderId: string) => {
    try {
      setIsPaying(true);
      const res = await ticketApi.post<{ token?: string } | string>(`/api/v1/tickets/orders/${orderId}/pay`);
      const token = typeof res.data === 'string' ? res.data : res.data?.token;

      if (!token) {
        throw new Error('Token pembayaran tidak ditemukan.');
      }

      // If mock token or no snap instance, trigger simulate
      if (token.startsWith('MOCK_') || typeof window === 'undefined' || !window.snap) {
        try {
          await ticketApi.post(`/api/v1/tickets/orders/${orderId}/simulate`);
          toast.success('Pembayaran simulasi dev berhasil! Tiket Anda telah aktif.');
          router.push('/my-tickets');
          return;
        } catch {
          // If simulate fails, fall through
        }
      }

      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil! E-Ticket Anda telah aktif.');
            router.push('/my-tickets');
          },
          onPending: () => {
            toast.info('Menunggu penyelesaian pembayaran.');
            router.push('/my-tickets');
          },
          onError: () => {
            toast.error('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            toast.info('Jendela pembayaran ditutup. Anda dapat membayar di halaman Tiket Saya.');
            router.push('/my-tickets');
          },
        });
      } else {
        toast.info('Silakan lanjutkan pembayaran di halaman Tiket Saya.');
        router.push('/my-tickets');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal memproses pembayaran';
      toast.error(errMsg);
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventId = String(params.id);
        const [res, ticketRes, catRes, venueRes] = await Promise.all([
          eventApi.get<EventType>(`/api/v1/events/${eventId}`),
          eventApi.get<TicketType[]>(`/api/v1/events/${eventId}/tickets`).catch(() => ({ success: false, data: [] as TicketType[] })),
          eventApi.get<Category[]>(`/api/v1/categories`).catch(() => ({ success: false, data: [] as Category[] })),
          eventApi.get<Venue[]>(`/api/v1/venues`).catch(() => ({ success: false, data: [] as Venue[] }))
        ]);

        if (res.data) {
          const apiEvent = res.data;
          const rawTickets = Array.isArray(ticketRes.data) ? ticketRes.data : [];
          const categories = Array.isArray(catRes.data) ? catRes.data : [];
          const venues = Array.isArray(venueRes.data) ? venueRes.data : [];
          
          let organizerName = 'Organizer Event';
          if (apiEvent.organizer_id) {
            try {
              const userRes = await authApi.get<User>(`/api/v1/users/${apiEvent.organizer_id}`);
              if (userRes.data?.full_name) {
                organizerName = userRes.data.full_name;
              }
            } catch {
              // Ignore if organizer is not found
            }
          }
          
          let dateStr = 'TBA';
          let timeStr = 'TBA';
          if (apiEvent.start_date) {
            const startDate = new Date(apiEvent.start_date);
            dateStr = format(startDate, 'dd MMMM yyyy', { locale: localeId });
            timeStr = format(startDate, 'HH:mm', { locale: localeId }) + ' WIB';
          }

          let categoryName = 'Kategori';
          if (apiEvent.category_id) {
            const cat = categories.find((c) => c.id === apiEvent.category_id);
            if (cat) categoryName = cat.name;
          }
          
          let venueName = 'Lokasi Belum Ditentukan';
          if (apiEvent.is_online) {
            venueName = 'Online Event';
          } else if (apiEvent.venue?.name) {
            venueName = `${apiEvent.venue.name}, ${apiEvent.venue.city}`;
          } else if (apiEvent.venue_id) {
            const venue = venues.find((v) => v.id === apiEvent.venue_id);
            if (venue) {
              venueName = `${venue.name}, ${venue.city}`;
            }
          }
          
          setEvent({
            id: apiEvent.id,
            title: apiEvent.title,
            description: getPgText(apiEvent.description) || 'Tidak ada deskripsi',
            date: dateStr,
            time: timeStr,
            venue: venueName,
            image: getPgText(apiEvent.banner_url) || 'https://placehold.co/1200x500/1e1e1e/8a2be2?text=Tanpa+Gambar',
            category: apiEvent.category?.name || categoryName,
            organizer: organizerName,
            tickets: rawTickets.map((t) => ({
              id: t.id,
              name: t.name,
              price: parseFloat(String(t.price)) || 0,
              quota: t.quantity,
              available: t.quantity - (t.sold || 0)
            }))
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Skeleton className="w-full aspect-[21/9] max-h-[440px] rounded-3xl bg-zinc-200/70" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="w-28 h-8 rounded-full bg-zinc-200/70" />
            <Skeleton className="w-3/4 h-12 bg-zinc-200/70" />
            <Skeleton className="w-full h-36 rounded-2xl bg-zinc-200/70 mt-6" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="w-full h-96 rounded-3xl bg-zinc-200/70" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-xl font-bold text-zinc-950 mb-2">Event Tidak Ditemukan</h2>
        <p className="text-sm text-zinc-500 mb-6">Event yang Anda cari mungkin sudah tidak tersedia atau telah dihapus.</p>
        <Button onClick={() => router.push('/events')} className="bg-zinc-950 text-white rounded-full px-6">
          Kembali ke Direktori Event
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white pb-24 text-zinc-900">
      {/* Banner Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[460px] rounded-3xl overflow-hidden bg-zinc-100">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Mobbin Split-Screen Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Banner info, Date/Time/Venue, Description, Organizer */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Header Card */}
            <div className="bg-zinc-100 p-6 sm:p-8 rounded-3xl space-y-6">
              <div>
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-white text-zinc-900 mb-3">
                  {event.category}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-950 tracking-tight leading-tight">
                  {event.title}
                </h1>
              </div>

              {/* Event Info Details Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-white rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Tanggal</p>
                    <p className="font-bold text-zinc-950 text-xs sm:text-sm mt-0.5">{event.date}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Waktu</p>
                    <p className="font-bold text-zinc-950 text-xs sm:text-sm mt-0.5">{event.time}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-zinc-100 rounded-xl text-zinc-900 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Lokasi Venue</p>
                    <p className="font-bold text-zinc-950 text-xs sm:text-sm mt-0.5 line-clamp-1">{event.venue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-zinc-100 p-6 sm:p-8 rounded-3xl space-y-4">
              <h2 className="text-xl font-bold text-zinc-950">Tentang Acara</h2>
              <div className="text-zinc-600 leading-relaxed text-sm whitespace-pre-line space-y-3">
                <p>{event.description}</p>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="bg-zinc-100 p-6 sm:p-8 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Penyelenggara Acara</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-lg text-zinc-950 flex-shrink-0">
                  {event.organizer.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-950 text-base">{event.organizer}</h4>
                  <p className="text-xs text-zinc-500">Verified Event Organizer • Entra Partner</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Ticket Purchase Card */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24">
              <div className="bg-zinc-100 rounded-3xl overflow-hidden">
                <div className="p-5 sm:p-6 pb-2">
                  <h3 className="text-lg font-black text-zinc-950">Pilih Tiket</h3>
                </div>
                <div className="p-5 sm:p-6 pt-0">
                  <TicketSelector 
                    ticketTypes={event.tickets as unknown as TicketType[]} 
                    eventId={String(event.id)}
                    onSelect={async (selected, appliedPromo) => {
                      if (!user) {
                        router.push('/login');
                        return;
                      }
                      
                      if (selected.length === 0) return;
                      try {
                        setCheckoutLoading(true);
                        const totalRawSubtotal = selected.reduce((sum, item) => {
                          const t = event.tickets.find((tk) => tk.id === item.ticketTypeId);
                          return sum + (t?.price || 0) * item.quantity;
                        }, 0);

                        let lastOrderId = '';
                        for (const item of selected) {
                          const ticketData = event.tickets.find((t) => t.id === item.ticketTypeId);
                          const basePrice = ticketData?.price || 0;
                          let unitPrice = basePrice;
                          if (appliedPromo && appliedPromo.discountAmount > 0 && totalRawSubtotal > 0) {
                            const itemSubtotal = basePrice * item.quantity;
                            const itemDiscount = (itemSubtotal / totalRawSubtotal) * appliedPromo.discountAmount;
                            const finalItemSubtotal = Math.max(0, itemSubtotal - itemDiscount);
                            unitPrice = item.quantity > 0 ? Math.round((finalItemSubtotal / item.quantity) * 100) / 100 : basePrice;
                          }

                          const orderRes = await ticketApi.post<{ id: string }>('/api/v1/tickets/orders', {
                            event_id: event.id,
                            ticket_type_id: item.ticketTypeId,
                            quantity: item.quantity,
                            price: unitPrice
                          });
                          if (orderRes?.data?.id) {
                            lastOrderId = orderRes.data.id;
                          }
                        }

                        setCreatedOrderId(lastOrderId);

                        setModalData({
                          isOpen: true,
                          title: 'Pemesanan Berhasil',
                          message: appliedPromo 
                            ? `Pesanan tiket berhasil dibuat dengan kupon ${appliedPromo.promoCode}! Anda dapat langsung membayar sekarang atau melanjutkannya di halaman Tiket Saya.`
                            : 'Pesanan tiket Anda berhasil dibuat dan berstatus PENDING. Silakan selesaikan pembayaran untuk menerbitkan tiket.',
                          type: 'success'
                        });
                      } catch (error: unknown) {
                        const errMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat memesan tiket';
                        setModalData({
                          isOpen: true,
                          title: 'Gagal Memesan Tiket',
                          message: 'Terjadi kesalahan: ' + errMsg,
                          type: 'error'
                        });
                      } finally {
                        setCheckoutLoading(false);
                      }
                    }} 
                  />
                  {checkoutLoading && <p className="text-xs text-zinc-500 mt-3 text-center animate-pulse">Memproses pesanan tiket...</p>}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal 
        isOpen={modalData.isOpen} 
        onClose={() => {
          setModalData({...modalData, isOpen: false});
          if (modalData.type === 'success') {
            router.push('/my-tickets');
          }
        }} 
        title={modalData.title}
      >
        <div className="text-center py-4 space-y-5">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${modalData.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {modalData.type === 'success' ? (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <p className="text-zinc-600 text-sm leading-relaxed max-w-sm mx-auto">{modalData.message}</p>
          {modalData.type === 'success' ? (
            <div className="space-y-2 pt-2">
              {createdOrderId && (
                <Button 
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 rounded-full"
                  onClick={() => handlePayOrder(createdOrderId)}
                  disabled={isPaying}
                >
                  {isPaying ? 'Menghubungkan Gateway...' : 'Bayar Sekarang Langsung'}
                </Button>
              )}
              <Button 
                variant="outline"
                className="w-full bg-zinc-100 hover:bg-zinc-200 border-none text-zinc-800 rounded-full"
                onClick={() => {
                  setModalData({...modalData, isOpen: false});
                  router.push('/my-tickets');
                }}
              >
                Lihat di Tiket Saya
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-full"
              onClick={() => setModalData({...modalData, isOpen: false})}
            >
              Tutup
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
