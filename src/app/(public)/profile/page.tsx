'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { authApi, getCookie } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Shield,
  Key,
  Camera,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Ticket,
  CreditCard,
  Building,
  LogOut,
  Save,
  ArrowRight,
  Mail,
  Phone,
  Calendar,
  Lock
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading, logout, loadProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'INFO' | 'SECURITY' | 'ACTIVITY'>('INFO');
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Password reset request state
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user, isLoading, router]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Hanya format JPG dan PNG yang didukung.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal adalah 5MB.');
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to MinIO storage-service
    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const baseUrl = process.env.NEXT_PUBLIC_STORAGE_API_URL || 'http://localhost:8087';
      const token = getCookie('entra_token');

      const response = await fetch(`${baseUrl}/api/v1/storage/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Gagal mengunggah foto profil ke storage.');
      }

      const data = await response.json();
      if (data.url) {
        setAvatarUrl(data.url);
        toast.success('Foto profil berhasil diunggah! Jangan lupa simpan perubahan.');
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat mengunggah foto profil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Nama lengkap wajib diisi.');
      return;
    }

    try {
      setIsSavingProfile(true);
      await authApi.put('/api/v1/auth/profile', {
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
      });

      await loadProfile();
      toast.success('Profil akun berhasil diperbarui!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Gagal menyimpan pembaruan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!user?.email) return;

    try {
      setIsRequestingReset(true);
      await authApi.post('/api/v1/auth/forgot-password', {
        email: user.email,
      });

      setResetRequested(true);
      toast.success('Tautan reset kata sandi telah dikirimkan ke email Anda.');
    } catch (error: any) {
      console.error('Password reset request error:', error);
      toast.error(error.message || 'Gagal mengirimkan tautan reset kata sandi.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await authApi.post('/api/v1/auth/upgrade');
      await loadProfile();
      toast.success('Selamat! Akun Anda berhasil ditingkatkan menjadi Organizer.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to upgrade role:', error);
      toast.error('Gagal meningkatkan akun. Silakan coba lagi.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      toast.success('User ID berhasil disalin ke clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48 bg-gray-900" />
          <Skeleton className="h-64 w-full bg-gray-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  const effectiveAvatar = avatarPreview || avatarUrl || user.avatar_url;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner & Identity Hero */}
      <div className="relative bg-gradient-to-r from-violet-950/80 via-purple-900/30 to-gray-900 border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-violet-500/40 bg-violet-950 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-violet-950/50">
                {effectiveAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt={user.full_name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                title="Ubah Foto Profil"
              >
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-semibold">Ubah Foto</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleAvatarFileChange}
              />
            </div>

            {/* Profile Meta Details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user.full_name}
                </h1>
                <Badge
                  variant={
                    user.role === 'admin'
                      ? 'error'
                      : user.role === 'organizer'
                      ? 'success'
                      : 'secondary'
                  }
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  {user.role === 'admin'
                    ? 'ADMIN PLATFORM'
                    : user.role === 'organizer'
                    ? 'ORGANIZER EVENT'
                    : 'PENGUNJUNG / USER'}
                </Badge>
              </div>

              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-4 w-4 text-violet-400" />
                {user.email}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Akun Terverifikasi
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  ID: {user.id.substring(0, 8)}...
                  <button
                    onClick={handleCopyId}
                    className="hover:text-white p-0.5"
                    title="Salin ID"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Upgrade to Organizer CTA for Users */}
          {user.role === 'user' && (
            <div className="bg-gray-900/90 border border-violet-500/40 p-4 rounded-2xl max-w-xs text-center md:text-right space-y-2">
              <p className="text-xs font-semibold text-violet-300">Ingin Menggelar Event?</p>
              <p className="text-[11px] text-gray-400">
                Buka akses dashboard penjualan tiket dan scanner pintu masuk.
              </p>
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2 rounded-xl"
              >
                {isUpgrading ? 'Memproses...' : 'Tingkatkan ke Organizer'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-800 space-x-4">
        <button
          onClick={() => setActiveTab('INFO')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'INFO'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Informasi Pribadi & Avatar
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'SECURITY'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          Keamanan & Kata Sandi
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'ACTIVITY'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Aktivitas & Akses Cepat
        </button>
      </div>

      {/* TAB 1: Informasi Pribadi & Avatar */}
      {activeTab === 'INFO' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-gray-900 border-gray-800 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Data Profil</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Perbarui identitas akun Anda untuk dicantumkan pada e-ticket dan tiket masuk acara.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-medium"
                    placeholder="Masukkan nama lengkap Anda"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 font-medium"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Alamat Email (Akun Utama)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-gray-400 cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Alamat email digunakan untuk verifikasi login dan penerimaan invoice tiket.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Avatar Details Card */}
          <Card className="bg-gray-900 border-gray-800 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white">Foto Profil Avatar</h3>
              <p className="text-xs text-gray-400">
                Foto profil akan ditampilkan di bilah navigasi dan kartu identitas festival Anda.
              </p>

              <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-violet-950 border-2 border-violet-500/40 flex items-center justify-center text-white text-2xl font-bold">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.full_name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {isUploadingAvatar ? 'Mengunggah...' : 'Ganti Foto'}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-[11px] text-gray-400 space-y-1">
              <p className="font-semibold text-white">Petunjuk Unggah:</p>
              <p>• Format: JPG atau PNG</p>
              <p>• Ukuran maksimal: 5MB</p>
              <p>• Disarankan rasio 1:1 (persegi)</p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Keamanan & Kata Sandi */}
      {activeTab === 'SECURITY' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-gray-900 border-gray-800 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Keamanan & Reset Kata Sandi</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Kelola kata sandi akun untuk memastikan keamanan akses transaksi dan tiket Anda.
              </p>
            </div>

            <div className="p-4 bg-gray-950 border border-gray-800 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-xl">
                  <Key className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Reset Kata Sandi Akun</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Kami akan mengirimkan tautan verifikasi aman ke email Anda ({user.email}) untuk memperbarui kata sandi baru.
                  </p>
                </div>
              </div>

              {resetRequested ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>Tautan pembaruan kata sandi telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam.</span>
                </div>
              ) : (
                <Button
                  onClick={handleRequestPasswordReset}
                  disabled={isRequestingReset}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isRequestingReset ? 'Mengirim Permintaan...' : 'Kirim Tautan Reset Kata Sandi'}
                </Button>
              )}
            </div>

            {/* Security checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white">Rekomendasi Keamanan Akun</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex items-center gap-2 p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Gunakan minimal 8 karakter dengan kombinasi huruf besar, angka, dan simbol.</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Jangan pernah membagikan kode QR tiket digital atau akses akun kepada orang lain.</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Status Keamanan</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-3 bg-gray-950 rounded-xl border border-gray-800">
                <span className="text-gray-400">Enkripsi Password</span>
                <span className="text-emerald-400 font-bold font-mono">Bcrypt (Cost 10)</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-gray-950 rounded-xl border border-gray-800">
                <span className="text-gray-400">Token JWT</span>
                <span className="text-violet-400 font-bold font-mono">HS256 Active</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-gray-950 rounded-xl border border-gray-800">
                <span className="text-gray-400">Autentikasi Sesi</span>
                <span className="text-white font-bold">Aman (Http Cookie)</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Aktivitas & Akses Cepat */}
      {activeTab === 'ACTIVITY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/my-tickets">
              <Card className="bg-gray-900 hover:bg-gray-800/80 border-gray-800 p-5 transition-all cursor-pointer h-full flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors">
                    Tiket Saya & E-Ticket
                  </h3>
                  <p className="text-xs text-gray-400">
                    Akses kode QR digital tiket konser dan riwayat invoice pembayaran.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs text-violet-400 font-semibold">
                  <span>Buka Tiket</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            </Link>

            <Link href="/cashless">
              <Card className="bg-gray-900 hover:bg-gray-800/80 border-gray-800 p-5 transition-all cursor-pointer h-full flex flex-col justify-between group">
                <div className="space-y-2">
                  <div className="p-3 bg-violet-600/20 text-violet-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors">
                    Gelang RFID Cashless
                  </h3>
                  <p className="text-xs text-gray-400">
                    Cek saldo aktif gelang festival, top-up saldo instan, dan mutasi tenant F&B.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs text-violet-400 font-semibold">
                  <span>Buka Portal Gelang</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            </Link>

            {user.role === 'organizer' || user.role === 'admin' ? (
              <Link href="/dashboard">
                <Card className="bg-gray-900 hover:bg-gray-800/80 border-gray-800 p-5 transition-all cursor-pointer h-full flex flex-col justify-between group">
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit group-hover:scale-110 transition-transform">
                      <Building className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors">
                      Dashboard Organizer
                    </h3>
                    <p className="text-xs text-gray-400">
                      Kelola event Anda, pantau penjualan tiket, dan ajukan pencairan dana.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                    <span>Buka Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="bg-gray-900 border-gray-800 p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit">
                    <Building className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Tingkatkan Akun</h3>
                  <p className="text-xs text-gray-400">
                    Ingin menjual tiket event Anda sendiri di Entra?
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold"
                >
                  {isUpgrading ? 'Memproses...' : 'Tingkatkan ke Organizer'}
                </Button>
              </Card>
            )}
          </div>

          {/* Danger Zone: Log out */}
          <Card className="bg-red-950/20 border-red-500/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Keluar dari Sesi Akun
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Keluar dari akun Anda pada perangkat ini. Anda perlu masuk kembali untuk mengakses tiket.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => logout()}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold px-5 py-2"
            >
              Keluar Sekarang
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
