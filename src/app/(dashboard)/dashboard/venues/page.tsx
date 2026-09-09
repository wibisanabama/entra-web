'use client';

import { useEffect, useState, useCallback } from 'react';
import { eventApi } from '@/lib/api';
import { Venue } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  Building2,
  Globe,
  AlertCircle,
  MapPinned
} from 'lucide-react';
import { toast } from '@/lib/toast';

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

  const fetchVenues = useCallback(async () => {
    try {
      const res = await eventApi.get<Venue[]>('/api/v1/venues');
      const list: Venue[] = Array.isArray(res.data) ? res.data : [];
      setVenues(list);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      toast.error('Gagal memuat daftar venue & lokasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

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
    } catch (error: unknown) {
      console.error('Venue submit error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal menyimpan venue.';
      toast.error(errMsg);
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
    } catch (error: unknown) {
      console.error('Delete venue error:', error);
      const errMsg = error instanceof Error ? error.message : 'Gagal menghapus venue.';
      toast.error(errMsg);
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
          <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800">
            <Building2 className="h-3.5 w-3.5 text-zinc-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Organizer Space
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">Manajemen Venue & Lokasi</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Kelola lokasi acara, alamat lengkap, denah kapasitas penonton, dan koordinat peta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchVenues}
            disabled={loading}
            className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-5 py-2 flex items-center gap-2 shadow-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Venue Baru
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Venue Terdaftar
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-zinc-950 mb-1">{venues.length}</h3>
              )}
              <p className="text-xs text-zinc-400">Stadion, Hall & Ballroom</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Kota Terjangkau
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-zinc-950 mb-1">{availableCities.length}</h3>
              )}
              <p className="text-xs text-zinc-400">Sebaran wilayah acara</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Globe className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Kapasitas Gabungan
              </p>
              {loading ? (
                <Skeleton className="h-8 w-16 mb-1 rounded-lg" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight text-zinc-950 mb-1">
                  {venues.reduce((acc, v) => acc + (v.capacity || 0), 0).toLocaleString('id-ID')}
                </h3>
              )}
              <p className="text-xs text-zinc-400">Penonton & peserta</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Users className="h-5 w-5" />
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCity === 'ALL'
                ? 'bg-zinc-950 text-white shadow-sm'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            Semua Kota ({venues.length})
          </button>
          {availableCities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCity === city
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {city} ({venues.filter((v) => v.city === city).length})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama venue, alamat..."
            aria-label="Cari nama venue atau alamat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50/80 border border-zinc-200 rounded-full text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
          />
        </div>
      </div>

      {/* Venues Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-white border border-zinc-200/90 rounded-2xl p-6 space-y-4">
              <Skeleton className="h-6 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </Card>
          ))}
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="text-center py-16 bg-white border border-zinc-200 rounded-3xl p-8 space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-zinc-100 rounded-full mx-auto flex items-center justify-center text-zinc-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950">Tidak ada venue ditemukan</h3>
            <p className="text-zinc-500 text-xs max-w-sm mx-auto mt-1">
              {searchQuery || selectedCity !== 'ALL'
                ? 'Coba ubah kata kunci pencarian atau filter kota.'
                : 'Belum ada venue yang terdaftar. Tambahkan lokasi venue pertama Anda sekarang!'}
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold px-5 py-2 mt-2 inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Venue
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <Card
              key={venue.id}
              className="bg-white border border-zinc-200/90 hover:border-zinc-300 transition-all rounded-2xl overflow-hidden flex flex-col justify-between group shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
            >
              <div className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-semibold">
                    {venue.city || 'Indonesia'}
                  </span>

                  <div className="flex items-center gap-1 text-xs text-zinc-600 font-semibold">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{(venue.capacity || 0).toLocaleString('id-ID')} pax</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-950 group-hover:text-zinc-800 transition-colors">
                    {venue.name}
                  </h3>
                  <div className="flex items-start gap-1.5 text-xs text-zinc-500 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-relaxed">
                      {venue.address}
                      {venue.province ? `, ${venue.province}` : ''}
                    </p>
                  </div>
                </div>

                {venue.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 border-t border-zinc-100 pt-2.5">
                    {venue.description}
                  </p>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3.5 bg-zinc-50/60 border-t border-zinc-100 flex items-center justify-between gap-2">
                {venue.latitude && venue.longitude ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-700 hover:text-zinc-950 flex items-center gap-1 font-semibold hover:underline transition-colors"
                  >
                    <MapPinned className="h-3.5 w-3.5 text-zinc-500" />
                    Buka Peta
                  </a>
                ) : (
                  <span className="text-[11px] text-zinc-400 font-mono">ID: {venue.id.substring(0, 8)}</span>
                )}

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(venue)}
                    className="rounded-full border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs px-3 py-1 font-medium"
                    title="Edit Venue"
                  >
                    <Edit2 className="h-3 w-3 mr-1 text-zinc-500" />
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setVenueToDelete(venue);
                      setIsDeleteOpen(true);
                    }}
                    className="rounded-full border-zinc-200 hover:bg-red-50 hover:border-red-200 text-red-600 text-xs px-2.5 py-1"
                    title="Hapus Venue"
                  >
                    <Trash2 className="h-3 w-3" />
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
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Nama Venue <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Istora Senayan / Jakarta Convention Center"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 font-medium text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
                required
              />
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Alamat Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                placeholder="Jl. Pintu Satu Senayan, Gelora, Tanah Abang"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 font-medium text-sm focus:outline-none focus:bg-white focus:border-zinc-400 resize-none transition-colors"
                required
              />
            </div>

            {/* Kota & Provinsi Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Jakarta Pusat"
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 font-medium text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="DKI Jakarta"
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 font-medium text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
                />
              </div>
            </div>

            {/* Kapasitas Penonton */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Kapasitas Maksimal (Orang)
              </label>
              <input
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                placeholder="1000"
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 font-medium text-sm focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
              />
            </div>

            {/* Koordinat Peta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                  placeholder="-6.2088"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 text-xs font-mono focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                  placeholder="106.8456"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 text-xs font-mono focus:outline-none focus:bg-white focus:border-zinc-400 transition-colors"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Catatan Fasilitas / Deskripsi (Opsional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Fasilitas AC sentral, sound system akustik, area parkir luas..."
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-950 font-medium text-xs focus:outline-none focus:bg-white focus:border-zinc-400 resize-none transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium px-4 py-2"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white px-5 py-2 text-xs font-semibold"
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
            <div className="p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-start gap-3 text-red-900 text-sm">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Apakah Anda yakin ingin menghapus venue ini?</p>
                <p className="text-xs text-red-700 mt-1">
                  Venue &quot;{venueToDelete.name}&quot; ({venueToDelete.city}) akan dihapus secara permanen. Pastikan tidak ada event aktif yang mengaitkan venue ini.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-full border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium px-4 py-2"
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteSubmit}
                disabled={deleting}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2"
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
