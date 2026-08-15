'use client';

import React, { useState } from 'react';
import { TicketType } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency, getPgText } from '@/lib/utils';

export interface TicketSelectorProps {
  ticketTypes: TicketType[];
  onSelect: (selectedTickets: { ticketTypeId: string; quantity: number }[]) => void;
}

export function TicketSelector({ ticketTypes, onSelect }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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
  };

  const totalPrice = ticketTypes.reduce((sum, ticket) => {
    const priceNum = parsePrice(ticket.price);
    return sum + (priceNum * (quantities[ticket.id] || 0));
  }, 0);

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleCheckout = () => {
    const selected = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, quantity]) => ({ ticketTypeId: id, quantity }));
    
    if (selected.length > 0) {
      onSelect(selected);
    }
  };

  if (!ticketTypes || ticketTypes.length === 0) {
    return <div className="text-gray-400 p-4 text-center rounded-lg">Belum ada tiket yang tersedia.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ticketTypes.map(ticket => {
          const qty = quantities[ticket.id] || 0;
          const quota = getTicketQuota(ticket);
          const isAvailable = quota > 0;
          const priceNum = parsePrice(ticket.price);
          const desc = getPgText(ticket.description);

          return (
            <div key={ticket.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-800/50 rounded-lg">
              <div className="mb-4 sm:mb-0">
                <h4 className="text-lg font-semibold text-white">{ticket.name}</h4>
                {desc && <p className="text-sm text-gray-400">{desc}</p>}
                <div className="mt-1 font-medium text-violet-400">
                  {priceNum === 0 ? 'Gratis' : formatCurrency(priceNum)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Sisa: {quota} tiket
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleQuantityChange(ticket.id, -1, quota)}
                  disabled={qty === 0 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center disabled:opacity-50 hover:bg-gray-600 transition-colors"
                >
                  -
                </button>
                <span className="w-4 text-center font-medium text-white">{qty}</span>
                <button
                  onClick={() => handleQuantityChange(ticket.id, 1, quota)}
                  disabled={qty >= quota || qty >= 10 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center disabled:opacity-50 hover:bg-gray-600 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-300 font-medium">Total Harga</span>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(totalPrice)}
          </span>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          disabled={totalTickets === 0}
          onClick={handleCheckout}
        >
          Beli Tiket
        </Button>
      </div>
    </div>
  );
}

