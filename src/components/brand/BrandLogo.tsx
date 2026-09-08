import type { HTMLAttributes } from 'react';

type BrandLogoProps = HTMLAttributes<HTMLSpanElement> & {
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  variant?: 'black' | 'white';
};

export function BrandLogo({
  className = '',
  markClassName = 'h-8 w-8',
  wordmarkClassName,
  showWordmark = true,
  variant = 'black',
  ...props
}: BrandLogoProps) {
  const logoSrc = variant === 'white' ? '/assets/white-logo.png' : '/assets/black-logo.png';
  const wordmarkClass = wordmarkClassName ?? (variant === 'white' 
    ? 'text-xl font-bold tracking-tight text-white' 
    : 'text-xl font-bold tracking-tight text-zinc-950');

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} {...props}>
      <img className={`${markClassName} object-contain rounded-lg`} src={logoSrc} alt="Entra" />
      {showWordmark && <span className={wordmarkClass}>Entra</span>}
    </span>
  );
}
