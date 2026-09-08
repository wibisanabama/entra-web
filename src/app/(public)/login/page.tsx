'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

import { BrandLogo } from '@/components/brand/BrandLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      if (redirectPath && redirectPath.startsWith('/')) {
        router.push(redirectPath);
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] p-7 sm:p-9 bg-zinc-100 rounded-3xl">
      <div className="text-center mb-8 flex flex-col items-center">
        <Link href="/" aria-label="Kembali ke Beranda">
          <BrandLogo markClassName="h-11 w-11 mb-3 hover:opacity-80 transition-opacity" showWordmark={false} />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2">Selamat Datang</h1>
        <p className="text-sm text-zinc-500">Masuk ke akun Entra Anda</p>
      </div>

      {error && (
        <div className="bg-rose-100 text-rose-700 p-3 rounded-2xl mb-6 text-xs font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Email</label>
          <Input 
            type="email" 
            placeholder="nama@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white border-0 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white shadow-none"
          />
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Password</label>
            <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-zinc-950 font-medium">Lupa Password?</Link>
          </div>
          <Input 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white border-0 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white shadow-none"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3 rounded-full border-0 shadow-none"
          disabled={loading}
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>

      <div className="mt-8 text-center text-xs text-zinc-500">
        Belum punya akun?{' '}
        <Link href="/register" className="text-zinc-950 hover:underline font-bold">
          Daftar Sekarang
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full flex items-center justify-center">
      <Suspense fallback={<div className="text-zinc-500 text-center text-sm">Memuat form login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
