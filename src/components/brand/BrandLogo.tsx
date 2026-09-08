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
    <span className={`inline-flex items-center gap-2 ${className}`} {...props}>
      <img className={markClassName} src="/brand/entra-mark.svg" alt="" aria-hidden="true" />
      {showWordmark && <span className={wordmarkClassName}>Entra</span>}
    </span>
  );
}
