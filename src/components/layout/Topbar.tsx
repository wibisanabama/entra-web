'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export function Topbar() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-zinc-200 h-16 flex items-center justify-between px-6 z-10 w-full">
      <div className="flex items-center flex-1">
        {/* Workspace status / breadcrumb placeholder */}
        <span className="text-xs font-medium text-zinc-400">Panel Manajemen Organizer</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all cursor-pointer select-none"
          >
            <div className="h-7 w-7 rounded-full bg-zinc-950 flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Organizer'}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <span className="text-xs font-bold text-zinc-900 hidden sm:block">
              {user?.full_name || 'Organizer'}
            </span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl bg-white border border-zinc-200 p-1.5 z-50">
              <div className="flex flex-col">
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Halaman Utama
                </Link>
                <div className="my-1 border-t border-zinc-100"></div>
                <button
                  onClick={logout}
                  className="block w-full text-left px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
