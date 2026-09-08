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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-zinc-900">
        <main className="w-full flex-grow flex items-center justify-center py-8 sm:py-12">{children}</main>
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
