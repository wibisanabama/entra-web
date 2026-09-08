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
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-7 text-[15px] font-semibold text-white hover:bg-zinc-800 transition-all shadow-xs tracking-[-0.01em]"
            >
              Kembali ke beranda
            </Link>
            <Link
              href="/events"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-100 px-7 text-[15px] font-semibold text-zinc-950 hover:bg-zinc-200 transition-all border-0 shadow-none tracking-[-0.01em]"
            >
              Jelajahi event <ArrowRight className="h-4 w-4 stroke-[2]" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
