'use client';

import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import MediaUpload from './MediaUpload';
import { uploadToCloudinary } from '@/app/(utils)/cloudinary';
import { ReviewMedia } from '@/app/(utils)/firebaseOperations';

interface ReviewFormProps {
    onSubmit: (reviewData: {
        rating: number;
        comment: string;
        media: ReviewMedia[];
    }) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    error: string | null;
}

export default function ReviewForm({ onSubmit, onCancel, isSubmitting, error }: ReviewFormProps) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<{file: File, preview: string, type: 'image' | 'video'}[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleMediaSelect = (files: File[]) => {
        const newPreviews = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
        }));

        setMediaPreviews(prev => [...prev, ...newPreviews]);
        setSelectedMedia(prev => [...prev, ...files]);
    };

    const handleMediaRemove = (index: number) => {
        setMediaPreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index].preview);
            newPreviews.splice(index, 1);
            return newPreviews;
        });
        setSelectedMedia(prev => {
            const newFiles = [...prev];
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const uploadMedia = async (): Promise<ReviewMedia[]> => {
        if (selectedMedia.length === 0) return [];

        setUploadingMedia(true);
        setUploadProgress(0);

        try {
            const uploadPromises = selectedMedia.map(async (file, index) => {
                const result = await uploadToCloudinary(
                    file,
                    (progress) => {
                        setUploadProgress(prev => {
                            const totalProgress = (index / selectedMedia.length) * 100 + (progress / selectedMedia.length);
                            return Math.round(totalProgress);
                        });
                    },
                    'restaurant-reviews'
                );

                return {
                    id: `${Date.now()}-${index}`,
                    type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
                    url: result.secure_url,
                    thumbnailUrl: result.resource_type === 'video' ? result.secure_url.replace(/\.(mp4|mov|avi)$/, '.jpg') : undefined,
                    publicId: result.public_id,
                    originalFilename: result.original_filename,
                    format: result.format,
                    uploadedAt: new Date()
                };
            });

            const uploadedMedia = await Promise.all(uploadPromises);
            return uploadedMedia;
        } catch (error) {
            console.error('Error uploading media:', error);
            throw error;
        } finally {
            setUploadingMedia(false);
            setUploadProgress(0);
        }
    };

    const handleSubmit = async () => {
        if (!comment.trim()) return;

        try {
            const uploadedMedia = await uploadMedia();
            
            await onSubmit({
                rating,
                comment: comment.trim(),
                media: uploadedMedia
            });

            // Reset form
            setRating(5);
            setComment('');
            setSelectedMedia([]);
            setMediaPreviews([]);
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    return (
        <div>
            {/* SVG Gradient Definition for Stars */}
            <svg className="absolute w-0 h-0" aria-hidden="true">
                <defs>
                    <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#b8dcff" />
                        <stop offset="50%" stopColor="#c9cbff" />
                        <stop offset="100%" stopColor="#e5c0ff" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Write a Review</h3>
            
            {/* Star Rating */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                </label>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="text-2xl transition-colors"
                        >
                            <Star
                                className="w-6 h-6"
                                fill={star <= rating ? "url(#starGradient)" : "none"}
                                stroke={star <= rating ? "url(#starGradient)" : "currentColor"}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Comment Input */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Review
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this dish..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm sm:text-base"
                    rows={3}
                />
            </div>

            {/* Media Upload */}
            <MediaUpload
                onMediaSelect={handleMediaSelect}
                onMediaRemove={handleMediaRemove}
                mediaPreviews={mediaPreviews}
                uploadingMedia={uploadingMedia}
                uploadProgress={uploadProgress}
            />

            {/* Error Message */}
            {error && (
                <div className="mb-4 text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || uploadingMedia}
                    className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Submit Review
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm"
                >
                    Cancel
                </button>
            </div>
        </div>
        </div>
    );
}
