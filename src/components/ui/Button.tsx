'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';
  
  const variants = {
    primary: 'bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.98] shadow-xs',
    secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 active:scale-[0.98] border border-zinc-200/60',
    outline: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] shadow-xs',
    ghost: 'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-xs',
  };

  const sizes = {
    sm: 'h-8 px-3.5 text-xs tracking-tight',
    md: 'h-10 px-5 py-2 text-sm tracking-tight',
    lg: 'h-12 px-7 text-base tracking-tight',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
