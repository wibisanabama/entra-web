'use client';

import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { getCookie } from '@/lib/api';

export interface MediaUploaderProps {
  onUploadComplete: (url: string) => void;
}

export function MediaUploader({ onUploadComplete }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Hanya file JPG dan PNG yang diizinkan');
      return false;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Ukuran file maksimal 5MB');
      return false;
    }
    
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;
    
    setIsUploading(true);
    setProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate progress for UI purposes
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const baseUrl = process.env.NEXT_PUBLIC_STORAGE_API_URL || 'http://localhost:8087';
      const token = getCookie('entra_token');

      const response = await fetch(`${baseUrl}/api/v1/storage/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Gagal mengupload file');
      }

      const data = await response.json();
      const uploadedUrl = data.data?.url || data.url;
      if (uploadedUrl) {
        onUploadComplete(uploadedUrl);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat upload';
      setError(errMsg);
      setProgress(0);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`rounded-3xl p-8 text-center transition-all cursor-pointer border-2 border-dashed select-none ${
          isDragging 
            ? 'border-zinc-950 bg-zinc-100' 
            : error 
              ? 'border-red-300 bg-red-50/50' 
              : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70 hover:border-zinc-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin mx-auto"></div>
            <div>
              <p className="text-xs font-bold text-zinc-950 mb-2">Mengupload... {progress}%</p>
              <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-zinc-950 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mb-3 shadow-xs">
              <Camera className="w-5 h-5 text-zinc-500" />
            </div>
            <p className="text-xs font-bold text-zinc-950 mb-1">
              Klik atau tarik gambar banner ke sini
            </p>
            <p className="text-[11px] text-zinc-400">
              Format JPG, PNG (Maksimal 5MB)
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-xs text-red-600 font-semibold text-center">{error}</p>
      )}
    </div>
  );
}
