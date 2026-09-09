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
import { toast } from '@/lib/toast';
import {
  User as UserIcon,
  Shield,
  Key,
  Camera,
  CheckCircle2,
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
  Lock,
  Eye,
  EyeOff,
  KeyRound
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

  // Direct change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  if (user && user.id !== prevUserId) {
    setPrevUserId(user.id);
    setFullName(user.full_name || '');
    setPhone(user.phone || '');
    setAvatarUrl(user.avatar_url || '');
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
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
    } catch (error: unknown) {
      console.error('Avatar upload error:', error);
      const errMsg = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah foto profil.';
      toast.error(errMsg);
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
    } catch (error: unknown) {
      console.error('Update profile error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal menyimpan pembaruan profil.';
      toast.error(errMsg);
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
    } catch (error: unknown) {
      console.error('Password reset request error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal mengirimkan tautan reset kata sandi.';
      toast.error(errMsg);
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Semua kolom kata sandi wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authApi.post('/api/v1/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success('Kata sandi berhasil diperbarui.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Change password error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal memperbarui kata sandi.';
      toast.error(errMsg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await authApi.post('/api/v1/auth/upgrade');
      await loadProfile();
      toast.success('Selamat! Akun Anda berhasil ditingkatkan menjadi Organizer.');
      router.push('/dashboard');
    } catch (error: unknown) {
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
          <Skeleton className="h-10 w-48 bg-zinc-100 rounded-full" />
          <Skeleton className="h-64 w-full bg-zinc-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  const effectiveAvatar = avatarPreview || avatarUrl || user.avatar_url;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner & Identity Hero - Mobbin Light */}
      <div className="relative bg-zinc-50 border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white bg-zinc-900 flex items-center justify-center text-white font-bold text-3xl shadow-sm">
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
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
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
                  className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-0.5"
                >
                  {user.role === 'admin'
                    ? 'Admin Platform'
                    : user.role === 'organizer'
                    ? 'Organizer'
                    : 'Pengunjung'}
                </Badge>
              </div>

              <p className="text-zinc-600 text-sm flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <Mail className="h-4 w-4 text-zinc-400" />
                {user.email}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-full font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Akun Terverifikasi
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-full font-mono font-medium">
                  ID: {user.id.substring(0, 8)}...
                  <button
                    onClick={handleCopyId}
                    className="hover:text-zinc-900 p-0.5"
                    title="Salin ID"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Upgrade to Organizer CTA for Users */}
          {user.role === 'user' && (
            <div className="bg-white border border-zinc-200 p-5 rounded-2xl max-w-xs text-center md:text-right space-y-2.5 shadow-sm">
              <p className="text-xs font-bold text-zinc-950">Ingin Menggelar Event?</p>
              <p className="text-[12px] text-zinc-500 leading-relaxed">
                Buka akses dashboard penjualan tiket, manajemen kuota, dan scanner pintu masuk.
              </p>
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold py-2 rounded-full"
              >
                {isUpgrading ? 'Memproses...' : 'Tingkatkan ke Organizer'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 space-x-6">
        <button
          onClick={() => setActiveTab('INFO')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'INFO'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Informasi Pribadi & Avatar
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'SECURITY'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Shield className="h-4 w-4" />
          Keamanan & Kata Sandi
        </button>

        <button
          onClick={() => setActiveTab('ACTIVITY')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'ACTIVITY'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Aktivitas & Akses Cepat
        </button>
      </div>

      {/* TAB 1: Informasi Pribadi & Avatar */}
      {activeTab === 'INFO' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 bg-white border-zinc-200 p-6 sm:p-7 space-y-6 rounded-2xl shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Data Profil</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Perbarui identitas akun Anda untuk dicantumkan pada e-ticket dan tiket masuk acara.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:bg-white transition-all font-medium"
                    placeholder="Masukkan nama lengkap Anda"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-sm text-zinc-950 focus:outline-none focus:border-zinc-950 focus:bg-white transition-all font-medium"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Alamat Email (Akun Utama)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-full text-sm text-zinc-500 cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Alamat email digunakan untuk verifikasi login dan penerimaan invoice tiket.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSavingProfile || isUploadingAvatar}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm px-6 py-2.5 rounded-full flex items-center gap-2 shadow-none"
                >
                  <Save className="h-4 w-4" />
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Avatar Details Card */}
          <Card className="bg-white border-zinc-200 p-6 space-y-4 flex flex-col justify-between rounded-2xl shadow-sm">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-zinc-950">Foto Profil Avatar</h3>
              <p className="text-xs text-zinc-500">
                Foto profil akan ditampilkan di bilah navigasi dan kartu identitas festival Anda.
              </p>

              <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-900 border-2 border-white shadow-sm flex items-center justify-center text-white text-2xl font-bold">
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
                  className="text-xs flex items-center gap-1.5 rounded-full border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-900"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {isUploadingAvatar ? 'Mengunggah...' : 'Ganti Foto'}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-[11px] text-zinc-500 space-y-1">
              <p className="font-bold text-zinc-900">Petunjuk Unggah:</p>
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
          <Card className="md:col-span-2 bg-white border-zinc-200 p-6 sm:p-7 space-y-6 rounded-2xl shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Keamanan & Reset Kata Sandi</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Kelola kata sandi akun untuk memastikan keamanan akses transaksi dan tiket Anda.
              </p>
            </div>

            {/* Direct Password Change Form */}
            <form onSubmit={handleChangePassword} className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-200 pb-3">
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">Ubah Kata Sandi Langsung</h3>
                  <p className="text-xs text-zinc-500">
                    Masukkan kata sandi saat ini dan tentukan kata sandi baru Anda.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1 block">Kata Sandi Saat Ini</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="w-full bg-white border border-zinc-200 rounded-full px-4 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 pr-10 focus:outline-none focus:border-zinc-950 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700"
                      title={showOldPassword ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 mb-1 block">Kata Sandi Baru</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full bg-white border border-zinc-200 rounded-full px-4 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 pr-10 focus:outline-none focus:border-zinc-950 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700"
                        title={showNewPassword ? "Sembunyikan" : "Tampilkan"}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 mb-1 block">Konfirmasi Kata Sandi Baru</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full bg-white border border-zinc-200 rounded-full px-4 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 pr-10 focus:outline-none focus:border-zinc-950 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-700"
                        title={showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 px-5 rounded-full flex items-center gap-2 shadow-none"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isChangingPassword ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
                </Button>
              </div>
            </form>

            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-zinc-900 text-white rounded-xl">
                  <Key className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-950">Reset Kata Sandi Akun</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Kami akan mengirimkan tautan verifikasi aman ke email Anda ({user.email}) untuk memperbarui kata sandi baru.
                  </p>
                </div>
              </div>

              {resetRequested ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Tautan pembaruan kata sandi telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam.</span>
                </div>
              ) : (
                <Button
                  onClick={handleRequestPasswordReset}
                  disabled={isRequestingReset}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 px-5 rounded-full flex items-center gap-2 shadow-none"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isRequestingReset ? 'Mengirim Permintaan...' : 'Kirim Tautan Reset Kata Sandi'}
                </Button>
              )}
            </div>

            {/* Security checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-950">Rekomendasi Keamanan Akun</h3>
              <div className="space-y-2 text-xs text-zinc-600">
                <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Gunakan minimal 8 karakter dengan kombinasi huruf besar, angka, dan simbol.</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Jangan pernah membagikan kode QR tiket digital atau akses akun kepada orang lain.</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-zinc-200 p-6 space-y-4 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-zinc-950">Status Keamanan</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-500 font-medium">Enkripsi Password</span>
                <span className="text-emerald-700 font-bold font-mono">Bcrypt (Cost 10)</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-500 font-medium">Token JWT</span>
                <span className="text-zinc-950 font-bold font-mono">HS256 Active</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-500 font-medium">Autentikasi Sesi</span>
                <span className="text-zinc-950 font-bold">Aman (Http Cookie)</span>
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
              <Card className="bg-white hover:border-zinc-300 border-zinc-200 p-6 transition-all cursor-pointer h-full flex flex-col justify-between group rounded-2xl shadow-sm hover:shadow-md">
                <div className="space-y-2.5">
                  <div className="p-3 bg-zinc-100 text-zinc-950 rounded-2xl w-fit group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-950 group-hover:text-black transition-colors">
                    Tiket Saya & E-Ticket
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Akses kode QR digital tiket konser dan riwayat invoice pembayaran.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs text-zinc-950 font-bold">
                  <span>Buka Tiket</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link href="/cashless">
              <Card className="bg-white hover:border-zinc-300 border-zinc-200 p-6 transition-all cursor-pointer h-full flex flex-col justify-between group rounded-2xl shadow-sm hover:shadow-md">
                <div className="space-y-2.5">
                  <div className="p-3 bg-zinc-100 text-zinc-950 rounded-2xl w-fit group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-950 group-hover:text-black transition-colors">
                    Gelang RFID Cashless
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Cek saldo aktif gelang festival, top-up saldo instan, dan mutasi tenant F&B.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-1 text-xs text-zinc-950 font-bold">
                  <span>Buka Portal Gelang</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            {user.role === 'organizer' || user.role === 'admin' ? (
              <Link href="/dashboard">
                <Card className="bg-white hover:border-zinc-300 border-zinc-200 p-6 transition-all cursor-pointer h-full flex flex-col justify-between group rounded-2xl shadow-sm hover:shadow-md">
                  <div className="space-y-2.5">
                    <div className="p-3 bg-zinc-100 text-zinc-950 rounded-2xl w-fit group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                      <Building className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-950 group-hover:text-black transition-colors">
                      Dashboard Organizer
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      Kelola event Anda, pantau penjualan tiket, dan ajukan pencairan dana.
                    </p>
                  </div>
                  <div className="pt-4 flex items-center gap-1 text-xs text-zinc-950 font-bold">
                    <span>Buka Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="bg-white border-zinc-200 p-6 flex flex-col justify-between rounded-2xl shadow-sm">
                <div className="space-y-2.5">
                  <div className="p-3 bg-zinc-100 text-zinc-950 rounded-2xl w-fit">
                    <Building className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-950">Tingkatkan Akun</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Ingin menjual tiket event Anda sendiri di Entra?
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className="mt-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-full py-2.5"
                >
                  {isUpgrading ? 'Memproses...' : 'Tingkatkan ke Organizer'}
                </Button>
              </Card>
            )}
          </div>

          {/* Danger Zone: Log out */}
          <Card className="bg-red-50/50 border-red-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Keluar dari Sesi Akun
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Keluar dari akun Anda pada perangkat ini. Anda perlu masuk kembali untuk mengakses tiket.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => logout()}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold px-5 py-2 rounded-full"
            >
              Keluar Sekarang
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
