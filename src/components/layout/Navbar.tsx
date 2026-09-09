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
    <header className="sticky top-0 z-50 w-full pt-4 sm:pt-6 pb-2 px-4 flex justify-center pointer-events-none print:hidden">
      <div className="pointer-events-auto w-full max-w-[620px] h-13 sm:h-14 bg-[#f3f3f3]/95 backdrop-blur-md rounded-full pl-6 sm:pl-7 pr-2 sm:pr-2.5 flex items-center justify-between transition-all font-saans tracking-[-0.01em]">
        
        {/* Left: Black Entra Logo */}
        <Link 
          href="/" 
          className="flex items-center select-none"
          aria-label="Entra Home"
        >
          <img 
            src="/assets/black-logo.png" 
            alt="Entra" 
            className="h-7 sm:h-8 w-auto object-contain" 
          />
        </Link>

        {/* Right: Navigation items */}
        {user ? (
          <div className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/events" 
              className={`text-xs sm:text-sm font-medium transition-colors ${
                pathname.startsWith('/events') 
                  ? 'text-zinc-950' 
                  : 'text-zinc-800 hover:text-zinc-950'
              }`}
            >
              Event
            </Link>

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-zinc-950/10 focus:outline-none transition-all cursor-pointer"
                aria-label="Menu Pengguna"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-950 text-white font-semibold text-xs flex items-center justify-center overflow-hidden">
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
                <div className="absolute right-0 mt-3 w-56 rounded-2xl shadow-xl bg-white border-0 py-1.5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-zinc-100">
                    <p className="text-xs font-medium text-zinc-500">Masuk sebagai</p>
                    <p className="text-sm font-semibold text-zinc-950 truncate">{user.full_name || user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 border-0">
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
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link 
              href="/events" 
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith('/events') 
                  ? 'text-zinc-950' 
                  : 'text-zinc-800 hover:text-zinc-950'
              }`}
            >
              Event
            </Link>
            <Link 
              href="/login" 
              className={`text-sm font-medium transition-colors ${
                pathname === '/login' 
                  ? 'text-zinc-950' 
                  : 'text-zinc-800 hover:text-zinc-950'
              }`}
            >
              Masuk
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center h-9 sm:h-9.5 px-5 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-none"
            >
              Daftar
            </Link>
          </nav>
        )}

      </div>
    </header>
  );
}
