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
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { toast } from '@/lib/toast';

const PRESET_TOPUP_AMOUNTS = [25000, 50000, 100000, 200000, 500000];

export default function CashlessPortalPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<'ALL' | 'TOPUP' | 'PURCHASE'>('ALL');
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

  // Top-Up Checkout Payment Modal State (Alur Pembayaran Gateway)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingTopup, setPendingTopup] = useState<{
    topupId: string;
    amount: number;
    orderId: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bca_va' | 'mandiri_va'>('qris');
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [vaCopied, setVaCopied] = useState(false);

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
      const res = await cashlessApi.post<{
        topup?: { id: string; amount: any; status: string };
        token?: string;
        redirect_url?: string;
      }>('/api/v1/cashless/topup', {
        amount: topUpAmount,
      });

      const topupId = res.data?.topup?.id;
      const token = res.data?.token;

      if (!topupId) {
        throw new Error('Gagal memulai transaksi top-up.');
      }

      // Tunggu window.snap siap jika sedang dimuat di background
      if (typeof window !== 'undefined' && !window.snap && token && !token.startsWith('MOCK_')) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 150));
          if (window.snap) break;
        }
      }

      // Jika token resmi Midtrans Snap aktif, buka popup Snap
      if (token && !token.startsWith('MOCK_') && typeof window !== 'undefined' && window.snap) {
        setIsTopUpOpen(false);
        window.snap.pay(token, {
          onSuccess: async (result: any) => {
            try {
              if (result) {
                await cashlessApi.post('/api/v1/cashless/midtrans/webhook', result).catch(() => null);
              }
              await cashlessApi.post(`/api/v1/cashless/topup/${topupId}/confirm`);
            } catch (err) {
              console.error('Top-up confirmation sync error:', err);
            }
            toast.success(`Top-Up saldo gelang sebesar ${formatCurrency(topUpAmount)} berhasil!`);
            await fetchWalletAndTransactions();
          },
          onPending: async (result: any) => {
            try {
              if (result) {
                await cashlessApi.post('/api/v1/cashless/midtrans/webhook', result).catch(() => null);
              }
            } catch (err) {
              console.error('Top-up pending sync error:', err);
            }
            toast.info('Menunggu pembayaran Midtrans diselesaikan.');
            await fetchWalletAndTransactions();
          },
          onError: () => {
            toast.error('Pembayaran top-up dibatalkan atau gagal.');
          },
          onClose: async () => {
            await fetchWalletAndTransactions();
          },
        });
        return;
      }

      // Alur gerbang pembayaran interaktif (Checkout Gateway: QRIS / Virtual Account)
      setIsTopUpOpen(false);
      setPendingTopup({
        topupId,
        amount: topUpAmount,
        orderId: `TOPUP-${topupId.slice(0, 8).toUpperCase()}`,
      });
      setPaymentMethod('qris');
      setIsPaymentModalOpen(true);
    } catch (error: unknown) {
      console.error('Top-Up error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memproses top-up saldo.';
      toast.error(errMsg);
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingTopup) return;
    try {
      setPaymentVerifying(true);
      // Simulasi jeda verifikasi payment gateway
      await new Promise((r) => setTimeout(r, 900));

      await cashlessApi.post(`/api/v1/cashless/topup/${pendingTopup.topupId}/confirm`);
      toast.success(
        `Pembayaran ${formatCurrency(pendingTopup.amount)} berhasil diverifikasi! Saldo gelang telah bertambah.`
      );
      setIsPaymentModalOpen(false);
      setPendingTopup(null);
      await fetchWalletAndTransactions();
    } catch (error: unknown) {
      console.error('Payment confirm error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memverifikasi pembayaran.';
      toast.error(errMsg);
    } finally {
      setPaymentVerifying(false);
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
    const isRefund = tx.type?.toUpperCase() === 'REFUND' || tx.description?.toLowerCase().includes('refund');
    if (isRefund) return false;

    const isTopUp = tx.type?.toUpperCase() === 'TOPUP' || tx.type?.toUpperCase() === 'CREDIT';
    if (txFilter === 'TOPUP') return isTopUp;
    if (txFilter === 'PURCHASE') return !isTopUp;
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
          <Link href="/login?redirect=/cashless" className="block w-full">
            <Button className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-full py-3 border-0 shadow-none cursor-pointer">
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

              <div className="flex items-center gap-3 bg-zinc-800/80 px-3.5 py-2.5 rounded-2xl border-0 w-fit">
                <div className="bg-white p-1.5 rounded-xl">
                  <QRCodeSVG value={wallet?.id || 'entra-wristband'} size={36} />
                </div>
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                    Scan QR / Tap NFC
                  </span>
                  <span className="text-xs text-zinc-100 font-semibold block">
                    Siap Digunakan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="flex flex-col justify-between bg-zinc-100 rounded-3xl p-6 sm:p-7 border-0 shadow-none">
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-zinc-950 mb-1">Aksi Cepat Gelang</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Isi ulang saldo instan via Midtrans Snap untuk bertransaksi di seluruh tenant festival.
              </p>
            </div>

            {/* Quick Top-Up Shortcut Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Pilihan Top-Up Cepat
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '+ Rp 25.000', val: 25000 },
                  { label: '+ Rp 50.000', val: 50000 },
                  { label: '+ Rp 100.000', val: 100000 },
                  { label: '+ Rp 200.000', val: 200000 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      setTopUpAmount(item.val);
                      setCustomTopUpInput(item.val.toString());
                      setIsTopUpOpen(true);
                    }}
                    className="py-3 px-3 bg-white hover:bg-zinc-200/80 text-zinc-900 rounded-2xl text-xs font-bold transition-all text-center border-0 shadow-none cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => {
                setTopUpAmount(100000);
                setCustomTopUpInput('100000');
                setIsTopUpOpen(true);
              }}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2.5 text-xs shadow-none border-0 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              Top-Up Saldo Gelang
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-zinc-100 p-6 sm:p-8 space-y-6 rounded-3xl border-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">Riwayat Transaksi Gelang</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Seluruh mutasi transaksi saldo top-up dan belanja di tenant festival tercatat secara real-time.
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
            ].map((tab) => {
              const isSelected = txFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    filterTabsRef.current[tab.id] = el;
                  }}
                  onClick={() => setTxFilter(tab.id as 'ALL' | 'TOPUP' | 'PURCHASE')}
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
              const amount = parseAmount(tx.amount);

              return (
                <div key={tx.id} className="p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-4 bg-white hover:bg-white/80 transition-colors border-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-2xl border-0 ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-950">
                        {tx.description || (isCredit ? 'Top-Up Saldo Gelang' : 'Pembayaran Tenant')}
                      </h4>
                      <p className="text-xs text-zinc-500 line-clamp-1">
                        {isCredit ? 'Top-Up Saldo RFID via Midtrans' : 'Transaksi di Tenant Festival'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {tx.created_at ? formatDate(tx.created_at) : 'Waktu transaksi'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isCredit ? 'text-emerald-700' : 'text-zinc-950'
                      }`}
                    >
                      {isCredit ? '+' : '-'} {formatCurrency(amount)}
                    </span>
                    <div className="mt-1 flex justify-end">
                      {isCredit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3" />
                          BERHASIL
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 uppercase tracking-wider">
                          DIBAYAR
                        </span>
                      )}
                    </div>
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

      {/* MODAL 2: Gerbang Pembayaran Top-Up (Payment Gateway Checkout) */}
      {isPaymentModalOpen && pendingTopup && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => !paymentVerifying && setIsPaymentModalOpen(false)}
          title="Selesaikan Pembayaran Top-Up"
        >
          <div className="space-y-5 text-zinc-900">
            {/* Tagihan Summary Card */}
            <div className="p-4 bg-zinc-100 rounded-2xl flex items-center justify-between border-0">
              <div>
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  Total Tagihan Top-Up
                </span>
                <p className="text-2xl font-black text-zinc-950 mt-0.5">
                  {formatCurrency(pendingTopup.amount)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Ref: <span className="font-mono font-semibold">{pendingTopup.orderId}</span>
                </p>
              </div>
              <div className="p-3 bg-white rounded-2xl border-0 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            {/* Pilihan Metode Pembayaran */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'qris', label: 'QRIS', icon: <QrCode className="h-4 w-4" /> },
                  { id: 'bca_va', label: 'BCA VA', icon: <Building2 className="h-4 w-4" /> },
                  { id: 'mandiri_va', label: 'Mandiri VA', icon: <Building2 className="h-4 w-4" /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as 'qris' | 'bca_va' | 'mandiri_va')}
                    className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold border-0 transition-colors cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-zinc-950 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Konten Metode Pembayaran: QRIS */}
            {paymentMethod === 'qris' && (
              <div className="p-5 bg-zinc-100 rounded-2xl flex flex-col items-center text-center space-y-3 border-0">
                <div className="bg-white p-3 rounded-2xl border-0 shadow-none">
                  <QRCodeSVG
                    value={`https://sandbox.entra.local/qris/${pendingTopup.topupId}`}
                    size={160}
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-950">Pindai QRIS untuk Bayar</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Buka BCA Mobile, GoPay, OVO, DANA, atau ShopeePay dan scan kode di atas.
                  </p>
                </div>
              </div>
            )}

            {/* Konten Metode Pembayaran: BCA VA */}
            {paymentMethod === 'bca_va' && (
              <div className="p-4 bg-zinc-100 rounded-2xl space-y-3 border-0">
                <div>
                  <span className="text-[11px] text-zinc-500 block font-medium">Nomor BCA Virtual Account</span>
                  <div className="flex items-center justify-between mt-1 p-3 bg-white rounded-xl border-0">
                    <span className="font-mono text-base font-bold text-zinc-950 tracking-wider">
                      88012 8592 1286
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('8801285921286');
                        setVaCopied(true);
                        toast.success('Nomor Virtual Account disalin ke clipboard');
                        setTimeout(() => setVaCopied(false), 2000);
                      }}
                      className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                    >
                      {vaCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {vaCopied ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 space-y-0.5">
                  <p>1. Buka m-BCA &gt; m-Transfer &gt; BCA Virtual Account</p>
                  <p>2. Masukkan nomor VA di atas lalu selesaikan tagihan {formatCurrency(pendingTopup.amount)}</p>
                </div>
              </div>
            )}

            {/* Konten Metode Pembayaran: Mandiri VA */}
            {paymentMethod === 'mandiri_va' && (
              <div className="p-4 bg-zinc-100 rounded-2xl space-y-3 border-0">
                <div>
                  <span className="text-[11px] text-zinc-500 block font-medium">Nomor Mandiri Virtual Account</span>
                  <div className="flex items-center justify-between mt-1 p-3 bg-white rounded-xl border-0">
                    <span className="font-mono text-base font-bold text-zinc-950 tracking-wider">
                      70012 9014 3321
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('7001290143321');
                        setVaCopied(true);
                        toast.success('Nomor Virtual Account disalin ke clipboard');
                        setTimeout(() => setVaCopied(false), 2000);
                      }}
                      className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 cursor-pointer"
                    >
                      {vaCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {vaCopied ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 space-y-0.5">
                  <p>1. Buka Livin by Mandiri &gt; Bayar &gt; Virtual Account</p>
                  <p>2. Masukkan nomor VA di atas lalu selesaikan tagihan {formatCurrency(pendingTopup.amount)}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={paymentVerifying}
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs border-0 shadow-none cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={paymentVerifying}
                onClick={handleConfirmPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 font-semibold rounded-full text-xs border-0 shadow-none cursor-pointer flex items-center gap-2"
              >
                {paymentVerifying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Memverifikasi Pembayaran...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saya Sudah Membayar
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
