'use client';

import { useEffect, useState } from 'react';
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
  User,
  FileText
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

  const fetchAdminWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.get('/api/v1/tickets/admin/withdrawals?per_page=100');
      if (res && res.data) {
        setWithdrawals(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error: any) {
      console.error('Failed to fetch admin withdrawals:', error);
      toast.error('Gagal memuat daftar pengajuan pencairan dana admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminWithdrawals();
  }, []);

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
    } catch (error: any) {
      console.error('Status update error:', error);
      toast.error(error.message || 'Gagal memperbarui status penarikan.');
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

  const parseAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    return parseFloat(val) || 0;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-violet-600/20 text-violet-400 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Admin Financial Operations
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Manajemen Pencairan Dana Organizer
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Tinjau seluruh permohonan penarikan dana tiket, verifikasi rekening tujuan, dan kelola proses kliring transfer bank.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchAdminWithdrawals}
            disabled={loading}
            className="flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 4 Financial Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Card */}
        <Card className="bg-gradient-to-br from-amber-950/40 via-gray-900 to-gray-900 border-amber-500/30 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Menunggu Transfer
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1" />
              ) : (
                <h3 className="text-2xl font-extrabold text-amber-400 mb-1">
                  {formatCurrency(pendingSum)}
                </h3>
              )}
              <p className="text-xs text-gray-400">{pendingList.length} permohonan antre</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Approved Card */}
        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-400 text-xs font-medium uppercase tracking-wider mb-1">
                Disetujui (Ready to Pay)
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1" />
              ) : (
                <h3 className="text-2xl font-extrabold text-blue-400 mb-1">
                  {formatCurrency(approvedSum)}
                </h3>
              )}
              <p className="text-xs text-gray-500">{approvedList.length} pengajuan</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Paid Card */}
        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-1">
                Selesai Ditransfer
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1" />
              ) : (
                <h3 className="text-2xl font-extrabold text-emerald-400 mb-1">
                  {formatCurrency(paidSum)}
                </h3>
              )}
              <p className="text-xs text-gray-500">{paidList.length} transaksi sukses</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Rejected Card */}
        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-rose-400 text-xs font-medium uppercase tracking-wider mb-1">
                Total Ditolak
              </p>
              {loading ? (
                <Skeleton className="h-8 w-28 mb-1" />
              ) : (
                <h3 className="text-2xl font-extrabold text-rose-400 mb-1">
                  {formatCurrency(rejectedSum)}
                </h3>
              )}
              <p className="text-xs text-gray-500">{rejectedList.length} pengajuan ditolak</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-gray-900 border-gray-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Daftar Pengajuan Pencairan Dana</h2>
            <p className="text-sm text-gray-400">
              Kelola dan eksekusi permohonan penarikan dana dari event organizer secara transparan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cari bank, rekening, nama, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
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
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-950/80 text-gray-400 uppercase text-xs border-b border-gray-800">
              <tr>
                <th className="py-3.5 px-4">Tanggal & ID</th>
                <th className="py-3.5 px-4">Organizer</th>
                <th className="py-3.5 px-4">Nominal Penarikan</th>
                <th className="py-3.5 px-4">Rekening Tujuan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-32 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-gray-800/50 rounded-full text-gray-400">
                        <Banknote className="h-8 w-8" />
                      </div>
                      <p className="font-medium text-gray-400">Tidak ada data penarikan dana.</p>
                      <p className="text-xs text-gray-500">
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
                      className="hover:bg-gray-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedWithdrawal(w)}
                    >
                      {/* Date & ID */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{formatDate(w.created_at)}</div>
                        <div className="text-xs text-gray-500 font-mono">ID: {w.id.substring(0, 8)}...</div>
                      </td>

                      {/* Organizer ID */}
                      <td className="py-4 px-4">
                        <div className="text-xs text-gray-300 font-mono flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-violet-400" />
                          {w.organizer_id.substring(0, 8)}...
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-base">{formatCurrency(amountNum)}</div>
                        <div className="text-xs text-emerald-400 font-medium">Bebas Biaya Transfer</div>
                      </td>

                      {/* Bank Details */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {w.bank_name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {w.account_number} a.n {w.account_name}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {getStatusBadge(w.status)}
                        {w.status?.toUpperCase() === 'REJECTED' && getPgText(w.rejection_reason) && (
                          <div className="text-xs text-rose-400 mt-1 max-w-xs truncate">
                            Alasan: {getPgText(w.rejection_reason)}
                          </div>
                        )}
                      </td>

                      {/* Admin Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                disabled={actionLoading}
                                onClick={() => handleUpdateStatus(w.id, 'APPROVED')}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2.5 h-8"
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
                                className="border-rose-500/50 text-rose-400 hover:bg-rose-950/30 text-xs py-1 px-2.5 h-8"
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
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-3 h-8 flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Tandai Selesai (PAID)
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedWithdrawal(w)}
                            className="text-xs py-1 px-2.5 h-8 text-gray-400 hover:text-white"
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
      </Card>

      {/* MODAL: Reject Withdrawal Dialog */}
      {rejectModalWithdrawal && (
        <Modal
          isOpen={!!rejectModalWithdrawal}
          onClose={() => !actionLoading && setRejectModalWithdrawal(null)}
          title="Tolak Pengajuan Penarikan Dana"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
              <p className="font-semibold text-rose-200">Konfirmasi Penolakan</p>
              <p>
                Dana sebesar <span className="font-bold text-white">{formatCurrency(parseAmount(rejectModalWithdrawal.amount))}</span> akan otomatis dikembalikan ke Saldo Tersedia organizer.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Alasan Penolakan (Wajib Diisi)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Nama pemilik rekening tidak cocok dengan nama akun bank, atau nomor rekening tidak aktif..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500 placeholder-gray-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={() => setRejectModalWithdrawal(null)}
              >
                Batal
              </Button>
              <Button
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={() => handleUpdateStatus(rejectModalWithdrawal.id, 'REJECTED', rejectionReason.trim())}
                className="bg-rose-600 hover:bg-rose-700 text-white"
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
            <div className="text-center py-3 border-b border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-mono">
                ID: {selectedWithdrawal.id}
              </p>
              <h3 className="text-3xl font-extrabold text-white">
                {formatCurrency(parseAmount(selectedWithdrawal.amount))}
              </h3>
              <div className="mt-3 flex justify-center">
                {getStatusBadge(selectedWithdrawal.status)}
              </div>
            </div>

            <div className="space-y-3 bg-gray-950 p-4 rounded-xl border border-gray-800 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Organizer ID:</span>
                <span className="font-mono text-xs text-violet-400">{selectedWithdrawal.organizer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bank Tujuan:</span>
                <span className="font-semibold text-white">{selectedWithdrawal.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nomor Rekening:</span>
                <span className="font-mono font-bold text-white">{selectedWithdrawal.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nama Pemilik:</span>
                <span className="font-semibold text-white">{selectedWithdrawal.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Waktu Pengajuan:</span>
                <span className="text-gray-200">{formatDate(selectedWithdrawal.created_at)}</span>
              </div>
              {getPgText(selectedWithdrawal.notes) && (
                <div className="border-t border-gray-800 pt-2 flex justify-between">
                  <span className="text-gray-400">Catatan Organizer:</span>
                  <span className="text-gray-200">{getPgText(selectedWithdrawal.notes)}</span>
                </div>
              )}
            </div>

            {selectedWithdrawal.status?.toUpperCase() === 'REJECTED' && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 text-sm text-rose-300">
                <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-200">Alasan Penolakan</p>
                  <p className="text-xs mt-1 text-rose-300">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  >
                    Setujui Permohonan
                  </Button>
                )}
                {selectedWithdrawal.status?.toUpperCase() === 'APPROVED' && (
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedWithdrawal.id, 'PAID')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    Tandai Selesai Ditransfer
                  </Button>
                )}
              </div>

              <Button variant="outline" onClick={() => setSelectedWithdrawal(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
