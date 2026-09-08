import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0c0c0c] text-white mt-auto border-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 flex flex-col justify-between">
        
        {/* Main Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-6">
            <Link href="/" className="inline-block">
              <BrandLogo
                variant="white"
                markClassName="h-7 w-7"
                wordmarkClassName="text-2xl sm:text-[28px] font-semibold tracking-[-0.03em] text-white"
              />
            </Link>
            <p className="mt-4 text-sm sm:text-[15px] text-zinc-400 font-normal leading-relaxed max-w-sm">
              Platform ticketing dan ekosistem festival modern dengan validasi gate instan.
            </p>
          </div>

          {/* Navigation Column 1 */}
          <div className="md:col-span-3 flex flex-col space-y-3 sm:space-y-3.5">
            <Link href="/events" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Explore
            </Link>
            <Link href="/events" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Kategori
            </Link>
            <Link href="/my-tickets" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Tiket saya
            </Link>
            <Link href="/cashless" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Gelang cashless
            </Link>
            <Link href="/dashboard" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Organizer hub
            </Link>
            <Link href="/dashboard/events/create" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Buat event
            </Link>
            <Link href="/dashboard" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Validasi gate
            </Link>
          </div>

          {/* Navigation Column 2 */}
          <div className="md:col-span-3 flex flex-col space-y-3 sm:space-y-3.5">
            <a href="mailto:support@entra.id" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Contact
            </a>
            <Link href="/help" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Help center
            </Link>
            <Link href="/careers" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Careers
            </Link>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              Instagram
            </a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              X (Twitter)
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-[15px] font-normal text-zinc-300 hover:text-white transition-colors">
              LinkedIn
            </a>
          </div>
        </div>

        {/* Bottom Legal / Copyright Grid */}
        <div className="mt-20 sm:mt-28 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center text-xs sm:text-[13px] text-zinc-500 font-normal">
          <div className="md:col-span-6">
            <p>&copy; Entra 2024–{currentYear}</p>
          </div>
          <div className="md:col-span-3">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy policy
            </Link>
          </div>
          <div className="md:col-span-3">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
