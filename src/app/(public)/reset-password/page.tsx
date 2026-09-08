'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(!token ? 'Token reset tidak valid atau tidak ditemukan.' : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authApi.post('/api/v1/auth/reset-password', { 
        token,
        new_password: password
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2">Reset Password</h1>
        <p className="text-sm text-zinc-500">Masukkan password baru Anda</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl mb-6 text-xs font-medium text-center">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="text-center space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-xs font-medium">
            Password berhasil direset! Mengalihkan ke halaman login...
          </div>
          <Link href="/login">
            <Button className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3 rounded-full shadow-sm">
              Kembali ke Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Password Baru</label>
            <Input 
              type="password" 
              placeholder="Minimal 8 karakter" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={!token}
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Konfirmasi Password</label>
            <Input 
              type="password" 
              placeholder="Ulangi password baru" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={!token}
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3 rounded-full shadow-sm"
            disabled={loading || !token}
          >
            {loading ? 'Memproses...' : 'Simpan Password Baru'}
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 bg-white border border-zinc-200 rounded-3xl shadow-sm">
        <Suspense fallback={<div className="text-center text-zinc-500 text-sm">Memuat form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}

