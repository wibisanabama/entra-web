'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EnrichedTicket } from '@/types';
import { formatDate, formatTime, getPgText } from '@/lib/utils';
import {
  Calendar,
  Clock,
  MapPin,
  Printer,
  Copy,
  Check,
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
          className="relative bg-zinc-100 rounded-3xl border-0 shadow-none overflow-hidden print:border-none print:shadow-none"
        >
          {/* Top Event Banner / Header */}
          <div className="relative p-6 bg-zinc-100 border-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white rounded-lg text-zinc-900 border-0 shadow-none">
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
                  className="text-xs py-1 px-3 border-0"
                >
                  {isActive ? 'SIAP DIGUNAKAN' : isUsed ? 'SUDAH DIPAKAI' : ticket.status}
                </Badge>
              </div>
            </div>

            {/* Event Date, Time & Location Pill Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 p-3.5 bg-white/70 rounded-2xl border-0 text-xs text-zinc-600">
              <div className="flex items-center gap-2 min-w-0" title={event?.start_date ? formatDate(event.start_date) : undefined}>
                <Calendar className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="truncate">
                  {event?.start_date ? formatDate(event.start_date) : 'Waktu menyusul'}
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0" title={event?.start_date ? formatTime(event.start_date, event.end_date) : undefined}>
                <Clock className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="truncate">
                  {event?.start_date ? formatTime(event.start_date, event.end_date) : 'Waktu menyusul'}
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0" title={event?.venue?.name || event?.venue?.address || 'Lokasi Acara'}>
                <MapPin className="h-4 w-4 text-zinc-500 flex-shrink-0" />
                <span className="truncate">
                  {event?.venue?.name || event?.venue?.address || 'Lokasi Acara'}
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Divider with Semicircle Notches */}
          <div className="relative flex items-center justify-between my-1">
            <div className="w-5 h-8 bg-white rounded-r-full -ml-1"></div>
            <div className="w-full h-px bg-zinc-200 mx-2"></div>
            <div className="w-5 h-8 bg-white rounded-l-full -mr-1"></div>
          </div>

          {/* Bottom QR Code & Ticket Stub Section */}
          <div className="p-6 bg-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-6">
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
                    className="p-1 hover:bg-zinc-200 rounded-full text-zinc-400 hover:text-zinc-900 transition-colors"
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
            <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl shadow-none border-0 flex-shrink-0">
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
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-between items-center gap-3 pt-2 print:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2 text-zinc-800 bg-zinc-100 hover:bg-zinc-200 text-xs rounded-full border-0 font-semibold px-4 py-2.5 shadow-none"
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
                className="flex items-center gap-2 text-zinc-800 bg-zinc-100 hover:bg-zinc-200 text-xs rounded-full border-0 font-semibold px-4 py-2.5 shadow-none"
              >
                <SendHorizontal className="h-4 w-4" />
                Transfer Tiket
              </Button>
            )}
          </div>

          <Button
            onClick={onClose}
            className="bg-zinc-950 hover:bg-zinc-800 text-white px-6 text-xs font-semibold rounded-full border-0 shadow-none py-2.5"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
