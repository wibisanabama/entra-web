'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ticketApi, eventApi } from '@/lib/api';
import { EnrichedTicket, Order, Event as EventType, Ticket } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { ETicketModal } from '@/components/features/ETicketModal';
import {
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  QrCode,
  CreditCard,
  ArrowRight,
  Search,
  RefreshCw,
  Clock,
  ShoppingBag,
  SendHorizontal,
  Printer,
  FileText,
  X
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

export default function MyTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'tickets' | 'orders'>('tickets');
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  // E-Ticket Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState<EnrichedTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transfer Ticket Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferTicket, setTransferTicket] = useState<EnrichedTicket | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Invoice Modal State
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchUserTicketsAndOrders = useCallback(async () => {
    if (!user) return;
    try {
      const [ticketsRes, ordersRes, eventsRes] = await Promise.all([
        ticketApi.get<Ticket[]>('/api/v1/tickets').catch(() => ({ success: false, data: [] as Ticket[] })),
        ticketApi.get<Order[]>('/api/v1/tickets/orders').catch(() => ({ success: false, data: [] as Order[] })),
        eventApi.get<EventType[]>('/api/v1/events').catch(() => ({ success: false, data: [] as EventType[] })),
      ]);

      const rawTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
      const rawOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const rawEvents: EventType[] = Array.isArray(eventsRes.data) ? eventsRes.data : [];

      // Create a map of events by ID for quick lookup
      const eventMap = new Map<string, EventType>();
      rawEvents.forEach((ev) => eventMap.set(ev.id, ev));

      // Enrich tickets with event data and ticket type details
      const enriched: EnrichedTicket[] = (rawTickets as Ticket[]).map((t) => {
        const ev = eventMap.get(t.event_id);
        const tt = ev?.ticket_types?.find((type) => type.id === t.ticket_type_id);
        return {
          ...t,
          event: ev,
          ticket_type: tt,
        };
      });

      setTickets(enriched);
      setOrders(rawOrders as Order[]);
    } catch (error) {
      console.error('Failed to fetch user tickets:', error);
      toast.error('Gagal memuat daftar tiket Anda.');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserTicketsAndOrders();
    }
  }, [user, authLoading, fetchUserTicketsAndOrders]);

  const loading = authLoading || (user ? dataLoading : false);

  const handlePayOrder = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
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
          fetchUserTicketsAndOrders();
          return;
        } catch {
          // If simulate fails, fall through
        }
      }

      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(token, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil! E-Ticket Anda telah aktif.');
            fetchUserTicketsAndOrders();
          },
          onPending: () => {
            toast.info('Menunggu penyelesaian pembayaran.');
            fetchUserTicketsAndOrders();
          },
          onError: () => {
            toast.error('Pembayaran gagal atau dibatalkan.');
          },
          onClose: () => {
            toast.info('Jendela pembayaran ditutup.');
          },
        });
      } else {
        toast.error('Midtrans Snap gateway belum siap.');
      }
    } catch (error: unknown) {
      console.error('Payment error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memulai transaksi pembayaran.';
      toast.error(errMsg);
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleSimulatePayment = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
      await ticketApi.post(`/api/v1/tickets/orders/${orderId}/simulate`);
      toast.success('Pembayaran simulasi dev berhasil! Tiket Anda telah aktif.');
      await fetchUserTicketsAndOrders();
    } catch (error: unknown) {
      console.error('Simulate payment error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal simulasi pembayaran';
      toast.error(errMsg);
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTicket) return;
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      toast.error('Masukkan alamat email penerima yang valid');
      return;
    }

    try {
      setTransferLoading(true);
      await ticketApi.post(`/api/v1/tickets/${transferTicket.id}/transfer`, {
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim() || 'Teman / Kerabat',
      });

      toast.success(`Tiket ${transferTicket.ticket_code} berhasil ditransfer ke ${recipientEmail.trim()}!`);
      setIsTransferOpen(false);
      setTransferTicket(null);
      setRecipientEmail('');
      setRecipientName('');
      fetchUserTicketsAndOrders();
    } catch (error: unknown) {
      console.error('Transfer error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal mentransfer tiket.';
      toast.error(errMsg);
    } finally {
      setTransferLoading(false);
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesFilter =
      ticketFilter === 'ALL' ||
      (ticketFilter === 'ACTIVE' && t.status?.toUpperCase() === 'ACTIVE') ||
      (ticketFilter === 'USED' && t.status?.toUpperCase() === 'USED');

    const matchesSearch =
      searchQuery === '' ||
      t.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.event?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_type?.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeTicketsCount = tickets.filter((t) => t.status?.toUpperCase() === 'ACTIVE').length;
  const distinctEventsCount = new Set(tickets.map((t) => t.event_id)).size;

  // Slider indicators for Main Tabs & Filter Tabs ala Category Selector
  const mainTabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [mainIndicatorStyle, setMainIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [mainTabsReady, setMainTabsReady] = useState(false);

  const filterTabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterIndicatorStyle, setFilterIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [filterTabsReady, setFilterTabsReady] = useState(false);

  // Update Main Tabs Indicator
  useEffect(() => {
    const activeEl = mainTabsRef.current[activeTab];
    if (activeEl) {
      setMainIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
      if (!mainTabsReady) {
        const timer = setTimeout(() => setMainTabsReady(true), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, tickets.length, orders.length, mainTabsReady]);

  // Update Filter Tabs Indicator
  useEffect(() => {
    if (activeTab !== 'tickets') return;
    const activeEl = filterTabsRef.current[ticketFilter];
    if (activeEl) {
      setFilterIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
      if (!filterTabsReady) {
        const timer = setTimeout(() => setFilterTabsReady(true), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [ticketFilter, activeTab, tickets.length, activeTicketsCount, filterTabsReady]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      const activeMainEl = mainTabsRef.current[activeTab];
      if (activeMainEl) {
        setMainIndicatorStyle({
          left: activeMainEl.offsetLeft,
          width: activeMainEl.offsetWidth,
        });
      }
      const activeFilterEl = filterTabsRef.current[ticketFilter];
      if (activeFilterEl) {
        setFilterIndicatorStyle({
          left: activeFilterEl.offsetLeft,
          width: activeFilterEl.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, ticketFilter]);

  if (!authLoading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-zinc-900">
        <div className="text-center max-w-md mx-auto space-y-6 bg-zinc-100 p-8 sm:p-10 rounded-3xl border-0 shadow-none">
          <div className="p-4 bg-white text-zinc-900 rounded-full w-16 h-16 mx-auto flex items-center justify-center border-0 shadow-none">
            <TicketIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-950 mb-2">Masuk untuk Melihat Tiket</h2>
            <p className="text-zinc-500 text-sm">
              Silakan masuk ke akun Entra Anda untuk mengakses e-ticket digital dan riwayat pesanan.
            </p>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-full py-3 border-0 shadow-none">
              Masuk ke Akun
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tight">Tiket & Pesanan Saya</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Kelola e-ticket digital Anda, transfer ke teman, cetak PDF resmi, dan pantau riwayat transaksi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchUserTicketsAndOrders}
            disabled={loading}
            className="flex items-center gap-2 text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border-0 rounded-full text-xs font-semibold px-4 py-2.5 shadow-none"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/events">
            <Button className="bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-2 rounded-full text-xs font-semibold px-4 py-2.5 border-0 shadow-none">
              <ShoppingBag className="h-4 w-4" />
              Beli Tiket Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-zinc-100 rounded-3xl p-6 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Tiket Aktif Siap Pakai
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1 bg-zinc-200" />
              ) : (
                <h3 className="text-3xl font-black text-zinc-950 mb-1">{activeTicketsCount}</h3>
              )}
              <p className="text-xs text-zinc-500">Gunakan QR code di pintu masuk</p>
            </div>
            <div className="p-3 bg-white text-zinc-900 rounded-2xl border-0 shadow-none">
              <QrCode className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-100 rounded-3xl p-6 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Tiket Dimiliki
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1 bg-zinc-200" />
              ) : (
                <h3 className="text-3xl font-black text-zinc-950 mb-1">{tickets.length}</h3>
              )}
              <p className="text-xs text-zinc-500">Semua riwayat tiket</p>
            </div>
            <div className="p-3 bg-white text-zinc-900 rounded-2xl border-0 shadow-none">
              <TicketIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-zinc-100 rounded-3xl p-6 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Event Diikuti
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1 bg-zinc-200" />
              ) : (
                <h3 className="text-3xl font-black text-zinc-950 mb-1">{distinctEventsCount}</h3>
              )}
              <p className="text-xs text-zinc-500">Acara konser, festival & seminar</p>
            </div>
            <div className="p-3 bg-white text-zinc-900 rounded-2xl border-0 shadow-none">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex justify-center w-full">
        <div className="relative inline-flex items-center p-1 sm:p-1.5 bg-zinc-200/80 rounded-full gap-1 w-full max-w-md lg:w-[calc((100%-3rem)/3)]">
          {/* Sliding Capsule Highlight */}
          <div
            className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-white pointer-events-none shadow-xs ${
              mainTabsReady
                ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                : 'transition-none'
            }`}
            style={{
              left: `${mainIndicatorStyle.left}px`,
              width: `${mainIndicatorStyle.width}px`,
              opacity: mainIndicatorStyle.width > 0 ? 1 : 0,
            }}
          />

          <button
            ref={(el) => {
              mainTabsRef.current['tickets'] = el;
            }}
            onClick={() => setActiveTab('tickets')}
            className={`relative z-10 flex-1 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'tickets' ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <TicketIcon className="h-4 w-4 flex-shrink-0" />
            <span>E-Ticket Digital ({tickets.length})</span>
          </button>

          <button
            ref={(el) => {
              mainTabsRef.current['orders'] = el;
            }}
            onClick={() => setActiveTab('orders')}
            className={`relative z-10 flex-1 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'orders' ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <CreditCard className="h-4 w-4 flex-shrink-0" />
            <span>Riwayat Pesanan ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: E-TICKETS DIGITAL VIEW */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative inline-flex items-center p-1 sm:p-1.5 bg-zinc-200/80 rounded-full gap-1 w-full max-w-md lg:w-[calc((100%-3rem)/3)]">
              {/* Sliding Capsule Highlight */}
              <div
                className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-white pointer-events-none shadow-xs ${
                  filterTabsReady
                    ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                    : 'transition-none'
                }`}
                style={{
                  left: `${filterIndicatorStyle.left}px`,
                  width: `${filterIndicatorStyle.width}px`,
                  opacity: filterIndicatorStyle.width > 0 ? 1 : 0,
                }}
              />

              <button
                ref={(el) => {
                  filterTabsRef.current['ALL'] = el;
                }}
                onClick={() => setTicketFilter('ALL')}
                className={`relative z-10 flex-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer text-center ${
                  ticketFilter === 'ALL' ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Semua ({tickets.length})
              </button>
              <button
                ref={(el) => {
                  filterTabsRef.current['ACTIVE'] = el;
                }}
                onClick={() => setTicketFilter('ACTIVE')}
                className={`relative z-10 flex-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer text-center ${
                  ticketFilter === 'ACTIVE' ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Siap Digunakan ({activeTicketsCount})
              </button>
              <button
                ref={(el) => {
                  filterTabsRef.current['USED'] = el;
                }}
                onClick={() => setTicketFilter('USED')}
                className={`relative z-10 flex-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer text-center ${
                  ticketFilter === 'USED' ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-950'
                }`}
              >
                Sudah Digunakan ({tickets.length - activeTicketsCount})
              </button>
            </div>

            <div className="relative flex items-center p-1 sm:p-1.5 bg-zinc-200/80 rounded-full w-full max-w-md lg:w-[calc((100%-3rem)/3)]">
              <Search className="absolute left-3.5 sm:left-4 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari event, kode tiket..."
                aria-label="Cari event, kode tiket"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-9 pr-8 py-1.5 bg-transparent rounded-full text-xs font-medium text-zinc-950 placeholder-zinc-500 border-0 outline-none ring-0 focus:outline-none focus:ring-0 shadow-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer rounded-full"
                  aria-label="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tickets Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-zinc-100 p-6 rounded-3xl space-y-4 border-0 shadow-none">
                  <Skeleton className="h-6 w-3/4 bg-zinc-200/70" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-200/70" />
                  <Skeleton className="h-20 w-full bg-zinc-200/70" />
                  <Skeleton className="h-10 w-full bg-zinc-200/70 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-16 bg-zinc-100 rounded-3xl p-8 space-y-4 border-0 shadow-none">
              <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto flex items-center justify-center text-zinc-400 border-0 shadow-none">
                <TicketIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Tidak ada tiket ditemukan</h3>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto mt-1">
                  {searchQuery || ticketFilter !== 'ALL'
                    ? 'Coba ubah kata kunci pencarian atau filter status tiket Anda.'
                    : 'Anda belum memiliki tiket event. Jelajahi event menarik dan pesan tiket sekarang!'}
                </p>
              </div>
              <Link href="/events">
                <Button className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full text-xs mt-2 px-6 py-2.5 border-0 shadow-none">
                  Jelajahi Event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTickets.map((t) => {
                const isActive = t.status?.toUpperCase() === 'ACTIVE';
                const isUsed = t.status?.toUpperCase() === 'USED';

                return (
                  <div
                    key={t.id}
                    className="bg-zinc-100 rounded-3xl overflow-hidden flex flex-col justify-between group border-0 shadow-none transition-all"
                  >
                    {/* Top Ticket Header */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border-0 ${
                            isActive
                              ? 'bg-emerald-200/70 text-emerald-800'
                              : isUsed
                              ? 'bg-zinc-200 text-zinc-700'
                              : 'bg-rose-200/70 text-rose-800'
                          }`}
                        >
                          {isActive ? 'Siap Digunakan' : isUsed ? 'Sudah Dipakai' : t.status}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          {t.ticket_type?.name || 'Tiket Masuk'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-zinc-950 line-clamp-2 group-hover:text-zinc-700 transition-colors">
                        {t.event?.title || 'Event Entra'}
                      </h3>

                      <div className="space-y-1.5 text-xs text-zinc-500 pt-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                            <span>
                              {t.event?.start_date ? formatDate(t.event.start_date) : 'Waktu menyusul'}
                            </span>
                          </div>
                          {t.event?.start_date && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                              <span>
                                {formatTime(t.event.start_date, t.event.end_date)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                          <span className="truncate">
                            {t.event?.venue?.name || t.event?.venue?.address || 'Lokasi Acara'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Perforated Divider (Seamless cutouts without borders) */}
                    <div className="relative flex items-center justify-between">
                      <div className="w-4 h-6 bg-white rounded-r-full -ml-1"></div>
                      <div className="w-full h-px bg-zinc-200 mx-2"></div>
                      <div className="w-4 h-6 bg-white rounded-l-full -mr-1"></div>
                    </div>

                    {/* Ticket Code & Actions */}
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Kode Tiket
                        </span>
                        <span className="font-mono text-sm font-black text-zinc-950">
                          {t.ticket_code}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(t);
                            setIsModalOpen(true);
                          }}
                          className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-full border-0 shadow-none"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          Buka E-Ticket
                        </Button>

                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTransferTicket(t);
                              setIsTransferOpen(true);
                            }}
                            className="bg-white hover:bg-zinc-200 text-zinc-800 text-xs px-3.5 py-2.5 rounded-full border-0 shadow-none font-semibold"
                            title="Transfer Tiket ke Teman"
                          >
                            <SendHorizontal className="h-3.5 w-3.5 text-zinc-700" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS & INVOICE VIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-zinc-100 p-5 space-y-2 rounded-3xl border-0 shadow-none">
                  <Skeleton className="h-6 w-1/4 bg-zinc-200/70" />
                  <Skeleton className="h-4 w-1/2 bg-zinc-200/70" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-zinc-100 rounded-3xl p-8 space-y-4 border-0 shadow-none">
              <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto flex items-center justify-center text-zinc-400 border-0 shadow-none">
                <CreditCard className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-950">Belum Ada Riwayat Pesanan</h3>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto mt-1">
                  Seluruh riwayat pembayaran dan status transaksi tiket Anda akan tercatat di sini.
                </p>
              </div>
              <Link href="/events">
                <Button className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full text-xs mt-2 px-6 py-2.5 border-0 shadow-none">
                  Pesan Tiket Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isPaid = order.status?.toUpperCase() === 'PAID';
                const isPending = order.status?.toUpperCase() === 'PENDING';

                return (
                  <div
                    key={order.id}
                    className="bg-zinc-100 p-5 sm:p-6 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border-0 shadow-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-zinc-950">
                          Order #{order.id.substring(0, 8)}...
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border-0 ${
                            isPaid
                              ? 'bg-emerald-200/70 text-emerald-800'
                              : isPending
                              ? 'bg-amber-200/70 text-amber-800'
                              : 'bg-rose-200/70 text-rose-800'
                          }`}
                        >
                          {isPaid ? 'LUNAS' : isPending ? 'MENUNGGU PEMBAYARAN' : order.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-1">
                        <span>Waktu Pesan: {formatDate(order.created_at)}</span>
                        {isPending && order.expires_at && (
                          <span className="text-amber-600 flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            Batas Bayar: {formatDate(order.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-zinc-400 block font-medium">Total Tagihan</span>
                        <span className="text-lg font-black text-zinc-950 font-mono">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrderForInvoice(order);
                              setIsInvoiceOpen(true);
                            }}
                            className="bg-white hover:bg-zinc-200 text-zinc-800 text-xs flex items-center gap-1.5 rounded-full border-0 shadow-none font-semibold px-4 py-2.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-zinc-600" />
                            Lihat Invoice
                          </Button>
                        )}

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSimulatePayment(order.id)}
                              disabled={payingOrderId === order.id}
                              className="bg-white hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-full border-0 shadow-none px-4 py-2.5"
                              title="Simulasikan pembayaran langsung di mode pengembangan"
                            >
                              {payingOrderId === order.id ? 'Memproses...' : 'Simulasi Bayar (Dev)'}
                            </Button>
                            <Button
                              onClick={() => handlePayOrder(order.id)}
                              disabled={payingOrderId === order.id}
                              className="bg-zinc-950 hover:bg-zinc-800 text-white flex items-center gap-1.5 text-xs font-semibold rounded-full border-0 shadow-none px-5 py-2.5"
                            >
                              {payingOrderId === order.id ? 'Memuat...' : 'Bayar Sekarang'}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive ETicket Modal */}
      <ETicketModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onOpenTransfer={(t) => {
          setTransferTicket(t);
          setIsTransferOpen(true);
        }}
      />

      {/* MODAL: Transfer Tiket ke Teman */}
      {isTransferOpen && transferTicket && (
        <Modal
          isOpen={isTransferOpen}
          onClose={() => !transferLoading && setIsTransferOpen(false)}
          title="Transfer Tiket ke Pengguna Lain"
        >
          <form onSubmit={handleTransferSubmit} className="space-y-4 text-zinc-900">
            <div className="p-4 bg-zinc-100 rounded-2xl text-xs text-zinc-600 space-y-1 border-0">
              <p className="text-zinc-950 font-semibold flex items-center gap-1.5">
                <SendHorizontal className="h-4 w-4 text-zinc-700" />
                Pindah Kepemilikan Tiket
              </p>
              <p>
                Tiket yang ditransfer akan berpindah ke akun penerima dan tidak dapat lagi Anda gunakan di gerbang masuk.
              </p>
            </div>

            {/* Ticket Snapshot Card */}
            <div className="p-4 bg-zinc-100 rounded-2xl space-y-1 border-0">
              <p className="text-xs text-zinc-950 font-bold">{transferTicket.event?.title || 'Event'}</p>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{transferTicket.ticket_type?.name || 'Tiket'}</span>
                <span className="font-mono text-zinc-950 font-bold">{transferTicket.ticket_code}</span>
              </div>
            </div>

            {/* Recipient Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Email Penerima
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 bg-zinc-100 rounded-full text-zinc-900 font-medium text-sm border-0 outline-none ring-0 focus:outline-none focus:ring-0 shadow-none placeholder-zinc-400"
                required
              />
            </div>

            {/* Recipient Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Nama Penerima (Opsional)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Nama Teman / Kerabat"
                className="w-full px-4 py-3 bg-zinc-100 rounded-full text-zinc-900 font-medium text-sm border-0 outline-none ring-0 focus:outline-none focus:ring-0 shadow-none placeholder-zinc-400"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={transferLoading}
                onClick={() => setIsTransferOpen(false)}
                className="rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs border-0 shadow-none font-semibold px-5 py-2.5"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={transferLoading || !recipientEmail.trim()}
                className="bg-zinc-950 hover:bg-zinc-800 text-white px-6 font-semibold flex items-center gap-1.5 rounded-full text-xs border-0 shadow-none py-2.5"
              >
                {transferLoading ? 'Mentransfer...' : 'Kirim Tiket Sekarang'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Invoice Pembayaran Resmi */}
      {isInvoiceOpen && selectedOrderForInvoice && (
        <Modal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          title="Invoice Pembayaran Resmi"
        >
          <div className="space-y-5 print:p-0 text-zinc-900">
            <div id="printable-invoice" className="p-6 bg-zinc-100 rounded-3xl space-y-4 border-0 shadow-none">
              <div className="flex justify-between items-start pb-4 border-0">
                <div>
                  <h3 className="text-lg font-black text-zinc-950">INVOICE ENTRA</h3>
                  <p className="text-xs text-zinc-500">Order #{selectedOrderForInvoice.id.substring(0, 16)}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-200/70 text-emerald-800 border-0 rounded-full">
                  LUNAS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-600">
                <div>
                  <span className="text-zinc-400 block font-semibold uppercase tracking-wider text-[10px]">Diterbitkan untuk:</span>
                  <span className="text-zinc-950 font-bold">{user?.full_name || 'Pembeli Tiket'}</span>
                  <span className="block text-[11px] text-zinc-500">{user?.email}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block font-semibold uppercase tracking-wider text-[10px]">Waktu Transaksi:</span>
                  <span className="text-zinc-950 font-bold">{formatDate(selectedOrderForInvoice.created_at)}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center text-sm bg-white/70 p-4 rounded-2xl border-0">
                <span className="text-zinc-700 font-bold">Total Pembayaran</span>
                <span className="text-xl font-black text-zinc-950 font-mono">
                  {formatCurrency(selectedOrderForInvoice.total_amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 print:hidden">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-full border-0 font-semibold px-4 py-2.5 shadow-none"
              >
                <Printer className="h-4 w-4" />
                Cetak Invoice
              </Button>
              <Button
                onClick={() => setIsInvoiceOpen(false)}
                className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold rounded-full px-6 py-2.5 border-0 shadow-none"
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
