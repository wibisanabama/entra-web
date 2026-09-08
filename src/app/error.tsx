'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring/reporting service
    console.error('Unhandled runtime error in application:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-zinc-100 rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Terjadi Kesalahan Sistem
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Mohon maaf, terjadi kendala saat memproses permintaan Anda. Silakan coba muat ulang halaman ini.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-zinc-400">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 px-6 rounded-full flex items-center justify-center gap-2 border-0 shadow-none"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-bold text-xs py-3 px-6 rounded-full flex items-center justify-center gap-2 border-0 shadow-none"
            >
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
