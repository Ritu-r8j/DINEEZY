'use client';

import { useState } from 'react';
import { Camera, Video, Play, X, Upload } from 'lucide-react';

interface MediaPreview {
    file: File;
    preview: string;
    type: 'image' | 'video';
}

interface MediaUploadProps {
    onMediaSelect: (files: File[]) => void;
    onMediaRemove: (index: number) => void;
    mediaPreviews: MediaPreview[];
    uploadingMedia: boolean;
    uploadProgress: number;
}

export default function MediaUpload({ 
    onMediaSelect, 
    onMediaRemove, 
    mediaPreviews, 
    uploadingMedia, 
    uploadProgress 
}: MediaUploadProps) {
    const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const validFiles = files.filter(file => {
            const isValidImage = file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024; // 10MB
            const isValidVideo = file.type.startsWith('video/') && file.size <= 100 * 1024 * 1024; // 100MB
            return isValidImage || isValidVideo;
        });

        if (validFiles.length !== files.length) {
            // You might want to show an error message here
            console.warn('Some files were rejected. Images must be under 10MB and videos under 100MB.');
        }

        onMediaSelect(validFiles);
    };

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Add Photos & Videos (Optional)
            </label>
            
            {/* Media Upload Button */}
            <div className="flex items-center gap-4 mb-4">
                <input
                    type="file"
                    id="media-upload"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaSelect}
                    className="hidden"
                />
                <label
                    htmlFor="media-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                >
                    <Camera className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Photos</span>
                </label>
                <label
                    htmlFor="media-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                >
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Videos</span>
                </label>
            </div>

            {/* Media Previews */}
            {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mediaPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                {preview.type === 'image' ? (
                                    <img
                                        src={preview.preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <video
                                            src={preview.preview}
                                            className="w-full h-full object-cover"
                                            muted
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Play className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => onMediaRemove(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Progress */}
            {uploadingMedia && (
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Upload className="w-4 h-4 animate-pulse" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Uploading media... {uploadProgress}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Images: max 10MB each. Videos: max 100MB each. You can add up to 6 files.
            </p>
        </div>
    );
}
