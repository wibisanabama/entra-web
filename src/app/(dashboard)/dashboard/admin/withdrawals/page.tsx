'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ticketApi } from '@/lib/api';
import { formatCurrency, formatDate, getPgText } from '@/lib/utils';
import { Withdrawal } from '@/types';
import { toast } from '@/lib/toast';
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Banknote,
  Send,
  User
} from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Segmented control indicator ala Mobbin
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const filterTabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterIndicatorStyle, setFilterIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [isFilterReady, setIsFilterReady] = useState(false);

  useEffect(() => {
    const activeEl = filterTabsRef.current[statusFilter];
    if (activeEl) {
      setFilterIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });

      if (!isFilterReady) {
        const timer = setTimeout(() => setIsFilterReady(true), 50);
        return () => clearTimeout(timer);
      } else if (filterContainerRef.current) {
        const container = filterContainerRef.current;
        const targetScrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    }
  }, [statusFilter, withdrawals.length, isFilterReady]);

  useEffect(() => {
    const handleResize = () => {
      const activeEl = filterTabsRef.current[statusFilter];
      if (activeEl) {
        setFilterIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [statusFilter]);

  // Modals
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectModalWithdrawal, setRejectModalWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminWithdrawals = useCallback(async () => {
    try {
      const res = await ticketApi.get<Withdrawal[]>('/api/v1/tickets/admin/withdrawals?per_page=100');
      if (res && res.data) {
        setWithdrawals(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch admin withdrawals:', error);
      toast.error('Gagal memuat daftar pengajuan pencairan dana admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminWithdrawals();
  }, [fetchAdminWithdrawals]);

  const handleUpdateStatus = async (
    withdrawalId: string,
    newStatus: 'APPROVED' | 'PAID' | 'REJECTED',
    reason?: string
  ) => {
    try {
      setActionLoading(true);
      await ticketApi.patch(`/api/v1/tickets/admin/withdrawals/${withdrawalId}/status`, {
        status: newStatus,
        rejection_reason: reason || '',
      });

      toast.success(
        newStatus === 'APPROVED'
          ? 'Pengajuan penarikan dana berhasil DISETUJUI.'
          : newStatus === 'PAID'
          ? 'Pengajuan penarikan dana berhasil DITANDAI SELESAI (PAID).'
          : 'Pengajuan penarikan dana telah DITOLAK.'
      );

      // Close modals and refresh
      setRejectModalWithdrawal(null);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchAdminWithdrawals();
    } catch (error: unknown) {
      console.error('Status update error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memperbarui status penarikan.';
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter calculations
  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesStatus = statusFilter === 'ALL' || w.status?.toUpperCase() === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      w.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.organizer_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const parseAmount = (val: string | number | undefined | null): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
  };

  // Metric aggregates
  const pendingList = withdrawals.filter((w) => w.status?.toUpperCase() === 'PENDING');
  const approvedList = withdrawals.filter((w) => w.status?.toUpperCase() === 'APPROVED');
  const paidList = withdrawals.filter((w) => w.status?.toUpperCase() === 'PAID');
  const rejectedList = withdrawals.filter((w) => w.status?.toUpperCase() === 'REJECTED');

  const pendingSum = pendingList.reduce((sum, w) => sum + parseAmount(w.amount), 0);
  const approvedSum = approvedList.reduce((sum, w) => sum + parseAmount(w.amount), 0);
  const paidSum = paidList.reduce((sum, w) => sum + parseAmount(w.amount), 0);
  const rejectedSum = rejectedList.reduce((sum, w) => sum + parseAmount(w.amount), 0);

  const filterTabs = [
    { id: 'ALL', label: `Semua (${withdrawals.length})` },
    { id: 'PENDING', label: `Menunggu (${pendingList.length})` },
    { id: 'APPROVED', label: `Disetujui (${approvedList.length})` },
    { id: 'PAID', label: `Selesai (${paidList.length})` },
    { id: 'REJECTED', label: rejectedList.length > 0 ? `Ditolak (${rejectedList.length})` : 'Ditolak' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="warning" className="border-0 shadow-none font-bold text-[10px]">Menunggu Verifikasi</Badge>;
      case 'APPROVED':
        return <Badge variant="info" className="border-0 shadow-none font-bold text-[10px]">Disetujui Admin</Badge>;
      case 'PAID':
        return <Badge variant="success" className="border-0 shadow-none font-bold text-[10px]">Berhasil Ditransfer</Badge>;
      case 'REJECTED':
        return <Badge variant="error" className="border-0 shadow-none font-bold text-[10px]">Ditolak</Badge>;
      default:
        return <Badge variant="secondary" className="border-0 shadow-none font-bold text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Manajemen Pencairan Dana Organizer
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Tinjau seluruh permohonan penarikan dana tiket, verifikasi rekening tujuan, dan kelola proses kliring transfer bank.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchAdminWithdrawals}
            disabled={loading}
            className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-4 py-2 flex items-center gap-2 border-0 shadow-none cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 4 Financial Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">
                Menunggu Transfer
              </p>
              {loading ? (
                <Skeleton className="h-7 w-28 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-amber-600 mt-1">
                  {formatCurrency(pendingSum)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{pendingList.length} permohonan antre</p>
            </div>
            <div className="p-2.5 bg-white text-amber-600 rounded-xl border-0 shadow-none">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Approved Card */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">
                Disetujui (Ready to Pay)
              </p>
              {loading ? (
                <Skeleton className="h-7 w-28 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-blue-600 mt-1">
                  {formatCurrency(approvedSum)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{approvedList.length} pengajuan</p>
            </div>
            <div className="p-2.5 bg-white text-blue-600 rounded-xl border-0 shadow-none">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Paid Card */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                Selesai Ditransfer
              </p>
              {loading ? (
                <Skeleton className="h-7 w-28 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-emerald-600 mt-1">
                  {formatCurrency(paidSum)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{paidList.length} transaksi sukses</p>
            </div>
            <div className="p-2.5 bg-white text-emerald-600 rounded-xl border-0 shadow-none">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Rejected Card */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">
                Total Ditolak
              </p>
              {loading ? (
                <Skeleton className="h-7 w-28 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-rose-600 mt-1">
                  {formatCurrency(rejectedSum)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{rejectedList.length} pengajuan ditolak</p>
            </div>
            <div className="p-2.5 bg-white text-rose-600 rounded-xl border-0 shadow-none">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-zinc-100 rounded-3xl p-6 space-y-4 border-0 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Control Pill ala Mobbin */}
          <div
            ref={filterContainerRef}
            className="relative inline-flex items-center p-1 bg-zinc-200/80 rounded-full gap-1 overflow-x-auto no-scrollbar max-w-full border-0"
          >
            {/* Sliding Capsule Highlight */}
            <div
              className={`absolute top-1 bottom-1 rounded-full bg-white shadow-none pointer-events-none ${
                isFilterReady
                  ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                  : 'transition-none'
              }`}
              style={{
                left: `${filterIndicatorStyle.left}px`,
                width: `${filterIndicatorStyle.width}px`,
                opacity: filterIndicatorStyle.width > 0 ? 1 : 0,
              }}
            />

            {filterTabs.map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    filterTabsRef.current[tab.id] = el;
                  }}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'text-zinc-950'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari bank, rekening, nama, ID..."
              aria-label="Cari bank, rekening, nama organizer, atau ID penarikan"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border-0 shadow-none rounded-full text-xs text-zinc-950 placeholder-zinc-400 focus:outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Withdrawals Table */}
        {filteredWithdrawals.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 text-zinc-400 border-0 shadow-none">
              <Banknote className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 mb-1">Tidak ada data penarikan dana</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              {statusFilter !== 'ALL'
                ? `Tidak ada transaksi dengan status ${statusFilter}.`
                : 'Semua pengajuan penarikan dana organizer akan muncul di sini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-200/50 border-0">
                <tr>
                  <th scope="col" className="px-4 py-3.5 rounded-l-2xl">Tanggal & ID</th>
                  <th scope="col" className="px-4 py-3.5">Organizer</th>
                  <th scope="col" className="px-4 py-3.5">Nominal Penarikan</th>
                  <th scope="col" className="px-4 py-3.5">Rekening Tujuan</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-right rounded-r-2xl">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-28 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-40 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5 text-right"><Skeleton className="h-7 w-32 ml-auto bg-zinc-200/60 rounded-full" /></td>
                    </tr>
                  ))
                ) : (
                  filteredWithdrawals.map((w) => {
                    const amountNum = parseAmount(w.amount);
                    const isPending = w.status?.toUpperCase() === 'PENDING';
                    const isApproved = w.status?.toUpperCase() === 'APPROVED';

                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-zinc-200/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedWithdrawal(w)}
                      >
                        {/* Date & ID */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-zinc-950 text-xs">{formatDate(w.created_at)}</div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">ID: {w.id.substring(0, 8)}...</div>
                        </td>

                        {/* Organizer ID */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-mono font-bold text-zinc-800 bg-white px-2.5 py-1 rounded-full border-0 shadow-none inline-flex items-center gap-1.5">
                            <User className="h-3 w-3 text-zinc-400" />
                            {w.organizer_id.substring(0, 8)}...
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5">
                          <div className="font-black text-zinc-950 text-xs">{formatCurrency(amountNum)}</div>
                          <div className="text-[11px] text-emerald-600 font-medium">Bebas Biaya Transfer</div>
                        </td>

                        {/* Bank Details */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                            <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                            {w.bank_name}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {w.account_number} a.n {w.account_name}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          {getStatusBadge(w.status)}
                          {w.status?.toUpperCase() === 'REJECTED' && getPgText(w.rejection_reason) && (
                            <div className="text-[11px] text-rose-600 mt-1 max-w-xs truncate font-medium">
                              Alasan: {getPgText(w.rejection_reason)}
                            </div>
                          )}
                        </td>

                        {/* Admin Actions */}
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={actionLoading}
                                  onClick={() => handleUpdateStatus(w.id, 'APPROVED')}
                                  className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-3.5 py-1.5 h-8 border-0 shadow-none cursor-pointer"
                                >
                                  Setujui
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionLoading}
                                  onClick={() => {
                                    setRejectModalWithdrawal(w);
                                    setRejectionReason('');
                                  }}
                                  className="rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold px-3.5 py-1.5 h-8 border-0 shadow-none cursor-pointer"
                                >
                                  Tolak
                                </Button>
                              </>
                            )}

                            {isApproved && (
                              <Button
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleUpdateStatus(w.id, 'PAID')}
                                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 h-8 flex items-center gap-1 border-0 shadow-none cursor-pointer"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Tandai Selesai
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedWithdrawal(w)}
                              className="rounded-full bg-white text-zinc-800 hover:bg-zinc-200 text-xs py-1 px-3.5 h-8 font-bold border-0 shadow-none cursor-pointer"
                            >
                              Detail
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL: Reject Withdrawal Dialog */}
      {rejectModalWithdrawal && (
        <Modal
          isOpen={!!rejectModalWithdrawal}
          onClose={() => !actionLoading && setRejectModalWithdrawal(null)}
          title="Tolak Pengajuan Penarikan Dana"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 rounded-2xl text-xs text-rose-900 space-y-1 border-0 shadow-none">
              <p className="font-bold text-rose-950">Konfirmasi Penolakan</p>
              <p className="text-rose-700 font-medium">
                Dana sebesar <span className="font-bold text-zinc-950">{formatCurrency(parseAmount(rejectModalWithdrawal.amount))}</span> akan otomatis dikembalikan ke Saldo Tersedia organizer.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Alasan Penolakan (Wajib Diisi)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Nama pemilik rekening tidak cocok dengan nama akun bank, atau nomor rekening tidak aktif..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-100 border-0 shadow-none rounded-2xl text-xs font-medium text-zinc-950 focus:outline-none focus:bg-zinc-200/60 placeholder:text-zinc-400 resize-none transition-colors"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={() => setRejectModalWithdrawal(null)}
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-5 py-2.5 border-0 shadow-none cursor-pointer"
              >
                Batal
              </Button>
              <Button
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={() => handleUpdateStatus(rejectModalWithdrawal.id, 'REJECTED', rejectionReason.trim())}
                className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-2.5 border-0 shadow-none cursor-pointer"
              >
                {actionLoading ? 'Memproses...' : 'Konfirmasi Tolak'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Withdrawal Detail Receipt */}
      {selectedWithdrawal && (
        <Modal
          isOpen={!!selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          title="Rincian Pengajuan Penarikan Dana (Admin View)"
        >
          <div className="space-y-6">
            <div className="text-center py-3 border-b border-zinc-200/50">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1 font-mono">
                ID: {selectedWithdrawal.id}
              </p>
              <h3 className="text-3xl font-black text-zinc-950">
                {formatCurrency(parseAmount(selectedWithdrawal.amount))}
              </h3>
              <div className="mt-3 flex justify-center">
                {getStatusBadge(selectedWithdrawal.status)}
              </div>
            </div>

            <div className="space-y-3 bg-zinc-100 p-5 rounded-2xl border-0 shadow-none text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Organizer ID:</span>
                <span className="font-mono text-xs font-bold text-zinc-900">{selectedWithdrawal.organizer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Bank Tujuan:</span>
                <span className="font-bold text-zinc-900 text-xs">{selectedWithdrawal.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Nomor Rekening:</span>
                <span className="font-mono font-bold text-zinc-900 text-xs">{selectedWithdrawal.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Nama Pemilik:</span>
                <span className="font-bold text-zinc-900 text-xs">{selectedWithdrawal.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Waktu Pengajuan:</span>
                <span className="text-zinc-700 text-xs font-medium">{formatDate(selectedWithdrawal.created_at)}</span>
              </div>
              {getPgText(selectedWithdrawal.notes) && (
                <div className="border-t border-zinc-200/60 pt-2 flex justify-between">
                  <span className="text-zinc-500 text-xs font-medium">Catatan Organizer:</span>
                  <span className="text-zinc-700 text-xs font-medium">{getPgText(selectedWithdrawal.notes)}</span>
                </div>
              )}
            </div>

            {selectedWithdrawal.status?.toUpperCase() === 'REJECTED' && (
              <div className="p-4 bg-rose-50 rounded-2xl border-0 shadow-none flex items-start gap-3 text-sm text-rose-900">
                <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-rose-950">Alasan Penolakan</p>
                  <p className="text-xs mt-1 text-rose-700 font-medium">
                    {getPgText(selectedWithdrawal.rejection_reason) || 'Data rekening tidak sesuai.'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                {selectedWithdrawal.status?.toUpperCase() === 'PENDING' && (
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'APPROVED')}
                    className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2.5 border-0 shadow-none cursor-pointer"
                  >
                    Setujui Permohonan
                  </Button>
                )}
                {selectedWithdrawal.status?.toUpperCase() === 'APPROVED' && (
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'PAID')}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 border-0 shadow-none cursor-pointer"
                  >
                    Tandai Selesai Ditransfer
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-6 py-2.5 border-0 shadow-none cursor-pointer"
                onClick={() => setSelectedWithdrawal(null)}
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
