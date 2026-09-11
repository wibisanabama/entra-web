'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ticketApi } from '@/lib/api';
import { formatCurrency, formatDate, getPgText } from '@/lib/utils';
import { Withdrawal, OrganizerBalance, CreateWithdrawalRequest } from '@/types';
import { toast } from '@/lib/toast';
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

  const pendingCount = withdrawals.filter((w) => w.status?.toUpperCase() === 'PENDING').length;
  const approvedCount = withdrawals.filter((w) => w.status?.toUpperCase() === 'APPROVED').length;
  const paidCount = withdrawals.filter((w) => w.status?.toUpperCase() === 'PAID').length;
  const rejectedCount = withdrawals.filter((w) => w.status?.toUpperCase() === 'REJECTED').length;

  const filterTabs = [
    { id: 'ALL', label: `Semua (${withdrawals.length})` },
    { id: 'PENDING', label: `Menunggu (${pendingCount})` },
    { id: 'APPROVED', label: `Disetujui (${approvedCount})` },
    { id: 'PAID', label: `Selesai (${paidCount})` },
    { id: 'REJECTED', label: rejectedCount > 0 ? `Ditolak (${rejectedCount})` : 'Ditolak' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="warning" className="border-0 shadow-none font-bold text-[10px]">Menunggu Diproses</Badge>;
      case 'APPROVED':
        return <Badge variant="info" className="border-0 shadow-none font-bold text-[10px]">Disetujui Admin</Badge>;
      case 'PAID':
        return <Badge variant="success" className="border-0 shadow-none font-bold text-[10px]">Berhasil Dicairkan</Badge>;
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
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">Keuangan & Penarikan Dana</h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Kelola saldo pendapatan tiket event dan ajukan pencairan dana langsung ke rekening bank Anda.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-4 py-2 flex items-center gap-2 border-0 shadow-none cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenRequestModal}
            disabled={balance.available_balance < 10000}
            className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-5 py-2 flex items-center gap-2 border-0 shadow-none cursor-pointer disabled:opacity-50"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Tarik Dana
          </Button>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance Card */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Saldo Tersedia
              </p>
              {loading ? (
                <Skeleton className="h-7 w-36 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-zinc-950 mt-1">
                  {formatCurrency(balance.available_balance)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Siap dicairkan ke rekening</p>
            </div>
            <div className="p-2.5 bg-white text-zinc-900 rounded-xl border-0 shadow-none">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Omset</p>
              {loading ? (
                <Skeleton className="h-7 w-32 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-zinc-950 mt-1">
                  {formatCurrency(balance.total_revenue)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Akumulasi tiket lunas</p>
            </div>
            <div className="p-2.5 bg-white text-zinc-900 rounded-xl border-0 shadow-none">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Sedang Diproses</p>
              {loading ? (
                <Skeleton className="h-7 w-32 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-amber-600 mt-1">
                  {formatCurrency(balance.pending_amount)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">Menunggu transfer admin</p>
            </div>
            <div className="p-2.5 bg-white text-amber-600 rounded-xl border-0 shadow-none">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Total Paid / Settled */}
        <Card className="bg-zinc-100 rounded-2xl p-5 border-0 shadow-none">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Berhasil Dicairkan</p>
              {loading ? (
                <Skeleton className="h-7 w-32 mt-1 bg-zinc-200/70 rounded-lg" />
              ) : (
                <h3 className="text-2xl font-black tracking-tight text-emerald-600 mt-1">
                  {formatCurrency(balance.paid_amount)}
                </h3>
              )}
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">{balance.total_requests} kali penarikan</p>
            </div>
            <div className="p-2.5 bg-white text-emerald-600 rounded-xl border-0 shadow-none">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* History and Transactions Section */}
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

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari bank, nomor rek, nama..."
              aria-label="Cari bank, nomor rekening, atau nama penerima"
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
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 mb-1">Belum ada riwayat penarikan</h3>
            <p className="text-zinc-400 text-xs max-w-sm mx-auto">
              {statusFilter !== 'ALL'
                ? `Tidak ada transaksi dengan status ${statusFilter}.`
                : 'Pendapatan dari tiket yang lunas dapat langsung ditarik ke rekening bank Anda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-200/50 border-0">
                <tr>
                  <th scope="col" className="px-4 py-3.5 rounded-l-2xl">Tanggal Pengajuan</th>
                  <th scope="col" className="px-4 py-3.5">Nominal Penarikan</th>
                  <th scope="col" className="px-4 py-3.5">Rekening Tujuan</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-right rounded-r-2xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-28 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-24 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-40 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 bg-zinc-200/60 rounded-full" /></td>
                      <td className="px-4 py-3.5 text-right"><Skeleton className="h-7 w-16 ml-auto bg-zinc-200/60 rounded-full" /></td>
                    </tr>
                  ))
                ) : (
                  filteredWithdrawals.map((w) => {
                    const amountNum = typeof w.amount === 'string' ? parseFloat(w.amount) : w.amount;
                    return (
                      <tr
                        key={w.id}
                        className="hover:bg-zinc-200/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedWithdrawal(w)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-zinc-950 text-xs">{formatDate(w.created_at)}</div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">ID: {w.id.substring(0, 8)}...</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-black text-zinc-950 text-xs">{formatCurrency(amountNum)}</div>
                          <div className="text-[11px] text-zinc-400 font-medium">Biaya Admin: Rp 0</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                            <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                            {w.bank_name}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{w.account_number} a.n {w.account_name}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {getStatusBadge(w.status)}
                          {w.status?.toUpperCase() === 'REJECTED' && getPgText(w.rejection_reason) && (
                            <div className="text-[11px] text-rose-600 mt-1 max-w-xs truncate font-medium">
                              Alasan: {getPgText(w.rejection_reason)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full bg-white text-zinc-800 hover:bg-zinc-200 text-xs py-1 px-3.5 h-8 font-bold border-0 shadow-none cursor-pointer"
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
        )}
      </Card>

      {/* MODAL: Request Withdrawal Form */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => !submitting && setIsRequestModalOpen(false)}
        title="Ajukan Penarikan Dana"
      >
        <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
          {/* Balance info banner */}
          <div className="p-4 bg-zinc-100 rounded-2xl flex items-center justify-between border-0 shadow-none">
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
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nominal Penarikan (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="number"
                min={10000}
                max={balance.available_balance}
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full pl-12 pr-4 py-3 bg-zinc-100 border-0 shadow-none text-lg font-bold text-zinc-950 rounded-2xl focus:outline-none focus:bg-zinc-200/60 transition-all"
                placeholder="0"
                required
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAmount(25)}
                className="px-3.5 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full font-bold transition-colors border-0 shadow-none cursor-pointer"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(50)}
                className="px-3.5 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full font-bold transition-colors border-0 shadow-none cursor-pointer"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(100)}
                className="px-3.5 py-1.5 text-xs bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold transition-colors border-0 shadow-none cursor-pointer"
              >
                Tarik Semua (100%)
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(100000)}
                className="px-3.5 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full font-bold transition-colors border-0 shadow-none cursor-pointer"
              >
                100rb
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(500000)}
                className="px-3.5 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full font-bold transition-colors border-0 shadow-none cursor-pointer"
              >
                500rb
              </button>
              <button
                type="button"
                onClick={() => handleFixedAmount(1000000)}
                className="px-3.5 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full font-bold transition-colors border-0 shadow-none cursor-pointer"
              >
                1 Juta
              </button>
            </div>
          </div>

          {/* Bank Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-zinc-400" />
              Bank Tujuan
            </label>
            <select
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-100 border-0 shadow-none rounded-2xl text-xs font-semibold text-zinc-950 focus:outline-none focus:bg-zinc-200/60 transition-colors cursor-pointer"
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
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              Nomor Rekening
            </label>
            <input
              type="text"
              placeholder="Contoh: 1234567890"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-100 border-0 shadow-none rounded-2xl text-xs font-medium text-zinc-950 placeholder-zinc-400 focus:outline-none focus:bg-zinc-200/60 transition-colors"
              required
            />
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Nama Pemilik Rekening
            </label>
            <input
              type="text"
              placeholder="Sesuai nama yang tertera di buku tabungan"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-100 border-0 shadow-none rounded-2xl text-xs font-medium text-zinc-950 placeholder-zinc-400 focus:outline-none focus:bg-zinc-200/60 transition-colors"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              Catatan Penarikan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Pencairan tiket Batch 1 Konser Musik"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-100 border-0 shadow-none rounded-2xl text-xs font-medium text-zinc-950 placeholder-zinc-400 focus:outline-none focus:bg-zinc-200/60 transition-colors"
            />
          </div>

          {/* Fee & Final Settlement notice */}
          <div className="p-4 bg-zinc-100 rounded-2xl space-y-2 text-xs text-zinc-600 border-0 shadow-none">
            <div className="flex justify-between">
              <span>Nominal Dicairkan:</span>
              <span className="font-bold text-zinc-950">{formatCurrency(formData.amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Biaya Layanan Admin:</span>
              <span className="font-bold text-emerald-600">Gratis (Rp 0)</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200/60 pt-2 text-sm">
              <span className="font-bold text-zinc-950">Total Ditransfer:</span>
              <span className="font-black text-zinc-950">{formatCurrency(formData.amount || 0)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRequestModalOpen(false)}
              disabled={submitting}
              className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-5 py-2.5 border-0 shadow-none cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || formData.amount < 10000 || formData.amount > balance.available_balance}
              className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-6 py-2.5 border-0 shadow-none cursor-pointer disabled:opacity-50"
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
            <div className="text-center py-3 border-b border-zinc-200/50">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1 font-mono">
                ID: {selectedWithdrawal.id}
              </p>
              <h3 className="text-3xl font-black text-zinc-950">
                {formatCurrency(
                  typeof selectedWithdrawal.amount === 'string'
                    ? parseFloat(selectedWithdrawal.amount)
                    : selectedWithdrawal.amount
                )}
              </h3>
              <div className="mt-3 flex justify-center">{getStatusBadge(selectedWithdrawal.status)}</div>
            </div>

            {/* Account & Bank details */}
            <div className="space-y-3 bg-zinc-100 p-5 rounded-2xl border-0 shadow-none text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Bank Tujuan:</span>
                <span className="font-bold text-zinc-900 text-xs">{selectedWithdrawal.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Nomor Rekening:</span>
                <span className="font-mono font-bold text-zinc-900 text-xs">{selectedWithdrawal.account_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Nama Penerima:</span>
                <span className="font-bold text-zinc-900 text-xs">{selectedWithdrawal.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 text-xs font-medium">Waktu Pengajuan:</span>
                <span className="text-zinc-700 text-xs font-medium">{formatDate(selectedWithdrawal.created_at)}</span>
              </div>
              {getPgText(selectedWithdrawal.notes) && (
                <div className="border-t border-zinc-200/60 pt-2 flex justify-between">
                  <span className="text-zinc-500 text-xs font-medium">Catatan:</span>
                  <span className="text-zinc-700 text-xs font-medium">{getPgText(selectedWithdrawal.notes)}</span>
                </div>
              )}
            </div>

            {/* Rejection Alert if any */}
            {selectedWithdrawal.status?.toUpperCase() === 'REJECTED' && (
              <div className="p-4 bg-rose-50 rounded-2xl border-0 shadow-none flex items-start gap-3 text-sm text-rose-900">
                <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-rose-950">Pengajuan Penarikan Ditolak</p>
                  <p className="text-xs mt-1 text-rose-700 font-medium">
                    Alasan: {getPgText(selectedWithdrawal.rejection_reason) || 'Data rekening tidak valid atau kendala perbankan.'}
                  </p>
                  <p className="text-xs mt-2 text-zinc-500 font-medium">Saldo telah dikembalikan ke Saldo Tersedia Anda.</p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end">
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
