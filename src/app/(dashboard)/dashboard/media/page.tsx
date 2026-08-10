'use client';

import { useState, useEffect } from 'react';
import { MediaUploader } from '@/components/features/MediaUploader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { storageApi } from '@/lib/api';
import { toast } from 'sonner';

export default function DashboardMediaPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await storageApi.get('/api/v1/storage/media');
      if (res.data) {
        setImages(res.data as any[]);
      }
    } catch (error) {
      console.error('Failed to fetch media', error);
      toast.error('Gagal memuat media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUploadSuccess = (url: string) => {
    // Refresh the list after upload to get accurate size and name from the server
    fetchMedia();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('URL disalin ke clipboard!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
        <p className="text-gray-400">Unggah dan kelola gambar untuk event Anda.</p>
      </div>

      <Card className="bg-gray-900 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Unggah Media Baru</h2>
        <MediaUploader onUploadComplete={handleUploadSuccess} />
      </Card>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Galeri Media</h2>
        
        {loading ? (
          <div className="text-gray-400">Memuat media...</div>
        ) : images.length === 0 ? (
          <div className="text-gray-500 bg-gray-900/50 p-8 rounded-xl text-center border border-dashed border-gray-800">
            Belum ada media yang diunggah.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <Card key={image.id} className="bg-gray-900 overflow-hidden group">
                <div className="relative h-40 bg-gray-800">
                  <img src={image.url} alt={image.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="sm" 
                      className="bg-[#7C3AED] hover:bg-[#4F46E5] text-white"
                      onClick={() => copyToClipboard(image.url)}
                    >
                      Salin URL
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white truncate" title={image.name}>{image.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{image.size}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
