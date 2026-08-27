import React from 'react';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-700 rounded-md ${className}`}
      {...props}
    />
  );
}
