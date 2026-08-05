import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'ACTIVE' | 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'DRAFT' | 'PUBLISHED' | string;
}

export function Badge({ status, className = '', ...props }: BadgeProps) {
  const getBadgeStyles = (s: string) => {
    switch (s.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'PUBLISHED':
        return 'bg-green-500/10 text-green-400 ';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 ';
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 ';
      case 'USED':
      case 'DRAFT':
      default:
        return 'bg-gray-500/10 text-gray-400 ';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide ${getBadgeStyles(status)} ${className}`}
      {...props}
    >
      {status.toUpperCase()}
    </span>
  );
}
