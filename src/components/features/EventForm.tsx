'use client';

import React, { useState } from 'react';
import { Event } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: Partial<Event>) => void;
  isLoading?: boolean;
}

export function EventForm({ initialData, onSubmit, isLoading = false }: EventFormProps) {
  const [formData, setFormData] = useState<Partial<Event>>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    venue_id: initialData?.venue_id || '',
    category_id: initialData?.category_id || '',
    banner_url: initialData?.banner_url || '',
    is_online: initialData?.is_online || false,
    online_url: initialData?.online_url || '',
    max_attendees: initialData?.max_attendees || 0,
  });

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
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Judul Event"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Masukkan judul event"
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="flex w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Jelaskan detail event Anda..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Tanggal Mulai"
            name="start_date"
            type="datetime-local"
            value={formData.start_date as string}
            onChange={handleChange}
            required
          />
          <Input
            label="Tanggal Selesai"
            name="end_date"
            type="datetime-local"
            value={formData.end_date as string}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Kategori
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="flex w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Pilih Kategori</option>
              <option value="cat_1">Musik</option>
              <option value="cat_2">Workshop</option>
              <option value="cat_3">Webinar</option>
              <option value="cat_4">Olahraga</option>
            </select>
          </div>
          <Input
            label="Maksimal Peserta"
            name="max_attendees"
            type="number"
            min="1"
            value={formData.max_attendees || ''}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="is_online"
            name="is_online"
            checked={formData.is_online}
            onChange={handleChange}
            className="rounded bg-gray-800 border-gray-700 text-violet-600 focus:ring-violet-500 focus:ring-offset-gray-900"
          />
          <label htmlFor="is_online" className="text-sm font-medium text-gray-200">
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
          />
        ) : (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Lokasi (Venue)
            </label>
            <select
              name="venue_id"
              value={formData.venue_id || ''}
              onChange={handleChange}
              className="flex w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Pilih Venue</option>
              <option value="ven_1">Stadion Utama</option>
              <option value="ven_2">Gedung Serbaguna</option>
            </select>
          </div>
        )}
        
        <Input
          label="URL Banner"
          name="banner_url"
          type="url"
          value={formData.banner_url || ''}
          onChange={handleChange}
          placeholder="https://... atau gunakan uploader"
        />
      </div>

      <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
        <Button type="button" variant="ghost">Batal</Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialData ? 'Simpan Perubahan' : 'Buat Event'}
        </Button>
      </div>
    </form>
  );
}
