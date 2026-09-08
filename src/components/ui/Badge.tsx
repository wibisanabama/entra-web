import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'ACTIVE' | 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'DRAFT' | 'PUBLISHED' | 'APPROVED' | 'REJECTED' | string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'secondary';
}

export function Badge({ status = 'ACTIVE', variant, children, className = '', ...props }: BadgeProps) {
  const getBadgeStyles = () => {
    if (variant) {
      switch (variant) {
        case 'success':
          return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
        case 'warning':
          return 'bg-amber-50 text-amber-700 border border-amber-200/80';
        case 'error':
          return 'bg-rose-50 text-rose-700 border border-rose-200/80';
        case 'info':
          return 'bg-blue-50 text-blue-700 border border-blue-200/80';
        case 'secondary':
        default:
          return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
      }
    }

    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'PUBLISHED':
      case 'SUCCESS':
      case 'SUKSES':
      case 'SELESAI':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'APPROVED':
      case 'DISETUJUI':
        return 'bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'PENDING':
      case 'MENUNGGU':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80';
      case 'EXPIRED':
      case 'CANCELLED':
      case 'DIBATALKAN':
      case 'REJECTED':
      case 'DITOLAK':
        return 'bg-rose-50 text-rose-700 border border-rose-200/80';
      case 'USED':
      case 'DRAFT':
      default:
        return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${getBadgeStyles()} ${className}`}
      {...props}
    >
      {children || status.toUpperCase()}
    </span>
  );
}
