'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Ticket, Wallet, LayoutDashboard, User, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
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
    <header className="sticky top-0 z-50 w-full pt-3 sm:pt-5 pb-2 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[480px] h-11 sm:h-12 bg-[#f3f3f3]/95 backdrop-blur-md rounded-full pl-5 sm:pl-6 pr-1.5 sm:pr-2 flex items-center justify-between transition-all">
        
        {/* Left: Black Entra Logo */}
        <Link 
          href="/" 
          className="flex items-center select-none group"
          aria-label="Entra Home"
        >
          <img 
            src="/assets/black-logo.png" 
            alt="Entra" 
            className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </Link>

        {/* Right: Navigation items */}
        {user ? (
          <div className="flex items-center gap-4 sm:gap-7">
            <Link 
              href="/events" 
              className={`text-xs sm:text-sm transition-colors ${
                pathname.startsWith('/events') 
                  ? 'text-zinc-950 font-semibold' 
                  : 'text-zinc-800 hover:text-zinc-950 font-medium'
              }`}
            >
              Event
            </Link>
            <Link 
              href="/my-tickets" 
              className={`hidden sm:inline-block text-xs sm:text-sm transition-colors ${
                pathname.startsWith('/my-tickets') 
                  ? 'text-zinc-950 font-semibold' 
                  : 'text-zinc-800 hover:text-zinc-950 font-medium'
              }`}
            >
              Tiket Saya
            </Link>
            <Link 
              href="/cashless" 
              className={`hidden md:inline-block text-xs sm:text-sm transition-colors ${
                pathname.startsWith('/cashless') 
                  ? 'text-zinc-950 font-semibold' 
                  : 'text-zinc-800 hover:text-zinc-950 font-medium'
              }`}
            >
              Gelang Cashless
            </Link>

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-zinc-950/10 focus:outline-none transition-all cursor-pointer"
                aria-label="Menu Pengguna"
              >
                <div className="h-7 w-7 rounded-full bg-zinc-950 text-white font-semibold text-xs flex items-center justify-center overflow-hidden">
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
                <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl bg-white border border-zinc-200 py-1.5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-zinc-100">
                    <p className="text-xs font-medium text-zinc-500">Masuk sebagai</p>
                    <p className="text-sm font-semibold text-zinc-950 truncate">{user.full_name || user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {user.role}
                    </span>
                  </div>
                  
                  <div className="py-1">
                    <Link 
                      href="/my-tickets" 
                      onClick={() => setIsAvatarDropdownOpen(false)} 
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                    >
                      <Ticket className="w-4 h-4 text-zinc-400" />
                      Tiket Saya
                    </Link>
                    <Link 
                      href="/cashless" 
                      onClick={() => setIsAvatarDropdownOpen(false)} 
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-zinc-400" />
                      Gelang Cashless
                    </Link>
                    {user.role !== 'user' && (
                      <Link 
                        href="/dashboard" 
                        onClick={() => setIsAvatarDropdownOpen(false)} 
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                        Dashboard Organizer
                      </Link>
                    )}
                    <Link 
                      href="/profile" 
                      onClick={() => setIsAvatarDropdownOpen(false)} 
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                    >
                      <User className="w-4 h-4 text-zinc-400" />
                      Profil & Akun
                    </Link>
                  </div>

                  <div className="border-t border-zinc-100 pt-1">
                    <button 
                      onClick={() => { setIsAvatarDropdownOpen(false); logout(); }} 
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
        ) : (
          <nav className="flex items-center gap-3.5 sm:gap-4">
            <Link 
              href="/events" 
              className={`text-xs sm:text-sm transition-colors ${
                pathname.startsWith('/events') 
                  ? 'text-zinc-950 font-semibold' 
                  : 'text-zinc-800 hover:text-zinc-950 font-medium'
              }`}
            >
              Event
            </Link>
            <Link 
              href="/login" 
              className={`text-xs sm:text-sm transition-colors ${
                pathname === '/login' 
                  ? 'text-zinc-950 font-semibold' 
                  : 'text-zinc-800 hover:text-zinc-950 font-medium'
              }`}
            >
              Masuk
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-[13px] font-semibold transition-all shadow-xs active:scale-95"
            >
              Daftar
            </Link>
          </nav>
        )}

      </div>
    </header>
  );
}
