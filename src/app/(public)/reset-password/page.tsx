'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token reset tidak valid atau tidak ditemukan.');
    }
  }, [token]);

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 bg-gray-900 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">Masukkan password baru Anda</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-500/10 text-green-500 p-4 rounded-md mb-6 text-sm">
              Password berhasil direset! Mengalihkan ke halaman login...
            </div>
            <Link href="/login">
              <Button className="w-full bg-[#7C3AED] hover:bg-[#4F46E5] text-white py-6">
                Kembali ke Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password Baru</label>
              <Input 
                type="password" 
                placeholder="Minimal 8 karakter" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={!token}
                className="bg-gray-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Konfirmasi Password</label>
              <Input 
                type="password" 
                placeholder="Ulangi password baru" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={!token}
                className="bg-gray-800 text-white"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#7C3AED] hover:bg-[#4F46E5] text-white py-6"
              disabled={loading || !token}
            >
              {loading ? 'Memproses...' : 'Simpan Password Baru'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
