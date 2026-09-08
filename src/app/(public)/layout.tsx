'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEventsCatalog = pathname === '/events';

  return (
    <div className={`min-h-screen flex flex-col ${isEventsCatalog ? 'bg-zinc-100' : 'bg-white'} text-zinc-900 transition-colors`}>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
