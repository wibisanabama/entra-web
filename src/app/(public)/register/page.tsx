'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams?.get('role') === 'organizer' ? 'organizer' : 'user';
  
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole
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
        role: formData.role
      });
      if (formData.role === 'organizer') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-8 bg-gray-900 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Buat Akun Baru</h1>
          <p className="text-gray-400">Bergabung dengan Entra sekarang</p>
        </div>

        {/* Role Selector */}
        <div className="flex p-1 mb-8 bg-gray-800 rounded-lg">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              formData.role === 'user' ? 'bg-[#7C3AED] text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setFormData({...formData, role: 'user'})}
          >
            Pembeli Tiket
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              formData.role === 'organizer' ? 'bg-[#7C3AED] text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setFormData({...formData, role: 'organizer'})}
          >
            Organizer Event
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Nama Lengkap</label>
            <Input 
              name="fullName"
              placeholder="John Doe" 
              value={formData.fullName}
              onChange={handleChange}
              required
              className="bg-gray-800 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <Input 
                type="email" 
                name="email"
                placeholder="nama@email.com" 
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">No. HP</label>
              <Input 
                type="tel" 
                name="phone"
                placeholder="08123456789" 
                value={formData.phone}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Input 
                type="password" 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Konfirmasi Password</label>
              <Input 
                type="password" 
                name="confirmPassword"
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-[#7C3AED] hover:bg-[#4F46E5] text-white py-6"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-[#7C3AED] hover:text-[#4F46E5] font-medium">
            Masuk
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-white">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
