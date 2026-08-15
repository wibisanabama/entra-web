'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ticketApi } from '@/lib/api';
import { formatCurrency, formatDate, getPgText } from '@/lib/utils';
import { Withdrawal, OrganizerBalance, CreateWithdrawalRequest } from '@/types';
import { toast } from 'sonner';
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  User,
  FileText,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';

const BANK_OPTIONS = [
  { code: 'BCA', name: 'Bank Central Asia (BCA)' },
  { code: 'MANDIRI', name: 'Bank Mandiri' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
  { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'PERMATA', name: 'Bank Permata' },
  { code: 'SEABANK', name: 'SeaBank Indonesia' },
  { code: 'JAGO', name: 'Bank Jago' },
  { code: 'BTPN', name: 'Jenius / BTPN' },
];

export default function WithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<OrganizerBalance>({
    total_revenue: 0,
    total_withdrawn: 0,
    available_balance: 0,
    pending_amount: 0,
    paid_amount: 0,
    total_requests: 0,
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateWithdrawalRequest>({
    amount: 0,
    bank_name: 'BCA',
    account_number: '',
    account_name: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balanceRes, withdrawalsRes] = await Promise.all([
        ticketApi.get('/api/v1/tickets/organizer/balance').catch(() => ({ data: null })),
        ticketApi.get('/api/v1/tickets/organizer/withdrawals').catch(() => ({ data: [] }))
      ]);

      if (balanceRes && balanceRes.data) {
        setBalance(balanceRes.data);
      }

      if (withdrawalsRes && withdrawalsRes.data) {
        setWithdrawals(Array.isArray(withdrawalsRes.data) ? withdrawalsRes.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawal data', error);
      toast.error('Gagal memuat data keuangan dan saldo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickAmount = (percentage: number) => {
    const calculated = Math.floor((balance.available_balance * percentage) / 100);
    setFormData((prev) => ({ ...prev, amount: calculated }));
  };

  const handleFixedAmount = (val: number) => {
    setFormData((prev) => ({ ...prev, amount: val }));
  };

  const handleOpenRequestModal = () => {
    setFormData({
      amount: balance.available_balance > 0 ? balance.available_balance : 0,
      bank_name: 'BCA',
      account_number: '',
      account_name: '',
      notes: '',
    });
    setIsRequestModalOpen(true);
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || formData.amount < 10000) {
      toast.error('Minimal penarikan dana adalah Rp 10.000');
      return;
    }

    if (formData.amount > balance.available_balance) {
      toast.error('Nominal penarikan melebihi saldo tersedia.');
      return;
    }

    if (!formData.account_number.trim()) {
      toast.error('Nomor rekening bank wajib diisi.');
      return;
    }

    if (!formData.account_name.trim()) {
      toast.error('Nama pemilik rekening wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      await ticketApi.post('/api/v1/tickets/organizer/withdrawals', {
        amount: Number(formData.amount),
        bank_name: formData.bank_name,
        account_number: formData.account_number.trim(),
        account_name: formData.account_name.trim(),
        notes: formData.notes?.trim() || '',
      });

      toast.success('Pengajuan penarikan dana berhasil dikirim!');
      setIsRequestModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Gagal mengajukan penarikan dana.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesStatus = statusFilter === 'ALL' || w.status?.toUpperCase() === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      w.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="warning">Menunggu Diproses</Badge>;
      case 'APPROVED':
        return <Badge variant="info">Disetujui Admin</Badge>;
      case 'PAID':
        return <Badge variant="success">Berhasil Dicairkan</Badge>;
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
          <h1 className="text-3xl font-bold text-white mb-2">Keuangan & Penarikan Dana</h1>
          <p className="text-gray-400">
            Kelola saldo pendapatan tiket event dan ajukan pencairan dana langsung ke rekening bank Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenRequestModal}
            disabled={balance.available_balance < 10000}
            className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2"
          >
            <ArrowUpRight className="h-4 w-4" />
            Tarik Dana
          </Button>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Available Balance Card (Main Highlight) */}
        <Card className="bg-gradient-to-br from-violet-950/60 via-gray-900 to-gray-900 border-violet-500/30 p-6 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-violet-400 text-sm font-semibold mb-1 uppercase tracking-wider">
                Saldo Tersedia
              </p>
              {loading ? (
                <Skeleton className="h-9 w-36 mb-2" />
              ) : (
                <h3 className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(balance.available_balance)}
                </h3>
              )}
              <p className="text-xs text-gray-400">Siap dicairkan ke rekening bank</p>
            </div>
            <div className="p-3 bg-violet-600/20 text-violet-400 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Omset Penjualan</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mb-2" />
              ) : (
                <h3 className="text-xl font-bold text-white mb-1">
                  {formatCurrency(balance.total_revenue)}
                </h3>
              )}
              <p className="text-xs text-gray-500">Akumulasi seluruh tiket lunas</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Sedang Diproses</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mb-2" />
              ) : (
                <h3 className="text-xl font-bold text-amber-400 mb-1">
                  {formatCurrency(balance.pending_amount)}
                </h3>
              )}
              <p className="text-xs text-gray-500">Menunggu transfer dari admin</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Total Paid / Settled */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Berhasil Dicairkan</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mb-2" />
              ) : (
                <h3 className="text-xl font-bold text-emerald-400 mb-1">
                  {formatCurrency(balance.paid_amount)}
                </h3>
              )}
              <p className="text-xs text-gray-500">{balance.total_requests} kali penarikan</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* History and Transactions Section */}
      <Card className="bg-gray-900 border-gray-800 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Riwayat Pengajuan Penarikan</h2>
            <p className="text-sm text-gray-400">Daftar mutasi permohonan transfer dana ke rekening bank Anda.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cari bank, nomor rek, nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'PENDING', label: 'Menunggu' },
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
                <th className="py-3.5 px-4">Tanggal Pengajuan</th>
                <th className="py-3.5 px-4">Nominal Penarikan</th>
                <th className="py-3.5 px-4">Rekening Tujuan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-6 w-20" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-gray-800/50 rounded-full text-gray-400">
                        <Wallet className="h-8 w-8" />
                      </div>
                      <p className="font-medium text-gray-400">Belum ada riwayat penarikan dana.</p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        {statusFilter !== 'ALL'
                          ? `Tidak ada transaksi dengan status ${statusFilter}.`
                          : 'Pendapatan dari tiket yang lunas dapat langsung ditarik ke rekening bank Anda.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => {
                  const amountNum = typeof w.amount === 'string' ? parseFloat(w.amount) : w.amount;
                  return (
                    <tr
                      key={w.id}
                      className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedWithdrawal(w)}
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{formatDate(w.created_at)}</div>
                        <div className="text-xs text-gray-500 font-mono">ID: {w.id.substring(0, 8)}...</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-base">{formatCurrency(amountNum)}</div>
                        <div className="text-xs text-gray-500">Biaya Admin: Rp 0</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {w.bank_name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{w.account_number} a.n {w.account_name}</div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(w.status)}
                        {w.status?.toUpperCase() === 'REJECTED' && getPgText(w.rejection_reason) && (
                          <div className="text-xs text-rose-400 mt-1 max-w-xs truncate">
                            Alasan: {getPgText(w.rejection_reason)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWithdrawal(w);
                          }}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: Request Withdrawal Form */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => !submitting && setIsRequestModalOpen(false)}
        title="Ajukan Penarikan Dana"
      >
        <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
          {/* Balance info banner */}
          <div className="p-4 bg-violet-950/40 border border-violet-500/20 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-violet-300 font-medium">Saldo Tersedia Saat Ini</p>
              <p className="text-xl font-bold text-white">{formatCurrency(balance.available_balance)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Minimal Penarikan</span>
              <p className="text-xs font-semibold text-gray-200">Rp 10.000</p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nominal Penarikan (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">
                Rp
              </span>
              <Input
                type="number"
                min={10000}
                max={balance.available_balance}
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="pl-10 text-lg font-bold"
                placeholder="0"
                required
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAmount(25)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(50)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(100)}
                className="px-2.5 py-1 text-xs bg-violet-900/60 hover:bg-violet-800 text-violet-200 rounded-md border border-violet-700/50"
              >
                Tarik Semua (100%)
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(100000)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700"
              >
                100rb
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(500000)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700"
              >
                500rb
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(1000000)}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700"
              >
                1 Juta
              </button>
            </div>
          </div>

          {/* Bank Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-gray-400" />
              Bank Tujuan
            </label>
            <select
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
              required
            >
              {BANK_OPTIONS.map((bank) => (
                <option key={bank.code} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-gray-400" />
              Nomor Rekening
            </label>
            <Input
              type="text"
              placeholder="Contoh: 1234567890"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              required
            />
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <User className="h-4 w-4 text-gray-400" />
              Nama Pemilik Rekening
            </label>
            <Input
              type="text"
              placeholder="Sesuai nama yang tertera di buku tabungan"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-gray-400" />
              Catatan Penarikan (Opsional)
            </label>
            <Input
              type="text"
              placeholder="Contoh: Pencairan tiket Batch 1 Konser Musik"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Fee & Final Settlement notice */}
          <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl space-y-1.5 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Nominal Dicairkan:</span>
              <span className="font-semibold text-white">{formatCurrency(formData.amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan Admin:</span>
              <span className="font-semibold text-emerald-400">Gratis (Rp 0)</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-1.5 text-sm">
              <span className="font-medium text-gray-200">Total Ditransfer:</span>
              <span className="font-bold text-violet-400">{formatCurrency(formData.amount || 0)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || formData.amount < 10000 || formData.amount > balance.available_balance}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {submitting ? 'Memproses...' : 'Konfirmasi & Tarik Dana'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Withdrawal Detail Receipt */}
      {selectedWithdrawal && (
        <Modal
          isOpen={!!selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          title="Rincian Pengajuan Penarikan Dana"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="text-center py-3 border-b border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-mono">
                ID: {selectedWithdrawal.id}
              </p>
              <h3 className="text-3xl font-extrabold text-white">
                {formatCurrency(
                  typeof selectedWithdrawal.amount === 'string'
                    ? parseFloat(selectedWithdrawal.amount)
                    : selectedWithdrawal.amount
                )}
              </h3>
              <div className="mt-3 flex justify-center">{getStatusBadge(selectedWithdrawal.status)}</div>
            </div>

            {/* Account & Bank details */}
            <div className="space-y-3 bg-gray-950 p-4 rounded-xl border border-gray-800 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Bank Tujuan:</span>
                <span className="font-semibold text-white">{selectedWithdrawal.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nomor Rekening:</span>
                <span className="font-mono font-bold text-white">{selectedWithdrawal.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nama Penerima:</span>
                <span className="font-semibold text-white">{selectedWithdrawal.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Waktu Pengajuan:</span>
                <span className="text-gray-200">{formatDate(selectedWithdrawal.created_at)}</span>
              </div>
              {getPgText(selectedWithdrawal.notes) && (
                <div className="border-t border-gray-800 pt-2 flex justify-between">
                  <span className="text-gray-400">Catatan:</span>
                  <span className="text-gray-200">{getPgText(selectedWithdrawal.notes)}</span>
                </div>
              )}
            </div>

            {/* Rejection Alert if any */}
            {selectedWithdrawal.status?.toUpperCase() === 'REJECTED' && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-start gap-3 text-sm text-rose-300">
                <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-200">Pengajuan Penarikan Ditolak</p>
                  <p className="text-xs mt-1 text-rose-300">
                    Alasan: {getPgText(selectedWithdrawal.rejection_reason) || 'Data rekening tidak valid atau kendala perbankan.'}
                  </p>
                  <p className="text-xs mt-2 text-gray-400">Saldo telah dikembalikan ke Saldo Tersedia Anda.</p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end">
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
