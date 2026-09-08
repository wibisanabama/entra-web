'use client';

import React, { useState } from 'react';
import { TicketType } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency, getPgText } from '@/lib/utils';
import { ticketApi } from '@/lib/api';
import { Tag, Check, X, Percent } from 'lucide-react';

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

interface PromoValidateResponse {
  is_valid: boolean;
  promo_code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  final_total: number;
  message: string;
}

const SUGGESTED_PROMOS = ['ENTRA20', 'FESTIVAL50', 'WELCOME10'];

export function TicketSelector({ ticketTypes, eventId, onSelect }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

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
    // Reset applied promo when quantity changes so it can be revalidated
    if (appliedPromo) {
      setAppliedPromo(null);
      setPromoError(null);
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
    setPromoError(null);
    if (!code) {
      setPromoError('Masukkan kode promo terlebih dahulu');
      return;
    }
    if (totalTickets === 0 || subtotalPrice <= 0) {
      setPromoError('Pilih tiket berbayar terlebih dahulu untuk menggunakan promo');
      return;
    }

    try {
      setPromoLoading(true);
      const res = await ticketApi.post<PromoValidateResponse | { data: PromoValidateResponse }>('/api/v1/tickets/promo/validate', {
        promo_code: code,
        subtotal: subtotalPrice,
        ticket_quantity: totalTickets,
        event_id: eventId || '',
      });

      const data = (res.data && 'data' in res.data && res.data.data) ? res.data.data : (res.data as PromoValidateResponse | undefined);
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
        setPromoError(null);
      } else {
        setPromoError(data?.message || 'Kode promo tidak valid');
      }
    } catch (error: unknown) {
      console.error('Error validating promo code:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memvalidasi kode promo';
      setPromoError(errMsg);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
  };

  const handleCheckout = () => {
    const selected = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, quantity]) => ({ ticketTypeId: id, quantity }));
    
    if (selected.length > 0) {
      onSelect(selected, appliedPromo);
    }
  };

  if (!ticketTypes || ticketTypes.length === 0) {
    return <div className="text-zinc-500 p-4 text-center rounded-2xl bg-white text-sm">Belum ada tiket yang tersedia.</div>;
  }

  return (
    <div className="space-y-4 text-zinc-900">
      {/* Ticket List */}
      <div className="space-y-3">
        {ticketTypes.map(ticket => {
          const qty = quantities[ticket.id] || 0;
          const quota = getTicketQuota(ticket);
          const isAvailable = quota > 0;
          const priceNum = parsePrice(ticket.price);
          const desc = getPgText(ticket.description);

          return (
            <div key={ticket.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white rounded-2xl">
              <div className="mb-3 sm:mb-0">
                <h4 className="text-base font-bold text-zinc-950">{ticket.name}</h4>
                {desc && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{desc}</p>}
                <div className="mt-1 font-extrabold text-zinc-950 text-sm">
                  {priceNum === 0 ? 'Gratis' : formatCurrency(priceNum)}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Sisa kuota: {quota} tiket
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

      {/* Promo Code Section */}
      {subtotalPrice > 0 && (
        <div className="p-4 bg-white rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
              <Tag className="h-3.5 w-3.5 text-zinc-600" />
              <span>Kupon Promo & Diskon</span>
            </div>
            {appliedPromo && (
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
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
                aria-label="Kode kupon promo"
                disabled={appliedPromo !== null || promoLoading}
                className="w-full px-3.5 py-2 bg-zinc-100 rounded-full text-xs text-zinc-900 font-mono uppercase focus:outline-none disabled:opacity-60 border-none"
              />
            </div>
            {appliedPromo ? (
              <Button
                type="button"
                size="sm"
                onClick={handleRemovePromo}
                className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full border-none"
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
                className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 rounded-full border-none"
              >
                {promoLoading ? 'Cek...' : 'Terapkan'}
              </Button>
            )}
          </div>

          {promoError && (
            <p className="text-xs text-rose-600 font-medium px-1">
              {promoError}
            </p>
          )}

          {/* Applied Promo Banner */}
          {appliedPromo && (
            <div className="p-2.5 bg-emerald-50 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{appliedPromo.message}</p>
                <p className="text-[11px] text-emerald-700">
                  Potongan harga sebesar {formatCurrency(appliedPromo.discountAmount)} diterapkan.
                </p>
              </div>
            </div>
          )}

          {/* Quick Suggestion Chips */}
          {!appliedPromo && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Coba:</span>
              {SUGGESTED_PROMOS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setPromoInput(code);
                    handleApplyPromo(code);
                  }}
                  className="px-2.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-[10px] font-mono font-semibold transition-colors border-none"
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkout Summary & Action */}
      <div className="pt-2 space-y-3">
        <div className="space-y-1.5 text-xs text-zinc-500">
          <div className="flex justify-between items-center">
            <span>Subtotal Tiket ({totalTickets} tiket)</span>
            <span className="text-zinc-900 font-semibold">{formatCurrency(subtotalPrice)}</span>
          </div>

          {appliedPromo && (
            <div className="flex justify-between items-center text-emerald-700 font-medium">
              <span className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Diskon Promo ({appliedPromo.promoCode})
              </span>
              <span>- {formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 text-sm">
            <span className="text-zinc-800 font-bold">Total Pembayaran</span>
            <span className="text-2xl font-black text-zinc-950 font-mono">
              {formatCurrency(finalPrice)}
            </span>
          </div>
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-full text-base border-none"
          disabled={totalTickets === 0}
          onClick={handleCheckout}
        >
          {finalPrice === 0 ? 'Dapatkan Tiket Gratis' : `Beli Tiket (${formatCurrency(finalPrice)})`}
        </Button>
      </div>
    </div>
  );
}
