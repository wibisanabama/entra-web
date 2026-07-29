'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    } else if (!loading && user?.role !== 'organizer' && user?.role !== 'admin') {
      router.push('/');
    }
  }, [isAuthenticated, loading, user, router]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar - fixed on desktop */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-950 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
