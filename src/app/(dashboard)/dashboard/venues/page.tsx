'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { eventApi } from '@/lib/api';
import { Venue } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Users,
  Navigation,
  Building2,
  Globe,
  ExternalLink,
  Sparkles,
  AlertCircle,
  MapPinned
} from 'lucide-react';
import { toast } from 'sonner';

interface VenueFormData {
  id?: string;
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  capacity: number;
  description: string;
}

const initialForm: VenueFormData = {
  name: '',
  address: '',
  city: 'Jakarta',
  province: 'DKI Jakarta',
  country: 'Indonesia',
  latitude: -6.2088,
  longitude: 106.8456,
  capacity: 1000,
  description: '',
};

export default function VenuesManagementPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VenueFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const res = await eventApi.get('/api/v1/venues');
      const list: Venue[] = Array.isArray(res.data) ? res.data : [];
      setVenues(list);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      toast.error('Gagal memuat daftar venue & lokasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleOpenCreate = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (venue: Venue) => {
    setFormData({
      id: venue.id,
      name: venue.name || '',
      address: venue.address || '',
      city: venue.city || '',
      province: venue.province || '',
      country: venue.country || 'Indonesia',
      latitude: venue.latitude || 0,
      longitude: venue.longitude || 0,
      capacity: venue.capacity || 0,
      description: venue.description || '',
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Nama dan alamat venue wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && formData.id) {
        await eventApi.put(`/api/v1/venues/${formData.id}`, formData);
        toast.success(`Venue "${formData.name}" berhasil diperbarui!`);
      } else {
        await eventApi.post('/api/v1/venues', formData);
        toast.success(`Venue "${formData.name}" berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
      fetchVenues();
    } catch (error: any) {
      console.error('Venue submit error:', error);
      toast.error(error.response?.data?.message || error.message || 'Gagal menyimpan venue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!venueToDelete) return;
    try {
      setDeleting(true);
      await eventApi.delete(`/api/v1/venues/${venueToDelete.id}`);
      toast.success(`Venue "${venueToDelete.name}" berhasil dihapus.`);
      setIsDeleteOpen(false);
      setVenueToDelete(null);
      fetchVenues();
    } catch (error: any) {
      console.error('Delete venue error:', error);
      toast.error(error.response?.data?.message || error.message || 'Gagal menghapus venue.');
    } finally {
      setDeleting(false);
    }
  };

  // Cities List for Filter
  const availableCities = Array.from(
    new Set(venues.map((v) => v.city).filter((c): c is string => Boolean(c && c.trim())))
  );

  // Filtered Venues
  const filteredVenues = venues.filter((v) => {
    const matchesCity = selectedCity === 'ALL' || v.city?.toLowerCase() === selectedCity.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      v.name?.toLowerCase().includes(query) ||
      v.address?.toLowerCase().includes(query) ||
      v.city?.toLowerCase().includes(query) ||
      v.province?.toLowerCase().includes(query);

    return matchesCity && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-violet-600/20 text-violet-400 rounded-lg">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
              Organizer Space
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Manajemen Venue & Lokasi</h1>
          <p className="text-gray-400 text-sm mt-1">
            Kelola lokasi acara, alamat lengkap, denah kapasitas penonton, dan koordinat peta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchVenues}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2 font-bold"
          >
            <Plus className="h-4 w-4" />
            Tambah Venue Baru
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                Total Venue Terdaftar
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <h3 className="text-3xl font-bold text-white mb-1">{venues.length}</h3>
              )}
              <p className="text-xs text-gray-500">Stadion, Hall & Ballroom</p>
            </div>
            <div className="p-3 bg-violet-600/20 text-violet-400 rounded-xl">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                Kota Terjangkau
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <h3 className="text-3xl font-bold text-white mb-1">{availableCities.length}</h3>
              )}
              <p className="text-xs text-gray-500">Sebaran wilayah acara</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Globe className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                Total Kapasitas Gabungan
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <h3 className="text-3xl font-bold text-white mb-1">
                  {venues.reduce((acc, v) => acc + (v.capacity || 0), 0).toLocaleString('id-ID')}
                </h3>
              )}
              <p className="text-xs text-gray-500">Penonton & peserta</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* City Filter Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setSelectedCity('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCity === 'ALL'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            Semua Kota ({venues.length})
          </button>
          {availableCities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCity === city
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {city} ({venues.filter((v) => v.city === city).length})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Cari nama venue, alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Venues Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800 p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 space-y-4">
          <div className="p-4 bg-gray-800/60 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-gray-500">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Tidak ada venue ditemukan</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mt-1">
              {searchQuery || selectedCity !== 'ALL'
                ? 'Coba ubah kata kunci pencarian atau filter kota.'
                : 'Belum ada venue yang terdaftar. Tambahkan lokasi venue pertama Anda sekarang!'}
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold mt-2"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Venue
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <Card
              key={venue.id}
              className="bg-gray-900 border-gray-800 hover:border-violet-500/50 transition-all rounded-2xl overflow-hidden flex flex-col justify-between group shadow-lg"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="text-[11px]">
                    {venue.city || 'Indonesia'}
                  </Badge>

                  <div className="flex items-center gap-1 text-xs text-violet-400 font-semibold">
                    <Users className="h-3.5 w-3.5" />
                    <span>{(venue.capacity || 0).toLocaleString('id-ID')} pax</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    {venue.name}
                  </h3>
                  <div className="flex items-start gap-2 text-xs text-gray-400 mt-2">
                    <MapPin className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-relaxed">
                      {venue.address}
                      {venue.province ? `, ${venue.province}` : ''}
                    </p>
                  </div>
                </div>

                {venue.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 border-t border-gray-800/80 pt-3">
                    {venue.description}
                  </p>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-4 bg-gray-950/60 border-t border-gray-800 flex items-center justify-between gap-2">
                {venue.latitude && venue.longitude ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition-colors"
                  >
                    <MapPinned className="h-3.5 w-3.5" />
                    Buka Peta
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-600 font-mono">ID: {venue.id.substring(0, 8)}</span>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(venue)}
                    className="border-gray-800 hover:bg-gray-800 text-gray-300 text-xs px-2.5"
                    title="Edit Venue"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-violet-400 mr-1" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setVenueToDelete(venue);
                      setIsDeleteOpen(true);
                    }}
                    className="border-gray-800 hover:bg-red-950/40 hover:border-red-800/50 text-red-400 text-xs px-2.5"
                    title="Hapus Venue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: Tambah / Edit Venue */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !submitting && setIsModalOpen(false)}
          title={isEditing ? 'Edit Informasi Venue' : 'Tambah Venue Baru'}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Nama Venue */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Nama Venue <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Istora Senayan / Jakarta Convention Center"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Alamat Lengkap <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="Jl. Pintu Satu Senayan, Gelora, Tanah Abang"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-violet-500 resize-none text-sm"
                required
              />
            </div>

            {/* Kota & Provinsi Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Jakarta Pusat"
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="DKI Jakarta"
                  className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-violet-500 text-sm"
                />
              </div>
            </div>

            {/* Kapasitas Penonton */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Kapasitas Maksimal (Orang)
              </label>
              <input
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                placeholder="1000"
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Koordinat Peta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  placeholder="-6.2088"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  placeholder="106.8456"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Catatan Fasilitas / Deskripsi (Opsional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Fasilitas AC sentral, sound system akustik, area parkir luas..."
                className="w-full px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-white font-medium focus:outline-none focus:border-violet-500 resize-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-violet-600 hover:bg-violet-700 text-white px-6 font-bold"
              >
                {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Venue'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Konfirmasi Hapus Venue */}
      {isDeleteOpen && venueToDelete && (
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => !deleting && setIsDeleteOpen(false)}
          title="Konfirmasi Hapus Venue"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl flex items-start gap-3 text-red-300 text-sm">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Apakah Anda yakin ingin menghapus venue ini?</p>
                <p className="text-xs text-red-400/80 mt-1">
                  Venue &quot;{venueToDelete.name}&quot; ({venueToDelete.city}) akan dihapus secara permanen. Pastikan tidak ada event aktif yang mengaitkan venue ini.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setIsDeleteOpen(false)}
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteSubmit}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {deleting ? 'Menghapus...' : 'Hapus Venue'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
