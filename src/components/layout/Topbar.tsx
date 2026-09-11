'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { User, LogOut, Home, Ticket, Wallet } from 'lucide-react';

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
          
          {isDropdownOpen && user && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl bg-white border-0 py-1.5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-zinc-100">
                <p className="text-xs font-medium text-zinc-500">Masuk sebagai</p>
                <p className="text-sm font-semibold text-zinc-950 truncate">{user.full_name || user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 border-0">
                  {user.role === 'admin' ? 'Admin' : user.role === 'organizer' ? 'Organizer' : 'Pengguna'}
                </span>
              </div>
              
              <div className="py-1">
                <Link 
                  href="/" 
                  onClick={() => setIsDropdownOpen(false)} 
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                >
                  <Home className="w-4 h-4 text-zinc-400" />
                  Halaman Utama
                </Link>
                <Link 
                  href="/profile" 
                  onClick={() => setIsDropdownOpen(false)} 
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                >
                  <User className="w-4 h-4 text-zinc-400" />
                  Profil & Akun
                </Link>
                <Link 
                  href="/my-tickets" 
                  onClick={() => setIsDropdownOpen(false)} 
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                >
                  <Ticket className="w-4 h-4 text-zinc-400" />
                  Tiket Saya
                </Link>
                <Link 
                  href="/cashless" 
                  onClick={() => setIsDropdownOpen(false)} 
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-zinc-400" />
                  Gelang Cashless
                </Link>
              </div>

              <div className="border-t border-zinc-100 pt-1">
                <button 
                  onClick={() => { setIsDropdownOpen(false); logout(); }} 
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
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
