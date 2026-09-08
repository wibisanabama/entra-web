'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export function PublicLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((path) => pathname === path || pathname?.startsWith(path + '/'));

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white text-zinc-900 px-4 py-8 sm:py-12">
        <main className="w-full flex items-center justify-center">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
