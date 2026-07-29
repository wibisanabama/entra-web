import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 ">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <span className="text-2xl font-bold text-violet-500">
              Entra
            </span>
            <p className="text-gray-400 text-sm max-w-xs">
              Platform manajemen event dan tiket modern. Buat, kelola, dan jual tiket event Anda dengan mudah.
            </p>

          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Platform</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/events" className="text-base text-gray-400 hover:text-white">Cari Event</Link></li>
                  <li><Link href="/dashboard" className="text-base text-gray-400 hover:text-white">Buat Event</Link></li>
                  <li><Link href="/pricing" className="text-base text-gray-400 hover:text-white">Harga</Link></li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Perusahaan</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link href="/about" className="text-base text-gray-400 hover:text-white">Tentang Kami</Link></li>
                  <li><Link href="/blog" className="text-base text-gray-400 hover:text-white">Blog</Link></li>
                  <li><Link href="/contact" className="text-base text-gray-400 hover:text-white">Kontak</Link></li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/privacy" className="text-base text-gray-400 hover:text-white">Privasi</Link></li>
                <li><Link href="/terms" className="text-base text-gray-400 hover:text-white">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {new Date().getFullYear()} Entra. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
