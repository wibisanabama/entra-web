'use client';

import React, { useEffect, useCallback } from 'react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="!px-2 !py-1 text-gray-400 hover:text-white">
            <span className="sr-only">Tutup</span>
            &times;
          </Button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
