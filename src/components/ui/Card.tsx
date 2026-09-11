import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-2xl overflow-hidden text-zinc-950', className)}
      {...props}
    >
      {children}
    </div>
  );
}
