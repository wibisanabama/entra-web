'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ticketApi, eventApi } from '@/lib/api';
import { EnrichedTicket, Order, Event as EventType } from '@/types';
import { formatCurrency, formatDate, getPgText } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
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
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: {
        onSuccess: (result: any) => void;
        onPending: (result: any) => void;
        onError: (result: any) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

export default function MyTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'orders'>('tickets');
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EnrichedTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const fetchUserTicketsAndOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [ticketsRes, ordersRes, eventsRes] = await Promise.all([
        ticketApi.get('/api/v1/tickets').catch(() => ({ data: [] })),
        ticketApi.get('/api/v1/tickets/orders').catch(() => ({ data: [] })),
        eventApi.get('/api/v1/events').catch(() => ({ data: [] })),
      ]);

      const rawTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
      const rawOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const rawEvents: EventType[] = Array.isArray(eventsRes.data) ? eventsRes.data : [];

      // Create a map of events by ID for quick lookup
      const eventMap = new Map<string, EventType>();
      rawEvents.forEach((ev) => eventMap.set(ev.id, ev));

      // Enrich tickets with event data and ticket type details
      const enriched: EnrichedTicket[] = rawTickets.map((t: any) => {
        const ev = eventMap.get(t.event_id);
        const tt = ev?.ticket_types?.find((type) => type.id === t.ticket_type_id);
        return {
          ...t,
          event: ev,
          ticket_type: tt,
        };
      });

      setTickets(enriched);
      setOrders(rawOrders);
    } catch (error) {
      console.error('Failed to fetch user tickets:', error);
      toast.error('Gagal memuat daftar tiket Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserTicketsAndOrders();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handlePayOrder = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
      const res = await ticketApi.post(`/api/v1/tickets/orders/${orderId}/pay`);
      const token = res.data?.token || res.data;

      if (!token) {
        throw new Error('Token pembayaran tidak ditemukan.');
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
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Gagal memulai transaksi pembayaran.');
    } finally {
      setPayingOrderId(null);
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

  if (!authLoading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-md mx-auto space-y-6 bg-gray-900 border border-gray-800 p-8 rounded-2xl">
          <div className="p-4 bg-violet-600/20 text-violet-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <TicketIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Masuk untuk Melihat Tiket</h2>
            <p className="text-gray-400 text-sm">
              Silakan masuk ke akun Entra Anda untuk mengakses e-ticket digital dan riwayat pesanan.
            </p>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              Masuk ke Akun
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-violet-600/20 text-violet-400 rounded-lg">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Customer Portal
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Tiket & Pesanan Saya</h1>
          <p className="text-gray-400 text-sm mt-1">
            Kelola e-ticket digital Anda, tampilkan QR code saat masuk gate, dan pantau riwayat transaksi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchUserTicketsAndOrders}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/events">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Beli Tiket Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-violet-950/60 via-gray-900 to-gray-900 border-violet-500/30 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Tiket Aktif Siap Pakai
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <h3 className="text-3xl font-bold text-white mb-1">{activeTicketsCount}</h3>
              )}
              <p className="text-xs text-gray-400">Gunakan QR code di pintu masuk</p>
            </div>
            <div className="p-3 bg-violet-600/20 text-violet-400 rounded-xl">
              <QrCode className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                Total Tiket Dimiliki
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <h3 className="text-3xl font-bold text-white mb-1">{tickets.length}</h3>
              )}
              <p className="text-xs text-gray-500">Semua riwayat tiket</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <TicketIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                Total Event Diikuti
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <h3 className="text-3xl font-bold text-white mb-1">{distinctEventsCount}</h3>
              )}
              <p className="text-xs text-gray-500">Acara konser, festival & seminar</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-gray-800 space-x-8">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'tickets'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <TicketIcon className="h-4 w-4" />
          E-Ticket Digital ({tickets.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Riwayat Pesanan & Invoice ({orders.length})
        </button>
      </div>

      {/* TAB 1: E-TICKETS DIGITAL VIEW */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs w-fit">
              <button
                onClick={() => setTicketFilter('ALL')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  ticketFilter === 'ALL' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Semua ({tickets.length})
              </button>
              <button
                onClick={() => setTicketFilter('ACTIVE')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  ticketFilter === 'ACTIVE' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Siap Digunakan ({activeTicketsCount})
              </button>
              <button
                onClick={() => setTicketFilter('USED')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  ticketFilter === 'USED' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Sudah Digunakan ({tickets.length - activeTicketsCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cari event, kode tiket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Tickets Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-4">
              <div className="p-4 bg-gray-800/60 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-gray-500">
                <TicketIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Tidak ada tiket ditemukan</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto mt-1">
                  {searchQuery || ticketFilter !== 'ALL'
                    ? 'Coba ubah kata kunci pencarian atau filter status tiket Anda.'
                    : 'Anda belum memiliki tiket event. Jelajahi event menarik dan pesan tiket sekarang!'}
                </p>
              </div>
              <Link href="/events">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white mt-2">
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
                  <Card
                    key={t.id}
                    className="bg-gray-900 border-gray-800 hover:border-violet-500/50 transition-all rounded-2xl overflow-hidden flex flex-col justify-between group shadow-lg"
                  >
                    {/* Top Ticket Header */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant={isActive ? 'success' : isUsed ? 'secondary' : 'error'}
                          className="text-[11px]"
                        >
                          {isActive ? 'Siap Digunakan' : isUsed ? 'Sudah Dipakai' : t.status}
                        </Badge>
                        <span className="text-xs font-mono text-gray-500">
                          {t.ticket_type?.name || 'Tiket Masuk'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-violet-300 transition-colors">
                        {t.event?.title || 'Event Entra'}
                      </h3>

                      <div className="space-y-1.5 text-xs text-gray-400 pt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                          <span>
                            {t.event?.start_date ? formatDate(t.event.start_date) : 'Waktu menyusul'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                          <span className="truncate">
                            {t.event?.venue?.name || t.event?.venue?.address || 'Lokasi Acara'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Perforated Divider */}
                    <div className="relative flex items-center justify-between">
                      <div className="w-4 h-6 bg-gray-950 rounded-r-full border-r border-gray-800"></div>
                      <div className="w-full border-b border-dashed border-gray-800 mx-2"></div>
                      <div className="w-4 h-6 bg-gray-950 rounded-l-full border-l border-gray-800"></div>
                    </div>

                    {/* Ticket Code & Action */}
                    <div className="p-5 bg-gray-950/40 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                          Kode Tiket
                        </span>
                        <span className="font-mono text-sm font-bold text-violet-400">
                          {t.ticket_code}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(t);
                          setIsModalOpen(true);
                        }}
                        className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-1.5 text-xs"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        Buka E-Ticket
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS & INVOICE VIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 p-5 space-y-2">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-4">
              <div className="p-4 bg-gray-800/60 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-gray-500">
                <CreditCard className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Belum Ada Riwayat Pesanan</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto mt-1">
                  Seluruh riwayat pembayaran dan status transaksi tiket Anda akan tercatat di sini.
                </p>
              </div>
              <Link href="/events">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white mt-2">
                  Pesan Tiket Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaid = order.status?.toUpperCase() === 'PAID';
                const isPending = order.status?.toUpperCase() === 'PENDING';
                const isExpired = order.status?.toUpperCase() === 'EXPIRED';

                return (
                  <Card
                    key={order.id}
                    className="bg-gray-900 border-gray-800 p-5 hover:border-gray-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-white">
                          Order #{order.id.substring(0, 8)}...
                        </span>
                        <Badge
                          variant={isPaid ? 'success' : isPending ? 'warning' : 'error'}
                          className="text-xs"
                        >
                          {isPaid ? 'LUNAS' : isPending ? 'MENUNGGU PEMBAYARAN' : order.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                        <span>Waktu Pesan: {formatDate(order.created_at)}</span>
                        {isPending && order.expires_at && (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Batas Bayar: {formatDate(order.expires_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-gray-800 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-gray-500 block">Total Tagihan</span>
                        <span className="text-lg font-extrabold text-white">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>

                      {isPending && (
                        <Button
                          onClick={() => handlePayOrder(order.id)}
                          disabled={payingOrderId === order.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-bold"
                        >
                          {payingOrderId === order.id ? 'Memuat...' : 'Bayar Sekarang'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive Modal */}
      <ETicketModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />
    </div>
  );
}
