'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaUploader } from '@/components/features/MediaUploader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { storageApi } from '@/lib/api';
import { toast } from '@/lib/toast';
import { MediaFile } from '@/types';

export default function DashboardMediaPage() {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await storageApi.get<MediaFile[]>('/api/v1/storage/media');
      if (res.data) {
        setImages(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch media', error);
      toast.error('Gagal memuat media library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUploadSuccess = () => {
    fetchMedia();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL disalin ke clipboard!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">Media Library</h1>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">Unggah dan kelola gambar banner serta aset media untuk event Anda.</p>
      </div>

      <Card className="bg-zinc-100 rounded-3xl p-6 space-y-4 border-0 shadow-none">
        <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider pb-2 border-b border-zinc-200/50">
          Unggah Media Baru
        </h2>
        <MediaUploader onUploadComplete={handleUploadSuccess} />
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-950">Galeri Media</h2>
          <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold border-0 shadow-none">
            {images.length} File
          </span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 bg-zinc-100 rounded-3xl animate-pulse border-0 shadow-none" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-zinc-400 bg-zinc-100 p-12 rounded-3xl text-center border-0 shadow-none">
            <p className="text-sm font-semibold text-zinc-900">Belum ada media yang diunggah.</p>
            <p className="text-xs text-zinc-400 mt-1">Unggah gambar di atas untuk menggunakannya pada event Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="bg-zinc-100 rounded-3xl overflow-hidden border-0 shadow-none">
                <div className="relative h-44 bg-zinc-200/50 overflow-hidden">
                  <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-950 truncate" title={image.name}>{image.name}</p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{image.size}</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-full bg-white hover:bg-zinc-200 text-zinc-800 text-xs font-bold px-3.5 py-1.5 h-8 border-0 shadow-none shrink-0 cursor-pointer"
                    onClick={() => copyToClipboard(image.url)}
                  >
                    Salin URL
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
