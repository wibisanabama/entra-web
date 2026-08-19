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
  Clock,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  SendHorizontal,
  Download
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
      <div className="p-6 space-y-6 print:p-0">
        {/* Printable Ticket Pass Container */}
        <div
          id="printable-ticket"
          className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden print:border-none print:shadow-none"
        >
          {/* Top Event Banner / Header */}
          <div className="relative p-6 bg-gradient-to-r from-violet-950/80 via-purple-900/50 to-gray-900 border-b border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-violet-600/30 rounded-md text-violet-300">
                    <TicketIcon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                    Entra Official E-Ticket Pass
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                  {event?.title || 'Event Pass'}
                </h2>
                {event?.category?.name && (
                  <p className="text-xs text-gray-400 mt-1">{event.category.name}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-violet-400 flex-shrink-0" />
                <span>
                  {event?.start_date ? formatDate(event.start_date) : 'Waktu menyusul'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-violet-400 flex-shrink-0" />
                <span className="truncate">
                  {event?.venue?.name || event?.venue?.address || 'Lokasi Acara'}
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Divider with Semicircle Notches */}
          <div className="relative flex items-center justify-between my-1">
            <div className="w-5 h-8 bg-gray-950 rounded-r-full border-r border-gray-800 -ml-1"></div>
            <div className="w-full border-b-2 border-dashed border-gray-800 mx-2"></div>
            <div className="w-5 h-8 bg-gray-950 rounded-l-full border-l border-gray-800 -mr-1"></div>
          </div>

          {/* Bottom QR Code & Ticket Stub Section */}
          <div className="p-6 bg-gray-950/60 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Ticket Details */}
            <div className="space-y-3 w-full sm:w-auto text-left">
              <div>
                <span className="text-[11px] text-gray-500 uppercase tracking-wider block">
                  Kategori Tiket
                </span>
                <p className="text-base font-bold text-white">
                  {ticketType?.name || 'General Admission'}
                </p>
                {getPgText(ticketType?.description) && (
                  <p className="text-xs text-gray-400">{getPgText(ticketType?.description)}</p>
                )}
              </div>

              <div>
                <span className="text-[11px] text-gray-500 uppercase tracking-wider block">
                  Kode Unik Tiket
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-lg font-bold text-violet-400 tracking-wider">
                    {ticket.ticket_code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                    title="Salin Kode Tiket"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 font-mono">
                ID: {ticket.id.substring(0, 16)}...
              </div>
            </div>

            {/* Live QR Code Stub */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-lg flex-shrink-0">
              <QRCodeSVG
                value={ticket.ticket_code}
                size={140}
                level="H"
                includeMargin={true}
              />
              <span className="text-[10px] font-bold text-gray-800 tracking-wider uppercase mt-2 font-mono">
                SCAN AT GATE
              </span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="px-6 py-3 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Verifikasi Keaslian Entra Security Gate</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Sparkles className="h-3 w-3 text-violet-400" />
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
              className="flex items-center gap-2 text-gray-300 text-xs"
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
                className="flex items-center gap-2 text-violet-300 border-violet-800/50 hover:bg-violet-950/40 text-xs"
              >
                <SendHorizontal className="h-4 w-4" />
                Transfer Tiket
              </Button>
            )}
          </div>

          <Button
            onClick={onClose}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 text-xs font-bold"
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
