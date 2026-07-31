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
      <Card className="w-full max-w-md p-8 bg-gray-900 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Lupa Password?</h1>
          <p className="text-gray-400">Masukkan email Anda untuk mereset password</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 text-green-500 p-3 rounded-md mb-6 text-sm text-center">
            Tautan reset password telah dikirim ke email Anda. (Silakan periksa email Anda)
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

          <Button 
            type="submit" 
            className="w-full bg-[#7C3AED] hover:bg-[#4F46E5] text-white py-6"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Kirim Link Reset'}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Ingat password Anda?{' '}
          <Link href="/login" className="text-[#7C3AED] hover:text-[#4F46E5] font-medium">
            Masuk
          </Link>
        </div>
      </Card>
    </div>
  );
}
