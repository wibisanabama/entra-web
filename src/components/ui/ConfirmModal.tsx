'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isDestructive = true,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-zinc-600 text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100">
          <Button variant="outline" onClick={onClose} className="rounded-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs px-4 py-2 font-bold">
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? 'primary' : 'primary'}
            className={`rounded-full text-xs px-5 py-2 font-bold shadow-none ${isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-950 hover:bg-zinc-800 text-white'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
