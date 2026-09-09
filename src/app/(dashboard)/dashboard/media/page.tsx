'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaUploader } from '@/components/features/MediaUploader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { storageApi } from '@/lib/api';
import { toast } from 'sonner';
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800">
          <span className="text-xs font-bold uppercase tracking-wider">Asset Storage</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 mb-1">Media Library</h1>
        <p className="text-zinc-500 text-sm">Unggah dan kelola gambar banner serta aset media untuk event Anda.</p>
      </div>

      <Card className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <h2 className="text-sm font-bold text-zinc-950 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-100">
          Unggah Media Baru
        </h2>
        <MediaUploader onUploadComplete={handleUploadSuccess} />
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-950">Galeri Media</h2>
          <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-semibold">
            {images.length} File
          </span>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 bg-zinc-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-zinc-400 bg-white p-12 rounded-3xl text-center border border-dashed border-zinc-200 shadow-sm">
            <p className="text-sm font-medium">Belum ada media yang diunggah.</p>
            <p className="text-xs text-zinc-400 mt-1">Unggah gambar di atas untuk menggunakannya pada event Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {images.map((image) => (
              <Card key={image.id} className="bg-white border border-zinc-200/90 rounded-2xl overflow-hidden group shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-zinc-300 transition-all">
                <div className="relative h-44 bg-zinc-100 overflow-hidden">
                  <img src={image.url} alt={image.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                    <Button 
                      size="sm" 
                      className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold px-4 py-2 shadow-none"
                      onClick={() => copyToClipboard(image.url)}
                    >
                      Salin URL
                    </Button>
                  </div>
                </div>
                <div className="p-3.5 bg-white border-t border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-900 truncate" title={image.name}>{image.name}</p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{image.size}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
