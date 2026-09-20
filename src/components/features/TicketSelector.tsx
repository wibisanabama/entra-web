'use client';

import React, { useState } from 'react';
import { TicketType } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency, getPgText } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface TicketSelectorProps {
  ticketTypes: TicketType[];
  eventId?: string;
  eventEndDate?: string;
  eventStatus?: string;
  initialQuantities?: Record<string, number>;
  isLoading?: boolean;
  onSelect: (
    selectedTickets: { ticketTypeId: string; quantity: number }[]
  ) => void;
}

export function TicketSelector({
  ticketTypes,
  eventEndDate,
  eventStatus,
  initialQuantities,
  isLoading = false,
  onSelect,
}: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities || {});
  const [isDebouncing, setIsDebouncing] = useState(false);

  React.useEffect(() => {
    if (initialQuantities && Object.keys(initialQuantities).length > 0) {
      setQuantities(initialQuantities);
    }
  }, [initialQuantities]);

  const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    return parseFloat(price) || 0;
  };

  const getTicketQuota = (ticket: TicketType): number => {
    if (typeof ticket.quantity === 'number') {
      const sold = ticket.sold || 0;
      return Math.max(0, ticket.quantity - sold);
    }
    return 0;
  };

  const handleQuantityChange = (id: string, delta: number, max: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(current + delta, max, 10)); // max 10 per transaction or available quota
      return { ...prev, [id]: next };
    });
  };

  const subtotalPrice = ticketTypes.reduce((sum, ticket) => {
    const priceNum = parsePrice(ticket.price);
    return sum + (priceNum * (quantities[ticket.id] || 0));
  }, 0);

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  const now = new Date();
  const isEventEnded = Boolean(
    (eventEndDate && new Date(eventEndDate).getTime() < now.getTime()) ||
    eventStatus === 'completed' ||
    eventStatus === 'cancelled'
  );

  const handleCheckout = () => {
    if (isLoading || isDebouncing || isEventEnded) return;
    const selected = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => ({ ticketTypeId: id, quantity }));
    
    if (selected.length > 0) {
      setIsDebouncing(true);
      setTimeout(() => setIsDebouncing(false), 2000);
      onSelect(selected);
    }
  };

  if (!ticketTypes || ticketTypes.length === 0) {
    return <div className="text-zinc-500 p-4 text-center rounded-2xl bg-white text-sm">Belum ada tiket yang tersedia.</div>;
  }

  return (
    <div className="space-y-4 text-zinc-900">
      {/* Event Ended Banner Notice */}
      {isEventEnded && (
        <div className="p-3.5 bg-rose-50 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 border-none">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>Event ini telah berakhir. Tiket sudah tidak dapat dibeli.</span>
        </div>
      )}

      {/* Ticket List */}
      <div className="space-y-3">
        {ticketTypes.map(ticket => {
          const qty = quantities[ticket.id] || 0;
          const quota = getTicketQuota(ticket);
          const priceNum = parsePrice(ticket.price);
          const desc = getPgText(ticket.description);

          const isInactive = ticket.is_active === false;
          const isSaleUpcoming = Boolean(ticket.sale_start && new Date(ticket.sale_start).getTime() > now.getTime());
          const isSaleEnded = Boolean(ticket.sale_end && new Date(ticket.sale_end).getTime() < now.getTime());
          const isAvailable = !isEventEnded && !isInactive && !isSaleUpcoming && !isSaleEnded && quota > 0;

          return (
            <div key={ticket.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-2xl">
              <div className="mb-3 sm:mb-0">
                <h4 className="text-base font-bold text-zinc-950">{ticket.name}</h4>
                {desc && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{desc}</p>}
                <div className="mt-1 font-extrabold text-zinc-950 text-sm">
                  {priceNum === 0 ? 'Gratis' : formatCurrency(priceNum)}
                </div>
                <div className="text-[11px] mt-0.5">
                  {isEventEnded ? (
                    <span className="font-semibold text-rose-600">Event Berakhir</span>
                  ) : isInactive ? (
                    <span className="font-semibold text-zinc-400">Tidak Aktif</span>
                  ) : isSaleEnded ? (
                    <span className="font-semibold text-rose-600">Penjualan Berakhir</span>
                  ) : isSaleUpcoming ? (
                    <span className="font-semibold text-amber-600">Segera Hadir</span>
                  ) : quota <= 0 ? (
                    <span className="font-semibold text-zinc-500">Tiket Habis (Sold Out)</span>
                  ) : (
                    <span className="text-zinc-400">Sisa kuota: {quota} tiket</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleQuantityChange(ticket.id, -1, quota)}
                  disabled={qty === 0 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-950 hover:text-white transition-colors font-bold text-base"
                >
                  -
                </button>
                <span className="w-6 text-center font-bold text-zinc-950 text-sm">{qty}</span>
                <button
                  onClick={() => handleQuantityChange(ticket.id, 1, quota)}
                  disabled={qty >= quota || qty >= 10 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-950 hover:text-white transition-colors font-bold text-base"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Summary & Action */}
      <div className="pt-2 space-y-3">
        <div className="space-y-1.5 text-xs text-zinc-500">
          <div className="flex justify-between items-center">
            <span>Subtotal Tiket ({totalTickets} tiket)</span>
            <span className="text-zinc-900 font-semibold">{formatCurrency(subtotalPrice)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 text-sm">
            <span className="text-zinc-800 font-bold">Total Pembayaran</span>
            <span className="text-2xl font-black text-zinc-950 font-mono">
              {formatCurrency(subtotalPrice)}
            </span>
          </div>
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-full text-base border-none disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={totalTickets === 0 || isLoading || isDebouncing || isEventEnded}
          onClick={handleCheckout}
        >
          {isEventEnded
            ? 'Event Telah Berakhir'
            : (isLoading || isDebouncing 
              ? 'Memproses Tiket...' 
              : (subtotalPrice === 0 ? 'Dapatkan Tiket Gratis' : `Beli Tiket (${formatCurrency(subtotalPrice)})`))}
        </Button>
      </div>
    </div>
  );
}

