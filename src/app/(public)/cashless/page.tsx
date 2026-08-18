'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { cashlessApi } from '@/lib/api';
import { Wallet, Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  QrCode,
  Zap,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Sparkles,
  Store,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Shirt,
  Coffee,
  Copy,
  Check,
  Landmark,
  ArrowDownToLine
} from 'lucide-react';
import { toast } from 'sonner';

const PRESET_TOPUP_AMOUNTS = [25000, 50000, 100000, 200000, 500000];

const SAMPLE_MERCHANTS = [
  { id: 'm-food-01', name: 'Festival Street Food & Snack', category: 'Food & Beverage', icon: <UtensilsCrossed className="h-5 w-5" /> },
  { id: 'm-drink-02', name: 'Entra Coffee & Beverage Bar', category: 'Coffee & Drinks', icon: <Coffee className="h-5 w-5" /> },
  { id: 'm-merch-03', name: 'Official Festival Merchandise Store', category: 'Merchandise', icon: <Shirt className="h-5 w-5" /> },
];

const BANK_OPTIONS = ['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'SeaBank', 'Bank Jago', 'GoPay', 'OVO', 'DANA'];

export default function CashlessPortalPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<'ALL' | 'TOPUP' | 'PURCHASE' | 'REFUND'>('ALL');
  const [copied, setCopied] = useState(false);

  // Top-Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(100000);
  const [customTopUpInput, setCustomTopUpInput] = useState<string>('100000');
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Merchant POS Simulation Modal State
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(SAMPLE_MERCHANTS[0]);
  const [posAmount, setPosAmount] = useState<number>(35000);
  const [customPosInput, setCustomPosInput] = useState<string>('35000');
  const [posLoading, setPosLoading] = useState(false);

  // Wristband Balance Refund Modal State
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [customRefundInput, setCustomRefundInput] = useState<string>('0');
  const [refundBank, setRefundBank] = useState<string>(BANK_OPTIONS[0]);
  const [refundAccountNumber, setRefundAccountNumber] = useState<string>('');
  const [refundAccountHolder, setRefundAccountHolder] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Selesai event festival');
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchWalletAndTransactions = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [walletRes, txRes] = await Promise.all([
        cashlessApi.get('/api/v1/cashless/wallet').catch(() => null),
        cashlessApi.get('/api/v1/cashless/transactions').catch(() => null),
      ]);

      if (walletRes && walletRes.data) {
        setWallet(walletRes.data);
      }
      if (txRes && txRes.data) {
        setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch cashless data:', error);
      toast.error('Gagal memuat informasi saldo gelang cashless.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchWalletAndTransactions();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const parseAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    return parseFloat(val) || 0;
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount < 10000) {
      toast.error('Minimal nominal top-up saldo adalah Rp 10.000');
      return;
    }

    try {
      setTopUpLoading(true);
      await cashlessApi.post('/api/v1/cashless/topup', {
        amount: topUpAmount,
      });

      toast.success(`Top-Up saldo gelang sebesar ${formatCurrency(topUpAmount)} berhasil diproses!`);
      setIsTopUpOpen(false);
      fetchWalletAndTransactions();
    } catch (error: any) {
      console.error('Top-Up error:', error);
      toast.error(error.message || 'Gagal memproses top-up saldo.');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handlePosPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posAmount <= 0) {
      toast.error('Nominal transaksi harus lebih dari Rp 0');
      return;
    }

    const currentBal = parseAmount(wallet?.balance);
    if (currentBal < posAmount) {
      toast.error(`Saldo gelang tidak mencukupi. Saldo Anda: ${formatCurrency(currentBal)}`);
      return;
    }

    try {
      setPosLoading(true);
      await cashlessApi.post('/api/v1/cashless/pay', {
        amount: posAmount,
        merchant_id: '00000000-0000-0000-0000-000000000001',
      });

      toast.success(
        `Pembayaran Tap-to-Pay sebesar ${formatCurrency(posAmount)} di ${selectedMerchant.name} berhasil!`
      );
      setIsPosOpen(false);
      fetchWalletAndTransactions();
    } catch (error: any) {
      console.error('POS payment error:', error);
      toast.error(error.message || 'Pembayaran gelang di merchant gagal.');
    } finally {
      setPosLoading(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentBal = parseAmount(wallet?.balance);
    if (refundAmount < 1000) {
      toast.error('Minimal nominal penarikan saldo refund adalah Rp 1.000');
      return;
    }
    if (refundAmount > currentBal) {
      toast.error(`Saldo tidak mencukupi. Saldo aktif Anda: ${formatCurrency(currentBal)}`);
      return;
    }
    if (!refundAccountNumber.trim() || !refundAccountHolder.trim()) {
      toast.error('Harap lengkapi nomor rekening dan nama pemilik rekening tujuan');
      return;
    }

    try {
      setRefundLoading(true);
      await cashlessApi.post('/api/v1/cashless/refund', {
        amount: refundAmount,
        bank_name: refundBank,
        account_number: refundAccountNumber.trim(),
        account_holder: refundAccountHolder.trim(),
        reason: refundReason.trim() || 'Refund sisa saldo gelang',
      });

      toast.success(`Pengajuan refund saldo ${formatCurrency(refundAmount)} ke ${refundBank} berhasil diproses!`);
      setIsRefundOpen(false);
      fetchWalletAndTransactions();
    } catch (error: any) {
      console.error('Refund error:', error);
      toast.error(error.message || 'Gagal mengajukan refund saldo gelang.');
    } finally {
      setRefundLoading(false);
    }
  };

  const handleCopyWristbandCode = () => {
    if (wallet?.id) {
      navigator.clipboard.writeText(wallet.id);
      setCopied(true);
      toast.success('Wristband UID berhasil disalin ke clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const isTopUp = tx.type?.toUpperCase() === 'TOPUP' || tx.type?.toUpperCase() === 'CREDIT';
    const isRefund = tx.description?.toLowerCase().includes('refund');
    if (txFilter === 'TOPUP') return isTopUp && !isRefund;
    if (txFilter === 'REFUND') return isRefund;
    if (txFilter === 'PURCHASE') return !isTopUp && !isRefund;
    return true;
  });

  if (!authLoading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-md mx-auto space-y-6 bg-gray-900 border border-gray-800 p-8 rounded-2xl">
          <div className="p-4 bg-violet-600/20 text-violet-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <CreditCard className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Masuk ke Portal Cashless</h2>
            <p className="text-gray-400 text-sm">
              Silakan masuk ke akun Entra Anda untuk mengakses saldo gelang RFID festival dan riwayat transaksi.
            </p>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              Masuk Sekarang
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const balanceAmount = parseAmount(wallet?.balance);
  const wristbandUid = wallet?.id ? `ENTRA-RFID-${wallet.id.substring(0, 8).toUpperCase()}` : 'ENTRA-RFID-PASS';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-violet-600/20 text-violet-400 rounded-lg">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              NFC / RFID Digital Festival Pass
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Portal Gelang RFID Cashless
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Cek saldo aktif gelang festival, top-up saldo instan, refund sisa dana, dan pantau transaksi tenant F&B.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchWalletAndTransactions}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Hero Wristband Digital Pass & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* RFID Wristband Pass Card */}
        <div className="lg:col-span-2 relative bg-gradient-to-br from-violet-950/80 via-purple-900/40 to-gray-950 rounded-3xl p-6 sm:p-8 border border-violet-500/40 shadow-2xl overflow-hidden flex flex-col justify-between group">
          {/* Background Ambient Glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-600/30 rounded-2xl text-violet-300 border border-violet-400/30">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-300">
                      Entra Festival Wristband
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <h3 className="text-white font-mono text-sm font-semibold mt-0.5">
                    {user?.full_name || 'Festival Attendee'}
                  </h3>
                </div>
              </div>

              <Badge variant="success" className="text-xs py-1 px-3">
                RFID AKTIF
              </Badge>
            </div>

            {/* Live Balance Counter */}
            <div className="space-y-1">
              <span className="text-xs text-gray-400 uppercase tracking-wider block font-medium">
                Saldo Aktif Gelang
              </span>
              {loading ? (
                <Skeleton className="h-12 w-48 bg-violet-950/60" />
              ) : (
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {formatCurrency(balanceAmount)}
                </h2>
              )}
              <p className="text-xs text-violet-300/80">
                Dapat digunakan di seluruh tenant F&B dan Official Merch festival.
              </p>
            </div>

            {/* Wristband UID and QR Code Stub */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider block">
                  Wristband UID / Kode Kartu
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-violet-300 tracking-wider">
                    {wristbandUid}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWristbandCode}
                    className="p-1 hover:bg-violet-800/40 rounded text-gray-400 hover:text-white transition-colors"
                    title="Salin Kode UID"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-xl border border-white/10 w-fit">
                <div className="bg-white p-1 rounded-lg">
                  <QRCodeSVG value={wallet?.id || 'entra-wristband'} size={40} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 uppercase block font-bold">NFC TAP-READY</span>
                  <span className="text-xs font-mono text-white font-bold">0.05s SPEED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-col justify-between gap-4 bg-gray-900 border border-gray-800 rounded-3xl p-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Aksi Cepat Gelang</h3>
            <p className="text-xs text-gray-400">
              Isi ulang saldo instan, bayar di kasir, atau cairkan sisa saldo gelang Anda.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setTopUpAmount(100000);
                setCustomTopUpInput('100000');
                setIsTopUpOpen(true);
              }}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-sm shadow-lg shadow-violet-900/30"
            >
              <Zap className="h-4 w-4" />
              Top-Up Saldo Gelang
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setPosAmount(35000);
                setCustomPosInput('35000');
                setIsPosOpen(true);
              }}
              className="w-full border-gray-700 hover:bg-gray-800 text-gray-200 font-semibold py-5 rounded-2xl flex items-center justify-center gap-3 text-xs"
            >
              <Store className="h-4 w-4 text-emerald-400" />
              Simulasi Kasir POS (Tap to Pay)
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setRefundAmount(balanceAmount > 0 ? balanceAmount : 0);
                setCustomRefundInput(balanceAmount > 0 ? balanceAmount.toString() : '0');
                setRefundAccountHolder(user?.full_name || '');
                setIsRefundOpen(true);
              }}
              disabled={balanceAmount <= 0}
              className="w-full border-rose-900/40 hover:bg-rose-950/30 text-rose-400 font-semibold py-5 rounded-2xl flex items-center justify-center gap-3 text-xs"
            >
              <ArrowDownToLine className="h-4 w-4 text-rose-400" />
              Tarik Saldo Gelang (Refund)
            </Button>
          </div>

          <div className="p-3.5 bg-gray-950 rounded-xl border border-gray-800 text-xs text-gray-400 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>Sisa saldo gelang dapat di-refund kapan saja setelah event festival berakhir.</span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <Card className="bg-gray-900 border-gray-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Riwayat Transaksi Gelang</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Seluruh mutasi saldo top-up, belanja kasir, dan penarikan refund tercatat secara real-time.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs w-fit gap-1">
            <button
              onClick={() => setTxFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                txFilter === 'ALL' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Semua ({transactions.length})
            </button>
            <button
              onClick={() => setTxFilter('TOPUP')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                txFilter === 'TOPUP' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Top-Up Saldo
            </button>
            <button
              onClick={() => setTxFilter('PURCHASE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                txFilter === 'PURCHASE' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Belanja Tenant
            </button>
            <button
              onClick={() => setTxFilter('REFUND')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                txFilter === 'REFUND' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Refund
            </button>
          </div>
        </div>

        {/* Transaction Items */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full bg-gray-800/60 rounded-xl" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-gray-500 space-y-3">
            <CreditCard className="h-10 w-10 mx-auto text-gray-600" />
            <p className="text-sm font-medium">Belum ada mutasi transaksi pada filter ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type?.toUpperCase() === 'CREDIT' || tx.type?.toUpperCase() === 'TOPUP';
              const isRefund = tx.description?.toLowerCase().includes('refund');
              const amount = parseAmount(tx.amount);

              return (
                <div key={tx.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isRefund
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : isCredit
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                      }`}
                    >
                      {isRefund ? (
                        <ArrowDownToLine className="h-5 w-5" />
                      ) : isCredit ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {tx.description || (isCredit ? 'Top-Up Saldo Gelang' : 'Pembayaran Tenant')}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {tx.created_at ? formatDate(tx.created_at) : 'Waktu transaksi'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isRefund ? 'text-rose-400' : isCredit ? 'text-emerald-400' : 'text-gray-200'
                      }`}
                    >
                      {isCredit ? '+' : '-'} {formatCurrency(amount)}
                    </span>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider">
                      {isRefund ? 'REFUND DIKIRIM' : isCredit ? 'BERHASIL' : 'DIBAYAR'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* MODAL 1: Top-Up Saldo Gelang */}
      {isTopUpOpen && (
        <Modal
          isOpen={isTopUpOpen}
          onClose={() => !topUpLoading && setIsTopUpOpen(false)}
          title="Top-Up Saldo Gelang Festival"
        >
          <form onSubmit={handleTopUpSubmit} className="space-y-5">
            <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-400 space-y-1">
              <p className="text-white font-semibold flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-violet-400" />
                Isi Ulang Saldo Instan
              </p>
              <p>Saldo akan langsung masuk ke RFID wristband pass Anda dan siap ditap di merchant festival.</p>
            </div>

            {/* Quick Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Pilih Nominal Cepat
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_TOPUP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTopUpAmount(amt);
                      setCustomTopUpInput(amt.toString());
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      topUpAmount === amt
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nominal Lain (Rp)
              </label>
              <input
                type="number"
                min="10000"
                step="5000"
                value={customTopUpInput}
                onChange={(e) => {
                  setCustomTopUpInput(e.target.value);
                  setTopUpAmount(Number(e.target.value) || 0);
                }}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-bold focus:outline-none focus:border-violet-500"
                placeholder="Minimal Rp 10.000"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={topUpLoading}
                onClick={() => setIsTopUpOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={topUpLoading || topUpAmount < 10000}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 font-bold"
              >
                {topUpLoading ? 'Memproses...' : `Top-Up ${formatCurrency(topUpAmount)}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Simulasi Kasir Tenant POS (Tap to Pay) */}
      {isPosOpen && (
        <Modal
          isOpen={isPosOpen}
          onClose={() => !posLoading && setIsPosOpen(false)}
          title="Simulasi Kasir Merchant / Tap to Pay"
        >
          <form onSubmit={handlePosPayment} className="space-y-5">
            <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-400 space-y-1">
              <p className="text-white font-semibold flex items-center gap-1.5">
                <Store className="h-4 w-4 text-emerald-400" />
                Simulasi Mesin POS Tenant Festival
              </p>
              <p>
                Simulasi pemindaian gelang NFC pengunjung di booth makanan/minuman/merchandise untuk memotong saldo secara instan.
              </p>
            </div>

            {/* Select Merchant */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Pilih Tenant / Merchant
              </label>
              <div className="space-y-2">
                {SAMPLE_MERCHANTS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMerchant(m)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      selectedMerchant.id === m.id
                        ? 'bg-violet-950/40 border-violet-500 text-white'
                        : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-800 rounded-lg text-violet-400">{m.icon}</div>
                      <div>
                        <p className="text-xs font-bold text-white">{m.name}</p>
                        <p className="text-[11px] text-gray-500">{m.category}</p>
                      </div>
                    </div>
                    {selectedMerchant.id === m.id && (
                      <CheckCircle2 className="h-5 w-5 text-violet-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Belanja Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Tagihan Belanja (Rp)
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                value={customPosInput}
                onChange={(e) => {
                  setCustomPosInput(e.target.value);
                  setPosAmount(Number(e.target.value) || 0);
                }}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={posLoading}
                onClick={() => setIsPosOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={posLoading || posAmount <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-bold flex items-center gap-1.5"
              >
                {posLoading ? 'Memproses...' : `Tap Gelang & Bayar (${formatCurrency(posAmount)})`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Form Pengajuan Refund Sisa Saldo Gelang */}
      {isRefundOpen && (
        <Modal
          isOpen={isRefundOpen}
          onClose={() => !refundLoading && setIsRefundOpen(false)}
          title="Tarik Sisa Saldo Gelang (Refund)"
        >
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-400 space-y-1">
              <p className="text-white font-semibold flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-rose-400" />
                Pencairan Saldo ke Rekening / E-Wallet
              </p>
              <p>
                Saldo gelang yang tidak terpakai akan ditransfer langsung ke rekening bank atau e-wallet Anda.
              </p>
            </div>

            {/* Quick Percentage Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                <span>Nominal Refund (Rp)</span>
                <span className="text-violet-400">Saldo: {formatCurrency(balanceAmount)}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Semua (100%)', val: balanceAmount },
                  { label: '50%', val: Math.floor(balanceAmount * 0.5) },
                  { label: 'Rp 50.000', val: 50000 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const actual = Math.min(preset.val, balanceAmount);
                      setRefundAmount(actual);
                      setCustomRefundInput(actual.toString());
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      refundAmount === preset.val
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1000"
                max={balanceAmount}
                value={customRefundInput}
                onChange={(e) => {
                  setCustomRefundInput(e.target.value);
                  setRefundAmount(Number(e.target.value) || 0);
                }}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500 mt-2"
                placeholder="Nominal yang ditarik..."
                required
              />
            </div>

            {/* Bank Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Bank / E-Wallet Tujuan
              </label>
              <select
                value={refundBank}
                onChange={(e) => setRefundBank(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nomor Rekening / No. HP E-Wallet
              </label>
              <input
                type="text"
                value={refundAccountNumber}
                onChange={(e) => setRefundAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-rose-500"
                placeholder="Contoh: 1234567890"
                required
              />
            </div>

            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nama Pemilik Rekening
              </label>
              <input
                type="text"
                value={refundAccountHolder}
                onChange={(e) => setRefundAccountHolder(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-rose-500"
                placeholder="Nama sesuai buku tabungan"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={refundLoading}
                onClick={() => setIsRefundOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={refundLoading || refundAmount <= 0 || refundAmount > balanceAmount}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 font-bold flex items-center gap-1.5"
              >
                {refundLoading ? 'Memproses...' : `Cairkan ${formatCurrency(refundAmount)}`}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
