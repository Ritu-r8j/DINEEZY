'use client';

import { useState, useRef } from 'react';
import { X, Loader2, Video, Play, Pause } from 'lucide-react';
import { uploadToCloudinary } from '@/app/(utils)/cloudinary';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string, publicId: string) => void;
  folder?: string;
  className?: string;
}

export default function VideoUpload({ 
  value, 
  onChange, 
  folder = 'menu-videos', 
  className = '' 
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video size should be less than 50MB');
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

      // Upload to Cloudinary using the existing function
      const result = await uploadToCloudinary(
        file,
        (progressValue) => setProgress(progressValue),
        folder
      );

      onChange(result.secure_url, result.public_id);
      setPreview(result.secure_url);
    } catch (err: any) {
      console.error('Upload error:', err);
      let errorMessage = 'Failed to upload video. Please try again.';
      
      // Provide more specific error messages
      if (err.message?.includes('Upload failed')) {
        errorMessage = 'Upload failed. Please check your internet connection and try again.';
      } else if (err.message?.includes('preset')) {
        errorMessage = 'Upload configuration error. Please contact support.';
      } else if (err.message?.includes('size')) {
        errorMessage = 'File size too large. Please use a smaller video file.';
      }
      
      setError(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setIsPlaying(false);
    onChange('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative group">
          <video
            ref={videoRef}
            src={preview}
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
            onEnded={handleVideoEnd}
            muted
            playsInline
          />
          
          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              type="button"
              onClick={togglePlay}
              className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all mr-2"
              disabled={uploading}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </button>
            
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500/80 backdrop-blur-sm text-white rounded-full hover:bg-red-600/80 transition-all"
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
              <div className="text-white text-sm font-medium">{progress}%</div>
              <div className="text-white text-xs mt-1">Converting to MP4...</div>
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
              <span className="text-xs mt-1">Converting to MP4...</span>
            </>
          ) : (
            <>
              <Video className="h-12 w-12 mb-2" />
              <span className="text-sm font-medium">Click to upload video</span>
              <span className="text-xs mt-1">MP4, MOV, AVI up to 50MB</span>
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