'use client';

import React, { useEffect, useCallback } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, className = '', children }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative bg-white border border-zinc-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all ${className}`}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100">
          <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors text-2xl pb-1 cursor-pointer"
          >
            <span className="sr-only">Tutup</span>
            &times;
          </button>
        </div>
        <div className="px-6 py-5 text-zinc-900">
          {children}
        </div>
      </div>
    </div>
  );
}
