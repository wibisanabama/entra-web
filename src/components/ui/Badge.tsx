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
          return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'warning':
          return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'error':
          return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
        case 'info':
          return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        case 'secondary':
        default:
          return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      }
    }

    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'PUBLISHED':
      case 'SUCCESS':
      case 'SUKSES':
      case 'SELESAI':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'APPROVED':
      case 'DISETUJUI':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'PENDING':
      case 'MENUNGGU':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'EXPIRED':
      case 'CANCELLED':
      case 'DIBATALKAN':
      case 'REJECTED':
      case 'DITOLAK':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'USED':
      case 'DRAFT':
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
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
