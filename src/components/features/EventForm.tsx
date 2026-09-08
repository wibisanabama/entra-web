'use client';

import React, { useState, useEffect } from 'react';
import { Event, Category, Venue } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { eventApi } from '@/lib/api';
import { toast } from 'sonner';
import { getPgText } from '@/lib/utils';
import { MediaUploader } from '@/components/features/MediaUploader';

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <Input
          label="Judul Event"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Masukkan judul event"
          className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
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
            className="flex w-full rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-950 px-4 py-3 text-sm transition-all focus:outline-none focus:border-zinc-950 focus:bg-white placeholder:text-zinc-400 font-medium"
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
            className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
          />
          <Input
            label="Tanggal Selesai (UTC)"
            name="end_date"
            type="datetime-local"
            value={(formData.end_date as string)?.substring(0, 16)}
            onChange={handleChange}
            required
            className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
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
              className="flex w-full rounded-full bg-zinc-50 border border-zinc-200 text-zinc-950 px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-zinc-950 focus:bg-white disabled:opacity-50 font-medium"
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
            className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="is_online"
            name="is_online"
            checked={formData.is_online}
            onChange={handleChange}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 cursor-pointer"
          />
          <label htmlFor="is_online" className="text-xs font-bold text-zinc-700 uppercase tracking-wider cursor-pointer">
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
            className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2.5 focus:bg-white focus:border-zinc-950"
          />
        ) : (
          <div className="w-full">
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Lokasi (Venue)
            </label>
            <select
              name="venue_id"
              value={formData.venue_id || ''}
              onChange={handleChange}
              disabled={loadingData}
              required={!formData.is_online}
              className="flex w-full rounded-full bg-zinc-50 border border-zinc-200 text-zinc-950 px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-zinc-950 focus:bg-white disabled:opacity-50 font-medium"
            >
              <option value="">Pilih Venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="w-full space-y-2">
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Banner Event
          </label>
          
          {formData.banner_url ? (
            <div className="relative rounded-3xl overflow-hidden border border-zinc-200 bg-zinc-50 group">
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
                  className="bg-white/90 border-zinc-300 text-zinc-900 hover:bg-white rounded-full font-bold text-xs px-4 py-2"
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
                <span className="text-xs text-zinc-400 whitespace-nowrap">Atau masukkan URL:</span>
                <Input
                  name="banner_url"
                  type="url"
                  value={formData.banner_url || ''}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="bg-zinc-50 border-zinc-200 text-zinc-950 rounded-full px-4 py-2 text-xs focus:bg-white focus:border-zinc-950"
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
            className="flex w-full rounded-full bg-zinc-50 border border-zinc-200 text-zinc-950 px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-zinc-950 focus:bg-white font-medium"
          >
            <option value="draft">Draft (Disembunyikan)</option>
            <option value="published">Published (Diterbitkan)</option>
          </select>
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs px-5 py-2.5 font-bold">
            Batal
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isLoading || loadingData} className="bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold text-xs px-6 py-2.5 shadow-sm">
          {initialData ? 'Simpan Perubahan' : 'Buat Event'}
        </Button>
      </div>
    </form>
  );
}
