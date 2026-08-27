import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-violet-950/30">
          <Compass className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-950/50 border border-violet-500/30 px-3 py-1 rounded-full inline-block">
            404 NOT FOUND
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight pt-1">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan tidak valid.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Ke Beranda
            </Button>
          </Link>

          <Link href="/events" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full text-gray-300 hover:text-white border-gray-800 text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Jelajahi Event
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
