'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EnrichedTicket } from '@/types';
import { formatDate, getPgText } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  SendHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

interface ETicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: EnrichedTicket | null;
  onOpenTransfer?: (ticket: EnrichedTicket) => void;
}

export function ETicketModal({ isOpen, onClose, ticket, onOpenTransfer }: ETicketModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!ticket) return null;

  const event = ticket.event;
  const ticketType = ticket.ticket_type;
  const isUsed = ticket.status?.toUpperCase() === 'USED';
  const isActive = ticket.status?.toUpperCase() === 'ACTIVE';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticket.ticket_code);
    setCopied(true);
    toast.success('Kode tiket berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="E-Ticket Digital & Invoice"
      className="max-w-xl p-0 overflow-hidden"
    >
      <div className="p-6 space-y-6 print:p-0 text-zinc-900">
        {/* Printable Ticket Pass Container */}
        <div
          id="printable-ticket"
          className="relative bg-white rounded-3xl border border-zinc-200 shadow-lg overflow-hidden print:border-none print:shadow-none"
        >
          {/* Top Event Banner / Header */}
          <div className="relative p-6 bg-zinc-50 border-b border-zinc-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-zinc-200 rounded-lg text-zinc-900">
                    <TicketIcon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Entra Official E-Ticket Pass
                  </span>
                </div>
                <h2 className="text-2xl font-black text-zinc-950 tracking-tight leading-snug">
                  {event?.title || 'Event Pass'}
                </h2>
                {event?.category?.name && (
                  <p className="text-xs text-zinc-500 mt-1">{event.category.name}</p>
                )}
              </div>

              <div>
                <Badge
                  variant={isActive ? 'success' : isUsed ? 'secondary' : 'error'}
                  className="text-xs py-1 px-3"
                >
                  {isActive ? 'SIAP DIGUNAKAN' : isUsed ? 'SUDAH DIPAKAI' : ticket.status}
                </Badge>
              </div>
            </div>

            {/* Event Date & Location Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-zinc-200 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span>
                  {event?.start_date ? formatDate(event.start_date) : 'Waktu menyusul'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="truncate">
                  {event?.venue?.name || event?.venue?.address || 'Lokasi Acara'}
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Divider with Semicircle Notches */}
          <div className="relative flex items-center justify-between my-1">
            <div className="w-5 h-8 bg-zinc-100 rounded-r-full border-r border-zinc-200 -ml-1"></div>
            <div className="w-full border-b-2 border-dashed border-zinc-200 mx-2"></div>
            <div className="w-5 h-8 bg-zinc-100 rounded-l-full border-l border-zinc-200 -mr-1"></div>
          </div>

          {/* Bottom QR Code & Ticket Stub Section */}
          <div className="p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Ticket Details */}
            <div className="space-y-3 w-full sm:w-auto text-left">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  Kategori Tiket
                </span>
                <p className="text-base font-bold text-zinc-950">
                  {ticketType?.name || 'General Admission'}
                </p>
                {getPgText(ticketType?.description) && (
                  <p className="text-xs text-zinc-500">{getPgText(ticketType?.description)}</p>
                )}
              </div>

              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  Kode Unik Tiket
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-lg font-black text-zinc-950 tracking-wider">
                    {ticket.ticket_code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-900 transition-colors"
                    title="Salin Kode Tiket"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 font-mono">
                ID: {ticket.id.substring(0, 16)}...
              </div>
            </div>

            {/* Live QR Code Stub */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-xs flex-shrink-0">
              <QRCodeSVG
                value={ticket.ticket_code}
                size={135}
                level="H"
                includeMargin={true}
              />
              <span className="text-[10px] font-bold text-zinc-700 tracking-wider uppercase mt-2 font-mono">
                SCAN AT GATE
              </span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Verifikasi Keaslian Entra Security Gate</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400">
              <Sparkles className="h-3 w-3 text-zinc-600" />
              <span>Digital Pass</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-2 print:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2 text-zinc-700 border-zinc-200 hover:bg-zinc-50 text-xs rounded-full"
            >
              <Printer className="h-4 w-4" />
              Cetak / PDF
            </Button>

            {isActive && onOpenTransfer && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onOpenTransfer(ticket);
                }}
                className="flex items-center gap-2 text-zinc-900 border-zinc-300 hover:bg-zinc-50 text-xs rounded-full"
              >
                <SendHorizontal className="h-4 w-4" />
                Transfer Tiket
              </Button>
            )}
          </div>

          <Button
            onClick={onClose}
            className="bg-zinc-950 hover:bg-zinc-800 text-white px-6 text-xs font-semibold rounded-full"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
