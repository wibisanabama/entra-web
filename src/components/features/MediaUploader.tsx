'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';

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

      const response = await fetch('/api/v1/storage/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Gagal mengupload file');
      }

      const data = await response.json();
      if (data.url) {
        onUploadComplete(data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat upload');
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
        className={`rounded-xl p-8 text-center transition-colors ${
          isDragging 
            ? 'bg-violet-500/10' 
            : error 
              ? 'bg-red-500/5' 
              : 'bg-gray-800/50 hover:bg-gray-800'
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
            <div className="w-12 h-12 rounded-full animate-spin mx-auto"></div>
            <div>
              <p className="text-sm font-medium text-white mb-2">Mengupload... {progress}%</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 cursor-pointer">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-base font-medium text-white">
              Klik atau tarik gambar ke sini
            </p>
            <p className="text-sm text-gray-400">
              Maksimal 5MB (JPG, PNG)
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500 font-medium text-center">{error}</p>
      )}
    </div>
  );
}
