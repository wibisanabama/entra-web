import Link from 'next/link';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <BrandLogo markClassName="h-7 w-7" wordmarkClassName="text-lg font-bold tracking-tight text-zinc-950" />
            </Link>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Platform ticketing dan manajemen event modern dengan validasi gate instan dan ekosistem cashless festival.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-medium text-zinc-600">
            <Link href="/events" className="hover:text-zinc-950 transition-colors">
              Semua Event
            </Link>
            <Link href="/my-tickets" className="hover:text-zinc-950 transition-colors">
              Tiket Saya
            </Link>
            <Link href="/cashless" className="hover:text-zinc-950 transition-colors">
              Gelang Cashless
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-950 transition-colors">
              Organizer Hub
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-zinc-400">
          <p>&copy; {new Date().getFullYear()} Entra Technologies. Hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <span className="hover:text-zinc-600 cursor-pointer">Privasi</span>
            <span className="hover:text-zinc-600 cursor-pointer">Syarat & Ketentuan</span>
            <span className="hover:text-zinc-600 cursor-pointer">Bantuan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
