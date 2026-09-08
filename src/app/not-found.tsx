import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      <Navbar />

      <main className="flex-grow flex flex-col justify-center items-center px-6 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            <span>Error 404 &bull; Halaman Tidak Ditemukan</span>
          </div>

          {/* Heading */}
          <h1 className="max-w-2xl text-4xl sm:text-5xl lg:text-[60px] font-semibold leading-[1.1] tracking-[-0.035em] text-zinc-950">
            Halaman yang Anda cari tidak ada.
          </h1>

          {/* Description */}
          <p className="mt-5 max-w-[540px] text-base sm:text-lg text-zinc-500 font-normal leading-relaxed">
            Mungkin tautan yang Anda tuju sudah kadaluarsa, telah dipindahkan, atau alamat URL yang Anda masukkan salah.
          </p>

          {/* Action CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-7 text-[15px] font-semibold text-white hover:bg-zinc-800 transition-all shadow-xs active:scale-95 tracking-[-0.01em]"
            >
              Kembali ke beranda
            </Link>
            <Link
              href="/events"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-7 text-[15px] font-semibold text-zinc-950 hover:bg-zinc-50 transition-all shadow-xs active:scale-95 tracking-[-0.01em]"
            >
              Jelajahi event <ArrowRight className="h-4 w-4 stroke-[2]" />
            </Link>
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="mt-16 sm:mt-20 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <Link
            href="/events"
            className="group bg-zinc-100 hover:bg-zinc-200/70 transition-all active:scale-[0.99] rounded-3xl p-7 sm:p-8 flex flex-col justify-between text-left"
          >
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.18em]">01 &bull; Katalog</span>
              <h3 className="mt-4 text-lg sm:text-xl font-bold text-zinc-950 flex items-center justify-between">
                Jelajahi Event
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Temukan konser, festival musik, pameran, dan berbagai acara seru lainnya.
              </p>
            </div>
          </Link>

          <Link
            href="/my-tickets"
            className="group bg-zinc-100 hover:bg-zinc-200/70 transition-all active:scale-[0.99] rounded-3xl p-7 sm:p-8 flex flex-col justify-between text-left"
          >
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.18em]">02 &bull; Tiket</span>
              <h3 className="mt-4 text-lg sm:text-xl font-bold text-zinc-950 flex items-center justify-between">
                Tiket Saya
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Cek tiket aktif dan barcode digital Anda untuk kemudahan validasi di gate.
              </p>
            </div>
          </Link>

          <Link
            href="/register"
            className="group bg-zinc-100 hover:bg-zinc-200/70 transition-all active:scale-[0.99] rounded-3xl p-7 sm:p-8 flex flex-col justify-between text-left"
          >
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-[0.18em]">03 &bull; Organizer</span>
              <h3 className="mt-4 text-lg sm:text-xl font-bold text-zinc-950 flex items-center justify-between">
                Buat Event
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-950 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Daftarkan diri Anda sebagai organizer dan kelola penjualan tiket secara terintegrasi.
              </p>
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
