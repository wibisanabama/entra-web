'use client';

import React, { useState, useRef, useEffect } from 'react';

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
    <header className="bg-gray-900 h-16 flex items-center justify-between px-6 z-10 w-full">
      <div className="flex items-center flex-1">
        {/* Search bar removed */}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-200 hidden sm:block">
              {user?.full_name || 'User'}
            </span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden">
              <div className="flex flex-col">
                <a href="/profile" className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 transition-colors">
                  Profil Saya
                </a>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition-colors"
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
