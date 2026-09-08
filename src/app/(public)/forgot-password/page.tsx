'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authApi.post('/api/v1/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memproses permintaan Anda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8 sm:p-10 bg-white border border-zinc-200 rounded-3xl shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2">Lupa Password?</h1>
          <p className="text-sm text-zinc-500">Masukkan email Anda untuk mereset password</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl mb-6 text-xs font-medium text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl mb-6 text-xs font-medium text-center">
            Tautan reset password telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam.
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
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3 rounded-full shadow-sm"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Kirim Link Reset'}
          </Button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Ingat password Anda?{' '}
          <Link href="/login" className="text-zinc-950 hover:underline font-bold">
            Masuk
          </Link>
        </div>
      </Card>
    </div>
  );
}
