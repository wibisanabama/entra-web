'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ticketApi } from '@/lib/api';
import { formatCurrency, formatDate, getPgText } from '@/lib/utils';
import { Withdrawal } from '@/types';
import { toast } from 'sonner';
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

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="warning">Menunggu Verifikasi</Badge>;
      case 'APPROVED':
        return <Badge variant="info">Disetujui Admin</Badge>;
      case 'PAID':
        return <Badge variant="success">Berhasil Ditransfer</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Admin Financial Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Manajemen Pencairan Dana Organizer
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Tinjau seluruh permohonan penarikan dana tiket, verifikasi rekening tujuan, dan kelola proses kliring transfer bank.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchAdminWithdrawals}
            disabled={loading}
            className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 4 Financial Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Card */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Menunggu Transfer
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-amber-600 mb-1">
                  {formatCurrency(pendingSum)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">{pendingList.length} permohonan antre</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Approved Card */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Disetujui (Ready to Pay)
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-blue-600 mb-1">
                  {formatCurrency(approvedSum)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">{approvedList.length} pengajuan</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Paid Card */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Selesai Ditransfer
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-emerald-600 mb-1">
                  {formatCurrency(paidSum)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">{paidList.length} transaksi sukses</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Rejected Card */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Ditolak
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-red-600 mb-1">
                  {formatCurrency(rejectedSum)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">{rejectedList.length} pengajuan ditolak</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Daftar Pengajuan Pencairan Dana</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelola dan eksekusi permohonan penarikan dana dari event organizer secara transparan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari bank, rekening, nama, ID..."
                aria-label="Cari bank, rekening, nama organizer, atau ID penarikan"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50/80 border border-zinc-200 rounded-full text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-zinc-100 p-1 rounded-full text-xs">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'PENDING', label: `Menunggu (${pendingList.length})` },
                { id: 'APPROVED', label: 'Disetujui' },
                { id: 'PAID', label: 'Selesai' },
                { id: 'REJECTED', label: 'Ditolak' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === tab.id
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="overflow-x-auto border border-zinc-100 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/75 text-zinc-500 uppercase text-xs font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-5">Tanggal & ID</th>
                <th className="py-3.5 px-5">Organizer</th>
                <th className="py-3.5 px-5">Nominal Penarikan</th>
                <th className="py-3.5 px-5">Rekening Tujuan</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-40 rounded-md" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-4 px-5 text-right"><Skeleton className="h-8 w-32 ml-auto rounded-full" /></td>
                  </tr>
                ))
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                        <Banknote className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-sm text-zinc-900">Tidak ada data penarikan dana.</p>
                      <p className="text-xs text-zinc-500">
                        {statusFilter !== 'ALL'
                          ? `Tidak ada transaksi dengan status ${statusFilter}.`
                          : 'Semua pengajuan penarikan dana organizer akan muncul di sini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => {
                  const amountNum = parseAmount(w.amount);
                  const isPending = w.status?.toUpperCase() === 'PENDING';
                  const isApproved = w.status?.toUpperCase() === 'APPROVED';

                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-zinc-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedWithdrawal(w)}
                    >
                      {/* Date & ID */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-zinc-950 text-sm">{formatDate(w.created_at)}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">ID: {w.id.substring(0, 8)}...</div>
                      </td>

                      {/* Organizer ID */}
                      <td className="py-4 px-5">
                        <div className="text-xs text-zinc-600 font-mono flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100 inline-flex">
                          <User className="h-3 w-3 text-zinc-500" />
                          {w.organizer_id.substring(0, 8)}...
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-zinc-950 text-base">{formatCurrency(amountNum)}</div>
                        <div className="text-xs text-emerald-600 font-medium">Bebas Biaya Transfer</div>
                      </td>

                      {/* Bank Details */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                          {w.bank_name}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                          {w.account_number} a.n {w.account_name}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-5">
                        {getStatusBadge(w.status)}
                        {w.status?.toUpperCase() === 'REJECTED' && getPgText(w.rejection_reason) && (
                          <div className="text-xs text-rose-600 mt-1 max-w-xs truncate font-medium">
                            Alasan: {getPgText(w.rejection_reason)}
                          </div>
                        )}
                      </td>

                      {/* Admin Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleUpdateStatus(w.id, 'APPROVED')}
                                className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-3.5 py-1 h-7"
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
                                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium px-3 py-1 h-7"
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
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1 h-7 flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Tandai Selesai
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedWithdrawal(w)}
                            className="rounded-full border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-medium px-3 py-1 h-7"
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
      </div>

      {/* MODAL: Reject Withdrawal Dialog */}
      {rejectModalWithdrawal && (
        <Modal
          isOpen={!!rejectModalWithdrawal}
          onClose={() => !actionLoading && setRejectModalWithdrawal(null)}
          title="Tolak Pengajuan Penarikan Dana"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-1">
              <p className="font-semibold text-red-950">Konfirmasi Penolakan</p>
              <p className="text-red-700">
                Dana sebesar <span className="font-bold text-zinc-950">{formatCurrency(parseAmount(rejectModalWithdrawal.amount))}</span> akan otomatis dikembalikan ke Saldo Tersedia organizer.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Alasan Penolakan (Wajib Diisi)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Nama pemilik rekening tidak cocok dengan nama akun bank, atau nomor rekening tidak aktif..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-950 focus:outline-none focus:bg-white focus:border-zinc-400 placeholder:text-zinc-400 resize-none transition-colors"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => setRejectModalWithdrawal(null)}
                className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium px-4 py-2"
              >
                Batal
              </Button>
              <Button
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={() => handleUpdateStatus(rejectModalWithdrawal.id, 'REJECTED', rejectionReason.trim())}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2"
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
            <div className="text-center py-3 border-b border-zinc-100">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1 font-mono">
                ID: {selectedWithdrawal.id}
              </p>
              <h3 className="text-3xl font-extrabold text-zinc-950">
                {formatCurrency(parseAmount(selectedWithdrawal.amount))}
              </h3>
              <div className="mt-3 flex justify-center">
                {getStatusBadge(selectedWithdrawal.status)}
              </div>
            </div>

            <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Organizer ID:</span>
                <span className="font-mono text-xs font-bold text-zinc-900">{selectedWithdrawal.organizer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Bank Tujuan:</span>
                <span className="font-semibold text-zinc-900 text-xs">{selectedWithdrawal.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Nomor Rekening:</span>
                <span className="font-mono font-bold text-zinc-900 text-xs">{selectedWithdrawal.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Nama Pemilik:</span>
                <span className="font-semibold text-zinc-900 text-xs">{selectedWithdrawal.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Waktu Pengajuan:</span>
                <span className="text-zinc-700 text-xs">{formatDate(selectedWithdrawal.created_at)}</span>
              </div>
              {getPgText(selectedWithdrawal.notes) && (
                <div className="border-t border-zinc-200 pt-2 flex justify-between">
                  <span className="text-zinc-500 text-xs">Catatan Organizer:</span>
                  <span className="text-zinc-700 text-xs">{getPgText(selectedWithdrawal.notes)}</span>
                </div>
              )}
            </div>

            {selectedWithdrawal.status?.toUpperCase() === 'REJECTED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-900">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-red-950">Alasan Penolakan</p>
                  <p className="text-xs mt-1 text-red-700">
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
                    className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-1.5"
                  >
                    Setujui Permohonan
                  </Button>
                )}
                {selectedWithdrawal.status?.toUpperCase() === 'APPROVED' && (
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'PAID')}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5"
                  >
                    Tandai Selesai Ditransfer
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold px-4 py-1.5"
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
