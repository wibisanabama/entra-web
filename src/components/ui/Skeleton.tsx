import React from 'react';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-200/70 rounded-xl ${className}`}
      {...props}
    />
  );
}
