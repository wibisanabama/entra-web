'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, ShoppingCart, Folder, Wallet, ShieldCheck, MapPin } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Event', path: '/dashboard/events', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Venue & Lokasi', path: '/dashboard/venues', icon: <MapPin className="h-5 w-5" /> },
    { name: 'Pesanan', path: '/dashboard/orders', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'Keuangan & Saldo', path: '/dashboard/withdrawals', icon: <Wallet className="h-5 w-5" /> },
    { name: 'Pencairan Admin', path: '/dashboard/admin/withdrawals', icon: <ShieldCheck className="h-5 w-5" /> },
    { name: 'Media', path: '/dashboard/media', icon: <Folder className="h-5 w-5" /> },
  ];

  return (
    <div className="flex flex-col bg-gray-900 h-full transition-all duration-300 w-64">
      <div className="flex items-center justify-between h-16 px-4 ">
        <Link href="/" className="text-xl font-bold text-violet-500">
          Entra
        </Link>
      </div>
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = item.path === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center px-2 py-2 rounded-lg transition-colors group ${
                    isActive 
                      ? 'bg-violet-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className={`flex-shrink-0 flex items-center justify-center ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  <span className="ml-3 text-sm font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
