'use client';

import React, { useState } from 'react';
import { TicketType } from '@/types';
import { Button } from '@/components/ui/Button';

export interface TicketSelectorProps {
  ticketTypes: TicketType[];
  onSelect: (selectedTickets: { ticketTypeId: string; quantity: number }[]) => void;
}

export function TicketSelector({ ticketTypes, onSelect }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (id: string, delta: number, max: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(current + delta, max, 10)); // max 10 per transaction or available quota
      return { ...prev, [id]: next };
    });
  };

  const totalPrice = ticketTypes.reduce((sum, ticket) => {
    return sum + (ticket.price * (quantities[ticket.id] || 0));
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
    return <div className="text-gray-400 p-4 text-center border border-gray-800 rounded-lg">Belum ada tiket yang tersedia.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {ticketTypes.map(ticket => {
          const qty = quantities[ticket.id] || 0;
          const isAvailable = ticket.quota > 0;

          return (
            <div key={ticket.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-700 bg-gray-800/50 rounded-lg">
              <div className="mb-4 sm:mb-0">
                <h4 className="text-lg font-semibold text-white">{ticket.name}</h4>
                <p className="text-sm text-gray-400">{ticket.description}</p>
                <div className="mt-1 font-medium text-violet-400">
                  {ticket.price === 0 ? 'Gratis' : `Rp ${ticket.price.toLocaleString('id-ID')}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Sisa: {ticket.quota} tiket
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleQuantityChange(ticket.id, -1, ticket.quota)}
                  disabled={qty === 0 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center disabled:opacity-50 hover:bg-gray-600 transition-colors"
                >
                  -
                </button>
                <span className="w-4 text-center font-medium text-white">{qty}</span>
                <button
                  onClick={() => handleQuantityChange(ticket.id, 1, ticket.quota)}
                  disabled={qty >= ticket.quota || qty >= 10 || !isAvailable}
                  className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center disabled:opacity-50 hover:bg-gray-600 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-700 pt-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-gray-300 font-medium">Total Harga</span>
          <span className="text-2xl font-bold text-white">
            Rp {totalPrice.toLocaleString('id-ID')}
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
