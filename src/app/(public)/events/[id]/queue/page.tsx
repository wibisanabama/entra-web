'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ticketApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { QueueStatusResponse } from '@/types';

export default function EventQueuePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const eventId = String(params.id || '');

  const [queueData, setQueueData] = useState<QueueStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [isOpeningPayment, setIsOpeningPayment] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const hasAutoOpenedSnap = useRef(false);
  const isNavigatingAway = useRef(false);

  // Pastikan posisi scroll website selalu berada di paling awal/atas saat masuk ke antrian
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scrollToTop();
    const frameId = requestAnimationFrame(scrollToTop);
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(t1);
      clearTimeout(t2);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [loading]);

  // Redirect silently back to event detail without any toast/banner
  const redirectSilentlyToEvent = useCallback(() => {
    if (isNavigatingAway.current) return;
    isNavigatingAway.current = true;
    router.push(`/events/${eventId}`);
  }, [eventId, router]);

  // Handle open Snap Payment Modal
  const handleOpenPayment = useCallback(async () => {
    if (!orderId || isOpeningPayment || isNavigatingAway.current) return;
    try {
      setIsOpeningPayment(true);
      const res = await ticketApi.post<{ token?: string; midtrans_order_id?: string } | string>(
        `/api/v1/tickets/orders/${orderId}/pay`
      );

      const token = typeof res.data === 'string' ? res.data : res.data?.token;
      const midtransOrderId = typeof res.data === 'object' ? res.data?.midtrans_order_id : undefined;

      if (!token) {
        throw new Error('Token pembayaran tidak ditemukan.');
      }

      // Wait for window.snap if it is still loading
      if (typeof window !== 'undefined' && !window.snap) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 150));
          if (window.snap) break;
        }
      }

      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(token, {
          onSuccess: async (result: any) => {
            isNavigatingAway.current = true;
            try {
              const payload = {
                ...(result || {}),
                order_id: result?.order_id || midtransOrderId || orderId,
                transaction_status: result?.transaction_status || 'settlement',
              };
              await ticketApi.post('/api/v1/tickets/midtrans/webhook', payload);
            } catch (err) {
              console.error('Payment webhook sync error:', err);
            }
            router.push('/my-tickets');
          },
          onPending: async (result: any) => {
            isNavigatingAway.current = true;
            try {
              const payload = {
                ...(result || {}),
                order_id: result?.order_id || midtransOrderId || orderId,
                transaction_status: result?.transaction_status || 'pending',
              };
              await ticketApi.post('/api/v1/tickets/midtrans/webhook', payload);
            } catch (err) {
              console.error('Payment pending sync error:', err);
            }
            router.push('/my-tickets');
          },
          onError: () => {
            isNavigatingAway.current = true;
            router.push('/my-tickets');
          },
          onClose: async () => {
            try {
              if (midtransOrderId) {
                await ticketApi.post('/api/v1/tickets/midtrans/webhook', { order_id: midtransOrderId });
              }
            } catch {
              // ignore
            }
            // User closed snap modal manually. They stay on this page to either re-open or cancel.
          },
        });
      }
    } catch (err) {
      console.error('Failed to open payment gateway:', err);
    } finally {
      setIsOpeningPayment(false);
    }
  }, [orderId, isOpeningPayment, router]);

  // Cancel order in queue
  const handleConfirmCancel = async () => {
    if (!orderId || cancelLoading) return;
    try {
      setCancelLoading(true);
      await ticketApi.post(`/api/v1/tickets/orders/${orderId}/cancel`);
    } catch (err) {
      console.error('Failed to cancel order in queue:', err);
    } finally {
      setCancelLoading(false);
      setShowCancelModal(false);
      redirectSilentlyToEvent();
    }
  };

  // Main polling effect
  useEffect(() => {
    if (!orderId) {
      redirectSilentlyToEvent();
      return;
    }

    let isMounted = true;

    const fetchQueueStatus = async () => {
      if (isNavigatingAway.current) return;
      try {
        const res = await ticketApi.get<QueueStatusResponse>(`/api/v1/tickets/orders/${orderId}/queue`);
        if (!isMounted) return;

        if (res.data) {
          const data = res.data;
          setQueueData(data);
          setLoading(false);

          if (data.status === 'COMPLETED') {
            isNavigatingAway.current = true;
            router.push('/my-tickets');
            return;
          }

          if (data.status === 'CANCELLED' || data.status === 'EXPIRED') {
            redirectSilentlyToEvent();
            return;
          }

          if (data.status === 'ACTIVE') {
            if (data.seconds_remaining !== undefined) {
              setSecondsRemaining(data.seconds_remaining);
            }

            // Auto-trigger snap popup on first reaching ACTIVE state
            if (!hasAutoOpenedSnap.current) {
              hasAutoOpenedSnap.current = true;
              setTimeout(() => {
                handleOpenPayment();
              }, 300);
            }
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg = String(err?.message || '').toLowerCase();
        // If order was cancelled, expired, or access denied -> redirect silently
        if (msg.includes('not found') || msg.includes('access denied') || msg.includes('cancelled') || msg.includes('404')) {
          redirectSilentlyToEvent();
        }
      }
    };

    // Initial fetch
    fetchQueueStatus();

    // Poll every 1500ms
    const interval = setInterval(fetchQueueStatus, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, redirectSilentlyToEvent, handleOpenPayment, router]);

  // Local 1-second countdown interval when ACTIVE
  useEffect(() => {
    if (queueData?.status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          redirectSilentlyToEvent();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [queueData?.status, redirectSilentlyToEvent]);

  // Format seconds into MM:SS
  const formatTimeMinutes = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const timerProgress = Math.max(0, Math.min(100, (secondsRemaining / 180) * 100));

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 border-3 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
        <p className="text-zinc-600 font-medium text-sm">Menghubungkan ke ruang antrian tiket...</p>
      </div>
    );
  }

  if (queueData?.status === 'SOLD_OUT') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center bg-white border border-zinc-200 rounded-2xl shadow-none">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Tiket Telah Habis Terjual</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Mohon maaf, tiket untuk acara ini telah habis dibeli oleh antrian sebelum Anda.
          </p>
          <Button
            onClick={redirectSilentlyToEvent}
            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-full py-3 text-sm font-semibold shadow-none active:shadow-none focus:shadow-none"
          >
            Kembali ke Halaman Event
          </Button>
        </Card>
      </div>
    );
  }

  const isActive = queueData?.status === 'ACTIVE';

  return (
    <div className="min-h-[80vh] bg-zinc-50/60 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Main Status Card */}
        <Card className="p-6 sm:p-8 bg-white border border-zinc-200/80 rounded-3xl shadow-none">
          <div className="text-center space-y-6">
            {/* Top Badge */}
            <div className="flex justify-center">
              {isActive ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 px-3.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Giliran Anda Tiba
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200/60 px-3.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-none">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Dalam Antrian Pembelian
                </Badge>
              )}
            </div>

            {/* Position Display */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
                Nomor Antrian Anda
              </p>
              <h1 className="text-6xl sm:text-7xl font-bold tracking-tight text-zinc-950">
                #{queueData?.position ?? 1}
              </h1>
            </div>

            {/* State-specific Body */}
            {isActive ? (
              <div className="space-y-5 pt-2">
                {/* 3-Minute Countdown */}
                <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Batas Waktu Pembayaran
                    </span>
                    <span className="text-xs font-semibold text-zinc-500">Maks. 3 Menit</span>
                  </div>

                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-zinc-950 font-mono">
                      {formatTimeMinutes(secondsRemaining)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                        secondsRemaining <= 30 ? 'bg-rose-500' : secondsRemaining <= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${timerProgress}%` }}
                    />
                  </div>

                  <p className="text-xs text-zinc-500 leading-relaxed text-center">
                    Harap segera selesaikan pembayaran sebelum waktu habis. Jika dibatalkan atau waktu habis, tiket akan dilepas kembali.
                  </p>
                </div>

                {/* Primary Active Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleOpenPayment}
                    disabled={isOpeningPayment}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-full py-3.5 text-sm font-semibold transition-all shadow-none active:shadow-none focus:shadow-none"
                  >
                    {isOpeningPayment ? 'Menghubungkan Gateway...' : 'Buka Pembayaran'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelLoading}
                    className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-full py-3 text-sm font-semibold transition-all shadow-none active:shadow-none focus:shadow-none"
                  >
                    Batalkan Pembayaran
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-5 space-y-2 text-center">
                  <p className="text-base font-semibold text-amber-950">
                    Ada {queueData?.people_ahead ?? 0} orang di depan Anda
                  </p>
                  <p className="text-xs text-amber-800/80 leading-relaxed">
                    Sistem antrian entra membatasi 1 orang aktif membayar sekaligus (maksimal 3 menit). Antrian Anda akan otomatis maju begitu antrian sebelumnya selesai atau dibatalkan.
                  </p>
                </div>

                {/* Waiting indicator */}
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>

                {/* Cancel queue button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                    disabled={cancelLoading}
                    className="w-full border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 rounded-full py-3 text-sm font-semibold transition-all shadow-none active:shadow-none focus:shadow-none"
                  >
                    Batalkan Antrian
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Order Summary Card */}
        {queueData && (
          <Card className="p-5 sm:p-6 bg-white border border-zinc-200/80 rounded-3xl space-y-4 shadow-none">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ringkasan Pesanan Tiket
            </h3>

            <div className="space-y-3 text-sm">
              {queueData.ticket_type_name && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Kategori Tiket</span>
                  <span className="font-semibold text-zinc-900">{queueData.ticket_type_name}</span>
                </div>
              )}

              {queueData.quantity && queueData.quantity > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Jumlah Tiket</span>
                  <span className="font-semibold text-zinc-900">{queueData.quantity} tiket</span>
                </div>
              )}

              {queueData.total_amount !== undefined && (
                <div className="flex justify-between items-center pt-1">
                  <span className="text-zinc-500 font-medium">Total Pembayaran</span>
                  <span className="text-base font-bold text-zinc-950">
                    {formatCurrency(queueData.total_amount)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={isActive ? 'Batalkan Pembayaran?' : 'Batalkan Antrian?'}
      >
        <div className="text-center py-3 space-y-4">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-50 text-rose-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-zinc-800 font-semibold text-base">
              {isActive ? 'Lepaskan giliran pembayaran tiket Anda?' : 'Keluar dari antrian pemesanan tiket?'}
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-sm mx-auto">
              {isActive
                ? 'Pesanan tiket Anda akan dibatalkan, kuota tiket dilepas kembali, dan antrian di belakang Anda akan langsung maju.'
                : 'Anda akan keluar dari antrian dan posisi Anda akan diberikan kepada antrian berikutnya.'}
            </p>
          </div>

          <div className="space-y-2 pt-3">
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-full py-3 text-sm font-semibold shadow-none active:shadow-none focus:shadow-none"
              onClick={handleConfirmCancel}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
            </Button>
            <Button
              variant="outline"
              className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-full py-3 text-sm font-medium shadow-none active:shadow-none focus:shadow-none"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelLoading}
            >
              Kembali
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
