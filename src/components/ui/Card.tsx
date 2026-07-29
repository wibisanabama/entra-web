import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-gray-800/50 backdrop-blur rounded-xl overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
