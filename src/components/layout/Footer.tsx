import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0c0c0c] text-white mt-auto border-none print:hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <Link href="/" className="inline-block">
            <BrandLogo
              variant="white"
              markClassName="h-7 w-7"
              wordmarkClassName="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-white"
            />
          </Link>
          <p className="mt-3 text-sm sm:text-[15px] text-zinc-400 font-normal leading-relaxed max-w-sm">
            Platform ticketing dan ekosistem festival modern dengan validasi gate instan.
          </p>
        </div>

        <p className="text-xs sm:text-[13px] text-zinc-500 font-normal">
          &copy; Entra {currentYear}
        </p>
      </div>
    </footer>
  );
}
