'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Menu, X, Search, Ticket, Wallet, LayoutDashboard, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/events?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/events');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <BrandLogo markClassName="h-8 w-8 transition-transform group-hover:scale-105" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-zinc-600">
              <Link 
                href="/events" 
                className="px-3 py-1.5 rounded-full hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
              >
                Jelajahi Event
              </Link>
              {user && (
                <>
                  <Link 
                    href="/my-tickets" 
                    className="px-3 py-1.5 rounded-full hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                  >
                    Tiket Saya
                  </Link>
                  <Link 
                    href="/cashless" 
                    className="px-3 py-1.5 rounded-full hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                  >
                    Gelang Cashless
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Center Search Pill Bar */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex items-center flex-1 max-w-md mx-4"
          >
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari event, konser, festival, kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-12 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 focus:bg-white transition-all shadow-xs"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-white rounded border border-zinc-200 text-zinc-400 shadow-2xs">
                  ↵
                </kbd>
              </div>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 transition-all cursor-pointer bg-white"
                  aria-label="User menu"
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
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-white border border-zinc-200 py-1.5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Masuk</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Daftar</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 focus:outline-none transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-zinc-200 animate-in slide-in-from-top-1 duration-150">
          <div className="px-4 pt-3 pb-5 space-y-2">
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                />
              </div>
            </form>

            <Link 
              href="/events" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            >
              Jelajahi Event
            </Link>

            {user ? (
              <>
                <Link 
                  href="/my-tickets" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Tiket Saya
                </Link>
                <Link 
                  href="/cashless" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Gelang Cashless
                </Link>
                {user.role !== 'user' && (
                  <Link 
                    href="/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    Dashboard Organizer
                  </Link>
                )}
                <Link 
                  href="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                >
                  Profil
                </Link>
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }} 
                  className="block w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Keluar
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Masuk</Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">Daftar Akun Baru</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
