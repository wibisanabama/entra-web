'use client';

import React, { useState, useEffect } from 'react';
import { Event, Category, Venue } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LocationPickerMap, SelectedLocation } from '@/components/ui/LocationPickerMap';
import { eventApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { getPgText } from '@/lib/utils';
import { MediaUploader } from '@/components/features/MediaUploader';
import { MapPin } from 'lucide-react';

export interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: Partial<Event>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function EventForm({ initialData, onSubmit, onCancel, isLoading = false }: EventFormProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: initialData?.title || '',
    description: getPgText(initialData?.description) || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    venue_id: initialData?.venue_id || '',
    category_id: initialData?.category_id || '',
    banner_url: getPgText(initialData?.banner_url) || '',
    is_online: initialData?.is_online || false,
    online_url: getPgText(initialData?.online_url) || '',
    max_attendees: initialData?.max_attendees || 0,
    status: initialData?.status || 'draft',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Map Picker Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedMapLoc, setSelectedMapLoc] = useState<SelectedLocation | null>(null);
  const [venueNameInput, setVenueNameInput] = useState('');
  const [isSavingVenue, setIsSavingVenue] = useState(false);

  const [prevInitialData, setPrevInitialData] = useState<Event | undefined>(initialData);
  if (initialData && initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData({
      title: initialData.title || '',
      description: getPgText(initialData.description) || '',
      start_date: initialData.start_date || '',
      end_date: initialData.end_date || '',
      venue_id: initialData.venue_id || '',
      category_id: initialData.category_id || '',
      banner_url: getPgText(initialData.banner_url) || '',
      is_online: initialData.is_online || false,
      online_url: getPgText(initialData.online_url) || '',
      max_attendees: initialData.max_attendees || 0,
      status: initialData.status || 'draft',
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, venRes] = await Promise.all([
          eventApi.get<Category[]>('/api/v1/categories'),
          eventApi.get<Venue[]>('/api/v1/venues')
        ]);
        
        if (catRes.data) setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        if (venRes.data) setVenues(Array.isArray(venRes.data) ? venRes.data : []);
      } catch (error) {
        console.error("Failed to fetch form reference data", error);
        toast.error("Gagal memuat kategori dan venue");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format dates for API if needed
    const submitData = { ...formData };
    
    // Convert datetime-local to ISO string
    if (submitData.start_date && !submitData.start_date.includes('T') && submitData.start_date.includes(' ')) {
        // Handle format mismatch if necessary, or just rely on backend parsing
    }
    
    // Ensure numbers
    submitData.max_attendees = Number(submitData.max_attendees);
    
    // Clean up unused fields
    if (submitData.is_online) {
      submitData.venue_id = '';
    } else {
      submitData.online_url = '';
    }
    
    onSubmit(submitData);
  };

  const handleConfirmMapLocation = async () => {
    if (!selectedMapLoc) return;
    try {
      setIsSavingVenue(true);
      const payload = {
        name: (venueNameInput.trim() || selectedMapLoc.name || 'Venue Baru').trim(),
        address: selectedMapLoc.address || `${selectedMapLoc.city}, ${selectedMapLoc.province}`,
        city: selectedMapLoc.city || 'Jakarta',
        province: selectedMapLoc.province || 'DKI Jakarta',
        country: 'Indonesia',
        latitude: selectedMapLoc.latitude,
        longitude: selectedMapLoc.longitude,
        capacity: formData.max_attendees ? Number(formData.max_attendees) : 1000,
        description: 'Lokasi ditentukan via peta interaktif.',
      };

      const res = await eventApi.post<Venue>('/api/v1/venues', payload);
      if (res.data && res.data.id) {
        const newVenue = res.data;
        setVenues((prev) => [newVenue, ...prev]);
        setFormData((prev) => ({ ...prev, venue_id: newVenue.id }));
        toast.success(`Lokasi "${payload.name}" berhasil dipilih!`);
      }
      setIsMapModalOpen(false);
    } catch (err) {
      console.error('Failed to create venue from map:', err);
      toast.error('Gagal menyimpan lokasi venue baru.');
    } finally {
      setIsSavingVenue(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-100 rounded-3xl p-6 sm:p-8 space-y-6 border-0 shadow-none">
        <Input
          label="Judul Event"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Masukkan judul event"
          className="bg-white border-0 shadow-none text-zinc-950 rounded-full px-5 py-3 focus:bg-white focus:ring-0 text-sm font-medium"
        />

        <div className="w-full">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="flex w-full rounded-2xl bg-white border-0 shadow-none text-zinc-950 px-5 py-3.5 text-sm transition-all focus:outline-none focus:ring-0 focus:bg-white placeholder:text-zinc-400 font-medium"
            placeholder="Jelaskan detail event Anda..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tanggal Mulai (UTC)"
            name="start_date"
            type="datetime-local"
            value={(formData.start_date as string)?.substring(0, 16)}
            onChange={handleChange}
            required
            className="bg-white border-0 shadow-none text-zinc-950 rounded-full px-5 py-3 focus:bg-white focus:ring-0 text-sm font-medium"
          />
          <Input
            label="Tanggal Selesai (UTC)"
            name="end_date"
            type="datetime-local"
            value={(formData.end_date as string)?.substring(0, 16)}
            onChange={handleChange}
            required
            className="bg-white border-0 shadow-none text-zinc-950 rounded-full px-5 py-3 focus:bg-white focus:ring-0 text-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Kategori
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              disabled={loadingData}
              required
              className="flex w-full rounded-full bg-white border-0 shadow-none text-zinc-950 px-5 py-3 text-sm transition-all focus:outline-none focus:ring-0 focus:bg-white disabled:opacity-50 font-medium cursor-pointer"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Maksimal Peserta"
            name="max_attendees"
            type="number"
            min="1"
            value={formData.max_attendees || ''}
            onChange={handleChange}
            className="bg-white border-0 shadow-none text-zinc-950 rounded-full px-5 py-3 focus:bg-white focus:ring-0 text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="is_online"
            name="is_online"
            checked={formData.is_online}
            onChange={handleChange}
            className="h-4 w-4 rounded border-0 text-zinc-950 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="is_online" className="text-xs font-bold text-zinc-700 uppercase tracking-wider cursor-pointer select-none">
            Event Online
          </label>
        </div>

        {formData.is_online ? (
          <Input
            label="URL Online Event (Zoom, Meet, dll)"
            name="online_url"
            type="url"
            value={formData.online_url || ''}
            onChange={handleChange}
            placeholder="https://..."
            required
            className="bg-white border-0 shadow-none text-zinc-950 rounded-full px-5 py-3 focus:bg-white focus:ring-0 text-sm font-medium"
          />
        ) : (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Lokasi (Venue)
              </label>
              <button
                type="button"
                onClick={() => {
                  setSelectedMapLoc(null);
                  setVenueNameInput('');
                  setIsMapModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-950 hover:text-zinc-700 bg-white hover:bg-zinc-200 px-3.5 py-1.5 rounded-full transition-all cursor-pointer border-0 shadow-none"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Pilih dari Peta</span>
              </button>
            </div>
            <select
              name="venue_id"
              value={formData.venue_id || ''}
              onChange={handleChange}
              disabled={loadingData}
              required={!formData.is_online}
              className="flex w-full rounded-full bg-white border-0 shadow-none text-zinc-950 px-5 py-3 text-sm transition-all focus:outline-none focus:ring-0 focus:bg-white disabled:opacity-50 font-medium cursor-pointer"
            >
              <option value="">Pilih Venue Terdaftar</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name} - {v.city}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="w-full space-y-2">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Banner Event
          </label>
          
          {formData.banner_url ? (
            <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border-0 shadow-none group">
              <img
                src={formData.banner_url}
                alt="Event Banner Preview"
                className="w-full h-48 sm:h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-white text-zinc-900 hover:bg-zinc-100 border-0 shadow-none rounded-full font-bold text-xs px-4 py-2"
                  onClick={() => setFormData(prev => ({ ...prev, banner_url: '' }))}
                >
                  Hapus / Ganti Banner
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <MediaUploader
                onUploadComplete={(url) => {
                  setFormData(prev => ({ ...prev, banner_url: url }));
                  toast.success('Banner berhasil diunggah!');
                }}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Atau masukkan URL:</span>
                <Input
                  name="banner_url"
                  type="url"
                  value={formData.banner_url || ''}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="bg-white border-0 shadow-none text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:ring-0 font-medium"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-full">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
            Status Event
          </label>
          <select
            name="status"
            value={formData.status || 'draft'}
            onChange={handleChange}
            required
            className="flex w-full rounded-full bg-white border-0 shadow-none text-zinc-950 px-5 py-3 text-sm transition-all focus:outline-none focus:ring-0 focus:bg-white font-medium cursor-pointer"
          >
            <option value="draft">Draft (Disembunyikan)</option>
            <option value="published">Published (Diterbitkan)</option>
          </select>
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-0 shadow-none text-xs px-5 py-2.5 font-bold cursor-pointer">
            Batal
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading || loadingData} className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold text-xs px-6 py-2.5 border-0 shadow-none cursor-pointer">
          {initialData ? 'Simpan Perubahan' : 'Buat Event'}
        </Button>
      </div>

      {isMapModalOpen && (
        <Modal
          isOpen={isMapModalOpen}
          onClose={() => !isSavingVenue && setIsMapModalOpen(false)}
          title="Pilih Lokasi Venue dari Peta"
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">
              Ketik nama gedung/tempat di kotak pencarian atau klik dan geser pin pada peta untuk menentukan titik lokasi.
            </p>

            <LocationPickerMap
              onLocationSelect={(loc) => {
                setSelectedMapLoc(loc);
                if (!venueNameInput) {
                  setVenueNameInput(loc.name);
                }
              }}
              height="300px"
            />

            {selectedMapLoc && (
              <div className="p-4 bg-zinc-100 rounded-2xl space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                    Nama Venue / Gedung
                  </label>
                  <input
                    type="text"
                    value={venueNameInput}
                    onChange={(e) => setVenueNameInput(e.target.value)}
                    placeholder="Contoh: Istora Senayan / Balai Kartini"
                    className="w-full px-4 py-2.5 bg-white rounded-full text-xs font-bold text-zinc-950 border-0 shadow-none focus:outline-none"
                    required
                  />
                </div>
                <div className="text-[11px] text-zinc-500 space-y-0.5">
                  <p><span className="font-semibold text-zinc-700">Alamat:</span> {selectedMapLoc.address || '-'}</p>
                  <p><span className="font-semibold text-zinc-700">Wilayah:</span> {selectedMapLoc.city}, {selectedMapLoc.province}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMapModalOpen(false)}
                disabled={isSavingVenue}
                className="rounded-full text-xs font-bold px-4 py-2 border-0 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shadow-none cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!selectedMapLoc || isSavingVenue}
                isLoading={isSavingVenue}
                onClick={handleConfirmMapLocation}
                className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full text-xs font-bold px-5 py-2 border-0 shadow-none cursor-pointer"
              >
                Gunakan Lokasi Ini
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}
