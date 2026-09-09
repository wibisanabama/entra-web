'use client';

import { useEffect, useState, useCallback } from 'react';
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

  const fetchData = useCallback(async () => {
    try {
      const [balanceRes, withdrawalsRes] = await Promise.all([
        ticketApi.get<OrganizerBalance>('/api/v1/tickets/organizer/balance').catch(() => ({ success: false, data: null })),
        ticketApi.get<Withdrawal[]>('/api/v1/tickets/organizer/withdrawals').catch(() => ({ success: false, data: [] as Withdrawal[] }))
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    } catch (error: unknown) {
      console.error('Withdrawal error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal mengajukan penarikan dana.';
      toast.error(errMsg);
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800">
            <Wallet className="h-3.5 w-3.5 text-zinc-600" />
            <span className="text-xs font-bold uppercase tracking-wider">Financial Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">Keuangan & Penarikan Dana</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Kelola saldo pendapatan tiket event dan ajukan pencairan dana langsung ke rekening bank Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenRequestModal}
            disabled={balance.available_balance < 10000}
            className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-5 py-2 flex items-center gap-2 shadow-none disabled:opacity-50"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Tarik Dana
          </Button>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Available Balance Card (Main Highlight) */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold mb-1 uppercase tracking-wider">
                Saldo Tersedia
              </p>
              {loading ? (
                <Skeleton className="h-8 w-36 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-zinc-950 mb-1">
                  {formatCurrency(balance.available_balance)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">Siap dicairkan ke rekening</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold mb-1 uppercase tracking-wider">Total Omset</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-zinc-950 mb-1">
                  {formatCurrency(balance.total_revenue)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">Akumulasi seluruh tiket lunas</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold mb-1 uppercase tracking-wider">Sedang Diproses</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-amber-600 mb-1">
                  {formatCurrency(balance.pending_amount)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">Menunggu transfer admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Total Paid / Settled */}
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold mb-1 uppercase tracking-wider">Berhasil Dicairkan</p>
              {loading ? (
                <Skeleton className="h-8 w-32 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight text-emerald-600 mb-1">
                  {formatCurrency(balance.paid_amount)}
                </h3>
              )}
              <p className="text-xs text-zinc-400">{balance.total_requests} kali penarikan</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* History and Transactions Section */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Riwayat Pengajuan Penarikan</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Daftar mutasi permohonan transfer dana ke rekening bank Anda.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari bank, nomor rek, nama..."
                aria-label="Cari bank, nomor rekening, atau nama penerima"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50/80 border border-zinc-200 rounded-full text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-zinc-100 p-1 rounded-full text-xs">
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
                <th className="py-3.5 px-5">Tanggal Pengajuan</th>
                <th className="py-3.5 px-5">Nominal Penarikan</th>
                <th className="py-3.5 px-5">Rekening Tujuan</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-28 rounded-md" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-24 rounded-md" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-4 w-40 rounded-md" /></td>
                    <td className="py-4 px-5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="py-4 px-5 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-full" /></td>
                  </tr>
                ))
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-sm text-zinc-900">Belum ada riwayat penarikan dana.</p>
                      <p className="text-xs text-zinc-500 max-w-sm">
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
                      className="hover:bg-zinc-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedWithdrawal(w)}
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-zinc-950 text-sm">{formatDate(w.created_at)}</div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">ID: {w.id.substring(0, 8)}...</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-zinc-950 text-base">{formatCurrency(amountNum)}</div>
                        <div className="text-xs text-zinc-400">Biaya Admin: Rp 0</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-zinc-900 flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                          {w.bank_name}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono mt-0.5">{w.account_number} a.n {w.account_name}</div>
                      </td>
                      <td className="py-4 px-5">
                        {getStatusBadge(w.status)}
                        {w.status?.toUpperCase() === 'REJECTED' && getPgText(w.rejection_reason) && (
                          <div className="text-xs text-rose-600 mt-1 max-w-xs truncate font-medium">
                            Alasan: {getPgText(w.rejection_reason)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs px-3.5 py-1 font-medium"
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
      </div>

      {/* MODAL: Request Withdrawal Form */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => !submitting && setIsRequestModalOpen(false)}
        title="Ajukan Penarikan Dana"
      >
        <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
          {/* Balance info banner */}
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Saldo Tersedia Saat Ini</p>
              <p className="text-xl font-bold text-zinc-950">{formatCurrency(balance.available_balance)}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400">Minimal Penarikan</span>
              <p className="text-xs font-semibold text-zinc-800">Rp 10.000</p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nominal Penarikan (Rp)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                Rp
              </span>
              <Input
                type="number"
                min={10000}
                max={balance.available_balance}
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="pl-11 text-lg font-bold bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-950 rounded-xl"
                placeholder="0"
                required
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAmount(25)}
                className="px-3 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full font-medium transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(50)}
                className="px-3 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full font-medium transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(100)}
                className="px-3 py-1 text-xs bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-semibold transition-colors"
              >
                Tarik Semua (100%)
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(100000)}
                className="px-3 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full font-medium transition-colors"
              >
                100rb
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(500000)}
                className="px-3 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full font-medium transition-colors"
              >
                500rb
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(1000000)}
                className="px-3 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full font-medium transition-colors"
              >
                1 Juta
              </button>
            </div>
          </div>

          {/* Bank Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-zinc-400" />
              Bank Tujuan
            </label>
            <select
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              Nomor Rekening
            </label>
            <Input
              type="text"
              placeholder="Contoh: 1234567890"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-950 rounded-xl"
              required
            />
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Nama Pemilik Rekening
            </label>
            <Input
              type="text"
              placeholder="Sesuai nama yang tertera di buku tabungan"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-950 rounded-xl"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              Catatan Penarikan (Opsional)
            </label>
            <Input
              type="text"
              placeholder="Contoh: Pencairan tiket Batch 1 Konser Musik"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-zinc-50 border-zinc-200 focus:bg-white text-zinc-950 rounded-xl text-xs"
            />
          </div>

          {/* Fee & Final Settlement notice */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-xs text-zinc-600">
            <div className="flex justify-between">
              <span>Nominal Dicairkan:</span>
              <span className="font-semibold text-zinc-950">{formatCurrency(formData.amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan Admin:</span>
              <span className="font-semibold text-emerald-600">Gratis (Rp 0)</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-sm">
              <span className="font-semibold text-zinc-950">Total Ditransfer:</span>
              <span className="font-bold text-zinc-950">{formatCurrency(formData.amount || 0)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
              disabled={submitting}
              className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium px-4 py-2"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || formData.amount < 10000 || formData.amount > balance.available_balance}
              className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-5 py-2"
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
            <div className="text-center py-3 border-b border-zinc-100">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1 font-mono">
                ID: {selectedWithdrawal.id}
              </p>
              <h3 className="text-3xl font-extrabold text-zinc-950">
                {formatCurrency(
                  typeof selectedWithdrawal.amount === 'string'
                    ? parseFloat(selectedWithdrawal.amount)
                    : selectedWithdrawal.amount
                )}
              </h3>
              <div className="mt-3 flex justify-center">{getStatusBadge(selectedWithdrawal.status)}</div>
            </div>

            {/* Account & Bank details */}
            <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Bank Tujuan:</span>
                <span className="font-semibold text-zinc-900 text-xs">{selectedWithdrawal.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Nomor Rekening:</span>
                <span className="font-mono font-bold text-zinc-900 text-xs">{selectedWithdrawal.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Nama Penerima:</span>
                <span className="font-semibold text-zinc-900 text-xs">{selectedWithdrawal.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs">Waktu Pengajuan:</span>
                <span className="text-zinc-700 text-xs">{formatDate(selectedWithdrawal.created_at)}</span>
              </div>
              {getPgText(selectedWithdrawal.notes) && (
                <div className="border-t border-zinc-200 pt-2 flex justify-between">
                  <span className="text-zinc-500 text-xs">Catatan:</span>
                  <span className="text-zinc-700 text-xs">{getPgText(selectedWithdrawal.notes)}</span>
                </div>
              )}
            </div>

            {/* Rejection Alert if any */}
            {selectedWithdrawal.status?.toUpperCase() === 'REJECTED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-900">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs text-red-950">Pengajuan Penarikan Ditolak</p>
                  <p className="text-xs mt-1 text-red-700">
                    Alasan: {getPgText(selectedWithdrawal.rejection_reason) || 'Data rekening tidak valid atau kendala perbankan.'}
                  </p>
                  <p className="text-xs mt-2 text-zinc-500">Saldo telah dikembalikan ke Saldo Tersedia Anda.</p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold px-5 py-2"
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
