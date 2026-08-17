'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAvatarDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur bg-gray-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-violet-500">
              Entra
            </Link>

          </div>
          <div className="flex items-center gap-6">
            <Link href="/events" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Jelajahi Event
            </Link>
            {user && (
              <>
                <Link href="/my-tickets" className="text-sm font-medium text-gray-300 hover:text-violet-400 transition-colors">
                  Tiket Saya
                </Link>
                <Link href="/cashless" className="text-sm font-medium text-gray-300 hover:text-violet-400 transition-colors">
                  Gelang Cashless
                </Link>
              </>
            )}

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                    className="flex items-center focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-violet-600 overflow-hidden flex items-center justify-center text-white font-bold text-sm border border-violet-500/40">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.full_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                  </button>
                  {isAvatarDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl bg-gray-900 border border-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
                      <div className="flex flex-col py-1">
                        <Link href="/my-tickets" onClick={() => setIsAvatarDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 hover:text-violet-400 transition-colors">
                          Tiket Saya
                        </Link>
                        <Link href="/cashless" onClick={() => setIsAvatarDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 hover:text-violet-400 transition-colors">
                          Gelang Cashless
                        </Link>
                        {user.role === 'user' ? (
                          <Link href="/profile" onClick={() => setIsAvatarDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors">
                            Profil
                          </Link>
                        ) : (
                          <Link href="/dashboard" onClick={() => setIsAvatarDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 transition-colors">
                            Dashboard Organizer
                          </Link>
                        )}
                        <div className="border-t border-gray-800 my-1"></div>
                        <button onClick={() => { setIsAvatarDropdownOpen(false); logout(); }} className="block w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 transition-colors">
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
        <div className="md:hidden bg-gray-900 border-b border-gray-800">
          <div className="px-3 pt-2 pb-4 space-y-1 sm:px-3">
            <Link href="/events" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Jelajahi Event</Link>

            {!user && (
              <>
                <Link href="/login" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Masuk</Link>
                <Link href="/register" className="block text-violet-400 hover:text-violet-300 px-3 py-2 rounded-md text-base font-medium">Daftar</Link>
              </>
            )}
            {user && (
              <>
                <Link href="/my-tickets" className="block text-violet-400 hover:text-violet-300 px-3 py-2 rounded-md text-base font-medium">Tiket Saya</Link>
                <Link href="/cashless" className="block text-violet-400 hover:text-violet-300 px-3 py-2 rounded-md text-base font-medium">Gelang Cashless</Link>
                {user.role === 'user' ? (
                  <Link href="/profile" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Profil</Link>
                ) : (
                  <Link href="/dashboard" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Dashboard Organizer</Link>
                )}
                <button onClick={logout} className="block w-full text-left text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-base font-medium">Keluar</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
