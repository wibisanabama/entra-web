'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { cashlessApi } from '@/lib/api';
import { Wallet, Transaction } from '@/types';
import { formatCurrency, formatDate, getPgText } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Store,
  CheckCircle2,
  UtensilsCrossed,
  Shirt,
  Coffee,
  Copy,
  Check,
  Landmark,
  ArrowDownToLine
} from 'lucide-react';
import { toast } from '@/lib/toast';

const PRESET_TOPUP_AMOUNTS = [25000, 50000, 100000, 200000, 500000];

const SAMPLE_MERCHANTS = [
  { id: 'm-food-01', name: 'Festival Street Food & Snack', category: 'Food & Beverage', icon: <UtensilsCrossed className="h-5 w-5" /> },
  { id: 'm-drink-02', name: 'Entra Coffee & Beverage Bar', category: 'Coffee & Drinks', icon: <Coffee className="h-5 w-5" /> },
  { id: 'm-merch-03', name: 'Official Festival Merchandise Store', category: 'Merchandise', icon: <Shirt className="h-5 w-5" /> },
];

const BANK_OPTIONS = ['BCA', 'Bank Mandiri', 'BNI', 'BRI', 'SeaBank', 'Bank Jago', 'GoPay', 'OVO', 'DANA'];

export default function CashlessPortalPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<'ALL' | 'TOPUP' | 'PURCHASE' | 'REFUND'>('ALL');
  const [copied, setCopied] = useState(false);

  // Filter tabs sliding indicator ala Mobbin (persis seperti kategori di /)
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const filterTabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [filterIndicatorStyle, setFilterIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [isFilterReady, setIsFilterReady] = useState(false);

  useEffect(() => {
    const activeEl = filterTabsRef.current[txFilter];
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
  }, [txFilter, transactions.length, isFilterReady]);

  useEffect(() => {
    const handleResize = () => {
      const activeEl = filterTabsRef.current[txFilter];
      if (activeEl) {
        setFilterIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [txFilter]);

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

  const fetchWalletAndTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const [walletRes, txRes] = await Promise.all([
        cashlessApi.get<Wallet>('/api/v1/cashless/wallet').catch(() => null),
        cashlessApi.get<Transaction[]>('/api/v1/cashless/transactions').catch(() => null),
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
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchWalletAndTransactions();
    }
  }, [user, authLoading, fetchWalletAndTransactions]);

  const loading = authLoading || (user ? dataLoading : false);

  const parseAmount = (val: number | string | undefined | null): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    return 0;
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
    } catch (error: unknown) {
      console.error('Top-Up error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memproses top-up saldo.';
      toast.error(errMsg);
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
        merchant_id: selectedMerchant.id,
      });

      toast.success(
        `Pembayaran Tap-to-Pay sebesar ${formatCurrency(posAmount)} di ${selectedMerchant.name} berhasil!`
      );
      setIsPosOpen(false);
      fetchWalletAndTransactions();
    } catch (error: unknown) {
      console.error('POS payment error:', error);
      const errMsg = error instanceof Error ? error.message : 'Pembayaran gelang di merchant gagal.';
      toast.error(errMsg);
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
    } catch (error: unknown) {
      console.error('Refund error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal mengajukan refund saldo gelang.';
      toast.error(errMsg);
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
    const isRefund = getPgText(tx.description).toLowerCase().includes('refund');
    if (txFilter === 'TOPUP') return isTopUp && !isRefund;
    if (txFilter === 'REFUND') return isRefund;
    if (txFilter === 'PURCHASE') return !isTopUp && !isRefund;
    return true;
  });

  if (!authLoading && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-zinc-900">
        <div className="text-center max-w-md mx-auto space-y-6 bg-zinc-100 p-8 sm:p-10 rounded-3xl border-0 shadow-none">
          <div className="p-4 bg-white text-zinc-900 rounded-full w-16 h-16 mx-auto flex items-center justify-center border-0 shadow-none">
            <CreditCard className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-950 mb-2">Masuk ke Portal Cashless</h2>
            <p className="text-zinc-500 text-sm">
              Silakan masuk ke akun Entra Anda untuk mengakses saldo gelang RFID festival dan riwayat transaksi.
            </p>
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-full py-3 border-0 shadow-none">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-950 tracking-tight">
            Portal Gelang RFID Cashless
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Cek saldo aktif gelang festival, top-up saldo instan, refund sisa dana, dan pantau transaksi tenant F&B.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchWalletAndTransactions}
            disabled={loading}
            className="flex items-center gap-2 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border-0 rounded-full text-xs font-semibold px-4 py-2 shadow-none"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Hero Wristband Digital Pass & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* RFID Wristband Pass Card */}
        <div className="lg:col-span-2 relative bg-zinc-950 rounded-3xl p-6 sm:p-8 text-white shadow-none border-0 overflow-hidden flex flex-col justify-between group">
          <div className="relative z-10 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-800 rounded-2xl text-white border-0">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Entra Festival Wristband
                    </span>
                  </div>
                  <h3 className="text-white font-mono text-sm font-semibold mt-0.5">
                    {user?.full_name || 'Festival Attendee'}
                  </h3>
                </div>
              </div>

              <span className="text-xs py-1 px-3 bg-emerald-500/15 text-emerald-400 rounded-full font-semibold border-0">
                RFID AKTIF
              </span>
            </div>

            {/* Live Balance Counter */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider block font-medium">
                Saldo Aktif Gelang
              </span>
              {loading ? (
                <Skeleton className="h-12 w-48 bg-zinc-800" />
              ) : (
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {formatCurrency(balanceAmount)}
                </h2>
              )}
              <p className="text-xs text-zinc-400">
                Dapat digunakan di seluruh tenant F&B dan Official Merch festival.
              </p>
            </div>

            {/* Wristband UID and QR Code Stub */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-0">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-medium">
                  Wristband UID / Kode Kartu
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-zinc-200 tracking-wider">
                    {wristbandUid}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWristbandCode}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                    title="Salin Kode UID"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-900 px-3.5 py-2 rounded-2xl border-0 w-fit">
                <div className="bg-white p-1 rounded-xl">
                  <QRCodeSVG value={wallet?.id || 'entra-wristband'} size={38} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-zinc-400 uppercase block font-bold">NFC TAP-READY</span>
                  <span className="text-xs font-mono text-white font-bold">0.05s SPEED</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-col justify-between gap-4 bg-zinc-100 rounded-3xl p-6 sm:p-7 border-0 shadow-none">
          <div>
            <h3 className="text-lg font-bold text-zinc-950 mb-1">Aksi Cepat Gelang</h3>
            <p className="text-xs text-zinc-500">
              Isi ulang saldo instan, bayar di kasir, atau cairkan sisa saldo gelang Anda.
            </p>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={() => {
                setTopUpAmount(100000);
                setCustomTopUpInput('100000');
                setIsTopUpOpen(true);
              }}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2.5 text-xs shadow-none border-0"
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
              className="w-full bg-white hover:bg-zinc-200/80 text-zinc-800 font-semibold py-3.5 rounded-full flex items-center justify-center gap-2.5 text-xs border-0 shadow-none"
            >
              <Store className="h-4 w-4 text-emerald-600" />
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
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-3.5 rounded-full flex items-center justify-center gap-2.5 text-xs disabled:opacity-40 border-0 shadow-none"
            >
              <ArrowDownToLine className="h-4 w-4 text-rose-500" />
              Tarik Saldo Gelang (Refund)
            </Button>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border-0 text-xs text-zinc-600 flex items-start gap-2 shadow-none">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>Sisa saldo gelang dapat di-refund kapan saja setelah event festival berakhir.</span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-zinc-100 p-6 sm:p-8 space-y-6 rounded-3xl border-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Riwayat Transaksi Gelang</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Seluruh mutasi saldo top-up, belanja kasir, dan penarikan refund tercatat secara real-time.
            </p>
          </div>

          {/* Segmented Control Pill ala Mobbin (persis seperti kategori di /) */}
          <div
            ref={filterContainerRef}
            className="relative inline-flex items-center p-1 sm:p-1.5 bg-zinc-200/80 rounded-full gap-1 overflow-x-auto no-scrollbar max-w-full border-0"
          >
            {/* Sliding Capsule Highlight */}
            <div
              className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-white pointer-events-none ${
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

            {[
              { id: 'ALL', label: `Semua (${transactions.length})` },
              { id: 'TOPUP', label: 'Top-Up Saldo' },
              { id: 'PURCHASE', label: 'Belanja Tenant' },
              { id: 'REFUND', label: 'Refund' },
            ].map((tab) => {
              const isSelected = txFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    filterTabsRef.current[tab.id] = el;
                  }}
                  onClick={() => setTxFilter(tab.id as 'ALL' | 'TOPUP' | 'PURCHASE' | 'REFUND')}
                  className={`relative z-10 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${
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
        </div>

        {/* Transaction Items */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full bg-zinc-200/70 rounded-2xl" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 space-y-3">
            <CreditCard className="h-10 w-10 mx-auto text-zinc-300" />
            <p className="text-sm font-medium">Belum ada mutasi transaksi pada filter ini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type?.toUpperCase() === 'CREDIT' || tx.type?.toUpperCase() === 'TOPUP';
              const isRefund = getPgText(tx.description).toLowerCase().includes('refund');
              const amount = parseAmount(tx.amount);

              return (
                <div key={tx.id} className="p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-4 bg-white hover:bg-white/80 transition-colors border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl border-0 ${
                        isRefund
                          ? 'bg-rose-100 text-rose-600'
                          : isCredit
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-800'
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
                      <h4 className="text-sm font-bold text-zinc-950">
                        {tx.description || (isCredit ? 'Top-Up Saldo Gelang' : 'Pembayaran Tenant')}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {tx.created_at ? formatDate(tx.created_at) : 'Waktu transaksi'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isRefund ? 'text-rose-600' : isCredit ? 'text-emerald-700' : 'text-zinc-950'
                      }`}
                    >
                      {isCredit ? '+' : '-'} {formatCurrency(amount)}
                    </span>
                    <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                      {isRefund ? 'REFUND DIKIRIM' : isCredit ? 'BERHASIL' : 'DIBAYAR'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Top-Up Saldo Gelang */}
      {isTopUpOpen && (
        <Modal
          isOpen={isTopUpOpen}
          onClose={() => !topUpLoading && setIsTopUpOpen(false)}
          title="Top-Up Saldo Gelang Festival"
        >
          <form onSubmit={handleTopUpSubmit} className="space-y-5 text-zinc-900">
            <div className="p-4 bg-zinc-100 rounded-2xl text-xs text-zinc-600 space-y-1 border-0">
              <p className="text-zinc-950 font-semibold flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-zinc-800" />
                Isi Ulang Saldo Instan
              </p>
              <p>Saldo akan langsung masuk ke RFID wristband pass Anda dan siap ditap di merchant festival.</p>
            </div>

            {/* Quick Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                    className={`py-2 px-3 rounded-full text-xs font-bold border-0 transition-colors cursor-pointer ${
                      topUpAmount === amt
                        ? 'bg-zinc-950 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                className="w-full px-4 py-2.5 bg-zinc-100 border-0 rounded-full text-zinc-900 font-bold focus:outline-none focus:ring-0 text-sm shadow-none"
                placeholder="Minimal Rp 10.000"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={topUpLoading}
                onClick={() => setIsTopUpOpen(false)}
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs border-0 shadow-none cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={topUpLoading || topUpAmount < 10000}
                className="bg-zinc-950 hover:bg-zinc-800 text-white px-6 font-semibold rounded-full text-xs border-0 shadow-none cursor-pointer"
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
          <form onSubmit={handlePosPayment} className="space-y-5 text-zinc-900">
            <div className="p-4 bg-zinc-100 rounded-2xl text-xs text-zinc-600 space-y-1 border-0">
              <p className="text-zinc-950 font-semibold flex items-center gap-1.5">
                <Store className="h-4 w-4 text-emerald-600" />
                Simulasi Mesin POS Tenant Festival
              </p>
              <p>
                Simulasi pemindaian gelang NFC pengunjung di booth makanan/minuman/merchandise untuk memotong saldo secara instan.
              </p>
            </div>

            {/* Select Merchant */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Pilih Tenant / Merchant
              </label>
              <div className="space-y-2">
                {SAMPLE_MERCHANTS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMerchant(m)}
                    className={`p-3 rounded-2xl border-0 flex items-center justify-between cursor-pointer transition-colors ${
                      selectedMerchant.id === m.id
                        ? 'bg-zinc-200/90 text-zinc-950 font-bold'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl text-zinc-900 border-0">{m.icon}</div>
                      <div>
                        <p className="text-xs font-bold text-zinc-950">{m.name}</p>
                        <p className="text-[11px] text-zinc-500">{m.category}</p>
                      </div>
                    </div>
                    {selectedMerchant.id === m.id && (
                      <CheckCircle2 className="h-5 w-5 text-zinc-950" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Belanja Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                className="w-full px-4 py-2.5 bg-zinc-100 border-0 rounded-full text-zinc-900 font-bold focus:outline-none focus:ring-0 text-sm shadow-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={posLoading}
                onClick={() => setIsPosOpen(false)}
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs border-0 shadow-none cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={posLoading || posAmount <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-semibold flex items-center gap-1.5 rounded-full text-xs border-0 shadow-none cursor-pointer"
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
          <form onSubmit={handleRefundSubmit} className="space-y-4 text-zinc-900">
            <div className="p-4 bg-zinc-100 rounded-2xl text-xs text-zinc-600 space-y-1 border-0">
              <p className="text-zinc-950 font-semibold flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-rose-600" />
                Pencairan Saldo ke Rekening / E-Wallet
              </p>
              <p>
                Saldo gelang yang tidak terpakai akan ditransfer langsung ke rekening bank atau e-wallet Anda.
              </p>
            </div>

            {/* Quick Percentage Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex justify-between">
                <span>Nominal Refund (Rp)</span>
                <span className="text-zinc-950 font-bold">Saldo: {formatCurrency(balanceAmount)}</span>
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
                    className={`py-2 px-2.5 rounded-full text-xs font-bold border-0 transition-colors cursor-pointer ${
                      refundAmount === preset.val
                        ? 'bg-rose-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
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
                className="w-full px-4 py-2.5 bg-zinc-100 border-0 rounded-full text-zinc-900 font-bold focus:outline-none focus:ring-0 mt-2 text-sm shadow-none"
                placeholder="Nominal yang ditarik..."
                required
              />
            </div>

            {/* Bank Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Bank / E-Wallet Tujuan
              </label>
              <select
                value={refundBank}
                onChange={(e) => setRefundBank(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-100 border-0 rounded-full text-zinc-900 font-medium focus:outline-none focus:ring-0 cursor-pointer text-sm shadow-none"
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
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Nomor Rekening / No. HP E-Wallet
              </label>
              <input
                type="text"
                value={refundAccountNumber}
                onChange={(e) => setRefundAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-100 border-0 rounded-full text-zinc-900 font-medium focus:outline-none focus:ring-0 text-sm shadow-none"
                placeholder="Contoh: 1234567890"
                required
              />
            </div>

            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Nama Pemilik Rekening
              </label>
              <input
                type="text"
                value={refundAccountHolder}
                onChange={(e) => setRefundAccountHolder(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-100 border-0 rounded-full text-zinc-900 font-medium focus:outline-none focus:ring-0 text-sm shadow-none"
                placeholder="Nama sesuai buku tabungan"
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Alasan Refund
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-100 border-0 rounded-full text-zinc-900 font-medium focus:outline-none focus:ring-0 text-sm shadow-none"
                placeholder="Contoh: Selesai event festival"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={refundLoading}
                onClick={() => setIsRefundOpen(false)}
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs border-0 shadow-none cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={refundLoading || refundAmount <= 0 || refundAmount > balanceAmount}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 font-semibold flex items-center gap-1.5 rounded-full text-xs border-0 shadow-none cursor-pointer"
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
