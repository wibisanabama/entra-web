'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { authApi, getCookie } from '@/lib/api';
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
  Save,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';

const PROFILE_TABS = [
  { key: 'INFO', label: 'Informasi Pribadi', icon: UserIcon },
  { key: 'SECURITY', label: 'Keamanan & Kata Sandi', icon: Shield },
] as const;

export default function ProfilePage() {
  const { user, isLoading, loadProfile, upgradeToOrganizer } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'INFO' | 'SECURITY'>('INFO');

  // Slider indicator ala Mobbin / Slider Kita
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [isTabReady, setIsTabReady] = useState(false);

  useEffect(() => {
    const activeEl = tabsRef.current[activeTab];
    if (activeEl) {
      setTabIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });

      if (!isTabReady) {
        const timer = setTimeout(() => setIsTabReady(true), 50);
        return () => clearTimeout(timer);
      } else if (tabContainerRef.current) {
        const container = tabContainerRef.current;
        const targetScrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeTab, isTabReady]);

  useEffect(() => {
    const handleResize = () => {
      const activeEl = tabsRef.current[activeTab];
      if (activeEl) {
        setTabIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);
  
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
      router.push('/login?redirect=/profile');
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
      const uploadedUrl = data.data?.url || data.url;
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        setAvatarPreview(uploadedUrl);

        // Auto-save to user profile so change is immediately live
        try {
          await authApi.put('/api/v1/auth/profile', {
            full_name: fullName.trim() || user?.full_name || '',
            phone: phone.trim() || user?.phone || '',
            avatar_url: uploadedUrl,
          });
          await loadProfile();
          toast.success('Foto profil berhasil diperbarui!');
        } catch (saveErr) {
          console.error('Auto save avatar error:', saveErr);
          toast.success('Foto profil berhasil diunggah! Klik Simpan Perubahan Profil untuk menerapkan.');
        }
      } else {
        throw new Error(data.message || 'Gagal memperoleh tautan foto dari storage.');
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
      await upgradeToOrganizer();
      toast.success('Selamat! Akun Anda berhasil ditingkatkan menjadi Organizer.');
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      console.error('Failed to upgrade role:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal meningkatkan akun. Silakan coba lagi.';
      toast.error(errMsg);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="space-y-6">
          <Skeleton className="h-44 w-full bg-zinc-100 rounded-3xl border-0 shadow-none" />
          <Skeleton className="h-12 w-64 bg-zinc-100 rounded-full border-0 shadow-none" />
          <Skeleton className="h-80 w-full bg-zinc-100 rounded-3xl border-0 shadow-none" />
        </div>
      </div>
    );
  }

  const effectiveAvatar = avatarPreview || avatarUrl || user.avatar_url;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-zinc-900">
      {/* Top Banner & Identity Hero */}
      <div className="relative bg-zinc-100 rounded-3xl p-6 sm:p-8 border-0 shadow-none overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Avatar with Camera Trigger */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center text-white font-bold text-3xl border-0 shadow-none">
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

              {/* Upload Overlay Button (Hover Desktop) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white border-0 shadow-none"
                title="Ubah Foto Profil"
              >
                <Camera className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-semibold">Ubah Foto</span>
              </button>

              {/* Quick Camera Badge (Always Accessible) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 p-2 bg-white hover:bg-zinc-200 text-zinc-900 rounded-full cursor-pointer border-0 shadow-sm flex items-center justify-center transition-transform hover:scale-105"
                title="Ubah Foto Profil"
              >
                <Camera className="h-3.5 w-3.5" />
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
                  className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1 border-0 shadow-none"
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

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1 text-xs text-zinc-600">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full font-mono font-medium border-0 shadow-none">
                  ID: {user.id.substring(0, 8)}...
                  <button
                    onClick={handleCopyId}
                    className="hover:text-zinc-950 p-0.5 transition-colors cursor-pointer border-0"
                    title="Salin ID"
                  >
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard shortcut for Organizers */}
          {(user.role === 'organizer' || user.role === 'admin') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-xs text-center md:text-right space-y-3 border-0 shadow-none">
              <div>
                <p className="text-xs font-bold text-zinc-950">Panel Organizer</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">
                  Kelola event Anda, buat tiket baru, atau pantau statistik penjualan secara langsung.
                </p>
              </div>
              <Button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="w-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold py-3 rounded-full border-0 shadow-none cursor-pointer"
              >
                Buka Dashboard Organizer
              </Button>
            </div>
          )}

          {/* Upgrade to Organizer CTA for Users */}
          {(user.role === 'user' || user.role === 'customer') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-xs text-center md:text-right space-y-3 border-0 shadow-none">
              <div>
                <p className="text-xs font-bold text-zinc-950">Ingin Menggelar Event?</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-1">
                  Buka akses dashboard penjualan tiket, manajemen kuota, dan scanner pintu masuk.
                </p>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold py-3 rounded-full border-0 shadow-none cursor-pointer"
              >
                {isUpgrading ? 'Memproses...' : 'Tingkatkan ke Organizer'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs - Slider Mobbin / Slider Kita */}
      <div className="flex w-full overflow-hidden">
        <div
          ref={tabContainerRef}
          className="relative inline-flex items-center p-1 sm:p-1.5 bg-zinc-200/80 rounded-full gap-1 overflow-x-auto no-scrollbar max-w-full border-0 shadow-none"
        >
          {/* Sliding Capsule Highlight */}
          <div
            className={`absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full bg-white pointer-events-none border-0 shadow-none ${
              isTabReady
                ? 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                : 'transition-none'
            }`}
            style={{
              left: `${tabIndicatorStyle.left}px`,
              width: `${tabIndicatorStyle.width}px`,
              opacity: tabIndicatorStyle.width > 0 ? 1 : 0,
            }}
          />

          {PROFILE_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                ref={(el) => {
                  tabsRef.current[tab.key] = el;
                }}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative z-10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer flex items-center gap-2 border-0 shadow-none ${
                  isSelected
                    ? 'text-zinc-950'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Informasi Pribadi */}
      {activeTab === 'INFO' && (
        <div className="bg-zinc-100 p-6 sm:p-8 space-y-6 rounded-3xl border-0 shadow-none">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Data Profil</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Perbarui identitas akun Anda untuk dicantumkan pada e-ticket dan tiket masuk acara.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full pl-11 pr-4 py-3 bg-white rounded-full text-sm text-zinc-950 focus:outline-none focus:bg-white transition-all font-medium border-0 shadow-none"
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
                    className="w-full pl-11 pr-4 py-3 bg-white rounded-full text-sm text-zinc-950 focus:outline-none focus:bg-white transition-all font-medium border-0 shadow-none"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
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
                  className="w-full pl-11 pr-4 py-3 bg-zinc-200/70 rounded-full text-sm text-zinc-500 cursor-not-allowed font-medium border-0 shadow-none"
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
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm px-7 py-3 rounded-full flex items-center gap-2 border-0 shadow-none cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Keamanan & Kata Sandi */}
      {activeTab === 'SECURITY' && (
        <div className="bg-zinc-100 p-6 sm:p-8 space-y-6 rounded-3xl border-0 shadow-none">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">Keamanan & Reset Kata Sandi</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Kelola kata sandi akun untuk memastikan keamanan akses transaksi dan tiket Anda.
            </p>
          </div>

          {/* Direct Password Change Form */}
          <form onSubmit={handleChangePassword} className="p-5 sm:p-6 bg-white rounded-2xl space-y-5 border-0 shadow-none">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-100 text-zinc-950 rounded-2xl">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Ubah Kata Sandi Langsung</h3>
                <p className="text-xs text-zinc-500">
                  Masukkan kata sandi saat ini dan tentukan kata sandi baru Anda.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 mb-1.5 block">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    className="w-full bg-zinc-100 focus:bg-zinc-50 rounded-full px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 pr-11 focus:outline-none transition-all font-medium border-0 shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer border-0"
                    title={showOldPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full bg-zinc-100 focus:bg-zinc-50 rounded-full px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 pr-11 focus:outline-none transition-all font-medium border-0 shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer border-0"
                      title={showNewPassword ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 mb-1.5 block">Konfirmasi Kata Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-zinc-100 focus:bg-zinc-50 rounded-full px-4 py-3 text-sm text-zinc-950 placeholder:text-zinc-400 pr-11 focus:outline-none transition-all font-medium border-0 shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 cursor-pointer border-0"
                      title={showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 px-6 rounded-full flex items-center gap-2 border-0 shadow-none cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                {isChangingPassword ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
              </Button>
            </div>
          </form>

          {/* Email Reset Option */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl space-y-4 border-0 shadow-none">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-zinc-100 text-zinc-950 rounded-2xl">
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
              <div className="p-4 bg-emerald-100 text-emerald-800 rounded-2xl text-xs flex items-center gap-2.5 font-medium border-0 shadow-none">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>Tautan pembaruan kata sandi telah dikirimkan ke email Anda. Silakan periksa kotak masuk atau spam.</span>
              </div>
            ) : (
              <Button
                onClick={handleRequestPasswordReset}
                disabled={isRequestingReset}
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs py-3 px-6 rounded-full flex items-center gap-2 border-0 shadow-none cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
                {isRequestingReset ? 'Mengirim Permintaan...' : 'Kirim Tautan Reset Kata Sandi'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
