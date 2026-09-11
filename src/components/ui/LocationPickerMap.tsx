'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { LocationPickerMapProps, SelectedLocation } from './LocationPickerMapInner';

export type { LocationPickerMapProps, SelectedLocation };

export const LocationPickerMap = dynamic<LocationPickerMapProps>(
  () => import('./LocationPickerMapInner').then((mod) => mod.LocationPickerMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-zinc-100 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs border-0 shadow-none animate-pulse">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
        <span>Memuat peta interaktif...</span>
      </div>
    ),
  }
);
