'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { BarChart3, Calendar, ShoppingCart, Folder, Wallet, ShieldCheck, MapPin, ArrowUpRight } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { name: 'Event', path: '/dashboard/events', icon: <Calendar className="h-4 w-4" /> },
    { name: 'Venue & Lokasi', path: '/dashboard/venues', icon: <MapPin className="h-4 w-4" /> },
    { name: 'Pesanan', path: '/dashboard/orders', icon: <ShoppingCart className="h-4 w-4" /> },
    { name: 'Keuangan & Saldo', path: '/dashboard/withdrawals', icon: <Wallet className="h-4 w-4" /> },
    { name: 'Pencairan Admin', path: '/dashboard/admin/withdrawals', icon: <ShieldCheck className="h-4 w-4" />, adminOnly: true },
    { name: 'Media', path: '/dashboard/media', icon: <Folder className="h-4 w-4" /> },
  ];

  const menuItems = allMenuItems.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="flex flex-col bg-white h-full transition-all duration-300 w-64 select-none">
      <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-200">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-2.5">
            <BrandLogo markClassName="h-7 w-7" showWordmark={false} />
            <span className="font-black text-lg tracking-tight text-zinc-950">
              Entra<span className="text-zinc-400 font-bold text-[10px] ml-1.5 px-1.5 py-0.5 bg-zinc-100 rounded-full">STUDIO</span>
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 py-5 px-3 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          Menu Utama
        </div>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = item.path === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center px-3.5 py-2.5 rounded-full transition-all group ${
                    isActive 
                      ? 'bg-zinc-950 text-white font-bold shadow-xs' 
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 font-medium'
                  }`}
                >
                  <span className={`flex-shrink-0 flex items-center justify-center ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-900'}`}>
                    {item.icon}
                  </span>
                  <span className="ml-3 text-xs">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-zinc-200">
        <Link
          href="/"
          className="flex items-center justify-between w-full py-2.5 px-4 rounded-full text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all border border-zinc-200"
        >
          <span>Buka Portal Publik</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
        </Link>
      </div>
    </div>
  );
}
