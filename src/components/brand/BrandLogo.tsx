import type { HTMLAttributes } from 'react';

type BrandLogoProps = HTMLAttributes<HTMLSpanElement> & {
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function BrandLogo({
  className = '',
  markClassName = 'h-8 w-8',
  wordmarkClassName = 'text-xl font-bold tracking-tight text-zinc-950',
  showWordmark = true,
  ...props
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} {...props}>
      <img className={`${markClassName} object-contain rounded-lg`} src="/assets/black-e.png" alt="Entra" />
      {showWordmark && <span className={wordmarkClassName}>Entra</span>}
    </span>
  );
}
