'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      await register({
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      router.push('/');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftar';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 sm:p-10 bg-white border border-zinc-200 rounded-3xl shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mb-2">Buat Akun Baru</h1>
          <p className="text-sm text-zinc-500">Bergabung dengan Entra sekarang</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl mb-6 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Nama Lengkap</label>
            <Input 
              name="fullName"
              placeholder="John Doe" 
              value={formData.fullName}
              onChange={handleChange}
              required
              className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Email</label>
              <Input 
                type="email" 
                name="email"
                placeholder="nama@email.com" 
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">No. HP</label>
              <Input 
                type="tel" 
                name="phone"
                placeholder="08123456789" 
                value={formData.phone}
                onChange={handleChange}
                required
                className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Password</label>
              <Input 
                type="password" 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Konfirmasi Password</label>
              <Input 
                type="password" 
                name="confirmPassword"
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-3 rounded-full shadow-sm"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-zinc-950 hover:underline font-bold">
            Masuk
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-zinc-500 text-sm">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
