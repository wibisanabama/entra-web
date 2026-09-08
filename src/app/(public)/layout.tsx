import React from 'react';
import { PublicLayoutClient } from '@/components/layout/PublicLayoutClient';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicLayoutClient>{children}</PublicLayoutClient>;
}
