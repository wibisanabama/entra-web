'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: loading } = useAuth();
  const isAuthenticated = !!user;
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (!loading && user?.role !== 'organizer' && user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router, pathname]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-zinc-500 flex items-center justify-center text-sm font-medium">
        Memuat dashboard...
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-white text-zinc-950 flex">
      {/* Sidebar - fixed on desktop */}
      <div className="hidden md:block w-64 flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Main Content area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
