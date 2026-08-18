'use client';

import React, { useState } from 'react';
import { TicketType } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency, getPgText } from '@/lib/utils';
import { ticketApi } from '@/lib/api';
import { Tag, Sparkles, Check, X, Percent } from 'lucide-react';
import { toast } from 'sonner';

export interface AppliedPromo {
  promoCode: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalTotal: number;
  message: string;
}

export interface TicketSelectorProps {
  ticketTypes: TicketType[];
  eventId?: string;
  onSelect: (
    selectedTickets: { ticketTypeId: string; quantity: number }[],
    appliedPromo?: AppliedPromo | null
  ) => void;
}

const SUGGESTED_PROMOS = ['ENTRA20', 'FESTIVAL50', 'WELCOME10'];

export function TicketSelector({ ticketTypes, eventId, onSelect }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);

  const parsePrice = (price: string | number): number => {
    if (typeof price === 'number') return price;
    return parseFloat(price) || 0;
  };

  const getTicketQuota = (ticket: any): number => {
    if (typeof ticket.quota === 'number') return ticket.quota;
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
    // Reset applied promo when quantity changes so it can be revalidated
    if (appliedPromo) {
      setAppliedPromo(null);
      toast.info('Kuantitas tiket berubah. Silakan terapkan ulang kode promo.');
    }
  };

  const subtotalPrice = ticketTypes.reduce((sum, ticket) => {
    const priceNum = parsePrice(ticket.price);
    return sum + (priceNum * (quantities[ticket.id] || 0));
  }, 0);

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  const discountAmount = appliedPromo?.discountAmount || 0;
  const finalPrice = Math.max(0, subtotalPrice - discountAmount);

  const handleApplyPromo = async (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) {
      toast.error('Masukkan kode promo terlebih dahulu');
      return;
    }
    if (totalTickets === 0 || subtotalPrice <= 0) {
      toast.error('Pilih tiket berbayar terlebih dahulu untuk menggunakan promo');
      return;
    }

    try {
      setPromoLoading(true);
      const res = await ticketApi.post<any>('/api/v1/tickets/promo/validate', {
        promo_code: code,
        subtotal: subtotalPrice,
        ticket_quantity: totalTickets,
        event_id: eventId || '',
      });

      const data = res.data?.data || res.data;
      if (data && data.is_valid) {
        setAppliedPromo({
          promoCode: data.promo_code,
          discountType: data.discount_type,
          discountValue: data.discount_value,
          discountAmount: data.discount_amount,
          finalTotal: data.final_total,
          message: data.message,
        });
        setPromoInput(data.promo_code);
        toast.success(`Kupon ${data.promo_code} berhasil diterapkan! Hemat ${formatCurrency(data.discount_amount)}`);
      } else {
        toast.error(data?.message || 'Kode promo tidak valid');
      }
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      toast.error(error.response?.data?.message || 'Gagal memvalidasi kode promo');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    toast.info('Kupon promo telah dilepas');
  };

  const handleCheckout = () => {
    const selected = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantity]) => ({ ticketTypeId: id, quantity }));
    
    if (selected.length > 0) {
      onSelect(selected, appliedPromo);
    }
  };

  if (!ticketTypes || ticketTypes.length === 0) {
    return <div className="text-gray-400 p-4 text-center rounded-lg">Belum ada tiket yang tersedia.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Ticket List */}
      <div className="space-y-4">
        {ticketTypes.map(ticket => {
          const qty = quantities[ticket.id] || 0;
          const quota = getTicketQuota(ticket);
          const isAvailable = quota > 0;
          const priceNum = parsePrice(ticket.price);
          const desc = getPgText(ticket.description);

          return (
            <div key={ticket.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-800/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="mb-3 sm:mb-0">
                <h4 className="text-base font-bold text-white">{ticket.name}</h4>
                {desc && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{desc}</p>}
                <div className="mt-1 font-bold text-violet-400 text-sm">
                  {priceNum === 0 ? 'Gratis' : formatCurrency(priceNum)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Sisa kuota: {quota} tiket
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleQuantityChange(ticket.id, -1, quota)}
                  disabled={qty === 0 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center disabled:opacity-40 hover:bg-violet-600 transition-colors font-bold text-base"
                >
                  -
                </button>
                <span className="w-5 text-center font-bold text-white text-sm">{qty}</span>
                <button
                  onClick={() => handleQuantityChange(ticket.id, 1, quota)}
                  disabled={qty >= quota || qty >= 10 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center disabled:opacity-40 hover:bg-violet-600 transition-colors font-bold text-base"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Promo Code Section */}
      {subtotalPrice > 0 && (
        <div className="p-4 bg-gray-950/80 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
              <Tag className="h-3.5 w-3.5 text-violet-400" />
              <span>Kupon Promo & Diskon</span>
            </div>
            {appliedPromo && (
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                PROMO AKTIF
              </span>
            )}
          </div>

          {/* Input & Apply Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Contoh: ENTRA20, FESTIVAL50"
                disabled={appliedPromo !== null || promoLoading}
                className="w-full px-3.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-violet-500 disabled:opacity-60"
              />
            </div>
            {appliedPromo ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemovePromo}
                className="text-xs text-rose-400 border-rose-900/40 hover:bg-rose-950/30"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Hapus
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => handleApplyPromo()}
                disabled={promoLoading || !promoInput.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 rounded-xl"
              >
                {promoLoading ? 'Cek...' : 'Terapkan'}
              </Button>
            )}
          </div>

          {/* Applied Promo Banner */}
          {appliedPromo && (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-xs text-emerald-300">
              <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{appliedPromo.message}</p>
                <p className="text-[11px] text-emerald-400/80">
                  Potongan harga sebesar {formatCurrency(appliedPromo.discountAmount)} diterapkan.
                </p>
              </div>
            </div>
          )}

          {/* Quick Suggestion Chips */}
          {!appliedPromo && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Coba:</span>
              {SUGGESTED_PROMOS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setPromoInput(code);
                    handleApplyPromo(code);
                  }}
                  className="px-2 py-0.5 bg-gray-900 hover:bg-violet-950 hover:text-violet-300 text-gray-400 border border-gray-800 hover:border-violet-500/40 rounded-lg text-[10px] font-mono font-semibold transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout Summary & Action */}
      <div className="pt-2 border-t border-gray-800 space-y-3">
        <div className="space-y-1.5 text-xs text-gray-400">
          <div className="flex justify-between items-center">
            <span>Subtotal Tiket ({totalTickets} tiket)</span>
            <span className="text-white font-medium">{formatCurrency(subtotalPrice)}</span>
          </div>

          {appliedPromo && (
            <div className="flex justify-between items-center text-emerald-400 font-medium">
              <span className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Diskon Promo ({appliedPromo.promoCode})
              </span>
              <span>- {formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-800/80 text-sm">
            <span className="text-gray-200 font-bold">Total Pembayaran</span>
            <span className="text-2xl font-black text-white font-mono">
              {formatCurrency(finalPrice)}
            </span>
          </div>
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-6 rounded-2xl text-base shadow-lg shadow-violet-900/30"
          disabled={totalTickets === 0}
          onClick={handleCheckout}
        >
          {finalPrice === 0 ? 'Dapatkan Tiket Gratis' : `Beli Tiket (${formatCurrency(finalPrice)})`}
        </Button>
      </div>
    </div>
  );
}
