'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToCloudinary } from '@/app/(utils)/cloudinary';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string, publicId: string) => void;
  folder?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, folder = 'menu-items', className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        file,
        (progressValue) => setProgress(progressValue),
        folder
      );

      onChange(result.secure_url, result.public_id);
      setPreview(result.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
              <div className="text-white text-sm font-medium">{progress}%</div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin mb-2" />
              <span className="text-sm font-medium">Uploading... {progress}%</span>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 mb-2" />
              <span className="text-sm font-medium">Click to upload image</span>
              <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
          <X className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}
