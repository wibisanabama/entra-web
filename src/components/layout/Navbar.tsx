'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur bg-gray-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-violet-500">
              Entra
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Beranda
              </Link>
              <Link href="/events" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Event
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                    className="flex items-center focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.full_name?.charAt(0) || 'U'}
                    </div>
                  </button>
                  {isAvatarDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700">
                          Dashboard
                        </Link>
                        <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                          Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Masuk</Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary">Daftar</Button>
                  </Link>
                </>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
              >
                <span className="sr-only">Buka menu utama</span>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 ">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Beranda</Link>
            <Link href="/events" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Event</Link>
            {!user && (
              <>
                <Link href="/login" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Masuk</Link>
                <Link href="/register" className="block text-violet-400 hover:text-violet-300 px-3 py-2 rounded-md text-base font-medium">Daftar</Link>
              </>
            )}
            {user && (
              <>
                <Link href="/dashboard" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                <button onClick={logout} className="block w-full text-left text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-base font-medium">Keluar</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
