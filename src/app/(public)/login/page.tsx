'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
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
      // Assuming login returns a user object with a role
      // For mock purposes, just simulate success
      await login({ email, password });
      // We assume auth-provider handles the redirect, but just in case:
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-gray-900 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Selamat Datang</h1>
          <p className="text-gray-400">Masuk ke akun Entra Anda</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <Input 
              type="email" 
              placeholder="nama@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Link href="#" className="text-xs text-[#7C3AED] hover:text-[#4F46E5]">Lupa Password?</Link>
            </div>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-800 text-white"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#7C3AED] hover:bg-[#4F46E5] text-white py-6"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Belum punya akun?{' '}
          <Link href="/register" className="text-[#7C3AED] hover:text-[#4F46E5] font-medium">
            Daftar Sekarang
          </Link>
        </div>
      </Card>
    </div>
  );
}
