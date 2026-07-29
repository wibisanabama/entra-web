'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Calendar, ShoppingCart, ChevronLeft, ChevronRight, Folder } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Event', path: '/dashboard/events', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Pesanan', path: '/dashboard/orders', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'Media', path: '/dashboard/media', icon: <Folder className="h-5 w-5" /> },
  ];

  return (
    <div className={`flex flex-col bg-gray-900 h-screen transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between h-16 px-4 ">
        {!isCollapsed && (
          <Link href="/" className="text-xl font-bold text-violet-500">
            Entra
          </Link>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`flex items-center px-2 py-2 rounded-lg transition-colors group ${
                    isActive 
                      ? 'bg-violet-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className={`flex-shrink-0 flex items-center justify-center ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
