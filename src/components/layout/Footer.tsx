import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 ">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <span className="text-2xl font-bold text-violet-500 mb-4">
          Entra
        </span>
        <p className="text-gray-400 text-sm max-w-md mb-8">
          Platform manajemen event dan tiket modern. Buat, kelola, dan jual tiket event Anda dengan mudah.
        </p>
        <div className="mt-4">
          <p className="text-base text-gray-400">
            &copy; {new Date().getFullYear()} Entra. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
