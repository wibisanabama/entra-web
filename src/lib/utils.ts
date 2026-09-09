import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr?: string, endDateStr?: string): string {
  if (!dateStr) return '';
  try {
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) return '';
    const startTime = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(start).replace('.', ':');

    if (endDateStr) {
      const end = new Date(endDateStr);
      if (!isNaN(end.getTime())) {
        const endTime = new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(end).replace('.', ':');
        if (startTime !== endTime) {
          return `${startTime} - ${endTime} WIB`;
        }
      }
    }

    return `${startTime} WIB`;
  } catch {
    return '';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getPgText(val: { String?: string; Valid?: boolean } | string | null | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.Valid && typeof val.String === 'string') return val.String;
  return '';
}

export function getRoleBadgeColor(role?: string): string {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'organizer':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'staff':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'user':
    default:
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
}

export function getOrderStatusColor(status?: string): string {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'SUCCESS':
    case 'SUKSES':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'PENDING':
    case 'MENUNGGU':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'CANCELLED':
    case 'EXPIRED':
    case 'FAILED':
    case 'DIBATALKAN':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
}

