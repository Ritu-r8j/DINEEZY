'use client';

import { useState, useEffect } from 'react';
import { X, ThumbsUp, ThumbsDown, Play } from 'lucide-react';
import { ReviewData } from '@/app/(utils)/firebaseOperations';
import GradientStar from '@/components/ui/GradientStar';
interface AllReviewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviews: ReviewData[];
    userVotes: {[reviewId: string]: boolean};
    optimisticUpdates: {[reviewId: string]: {helpful: number, notHelpful: number}};
    votingReviews: {[reviewId: string]: boolean};
    onVoteReview: (reviewId: string, isHelpful: boolean) => void;
    formatDate: (timestamp: any) => string;
}

export default function AllReviewsModal({
    isOpen,
    onClose,
    reviews,
    userVotes,
    optimisticUpdates,
    votingReviews,
    onVoteReview,
    formatDate
}: AllReviewsModalProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 10;
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [currentReviewMedia, setCurrentReviewMedia] = useState<any[]>([]);

    // Reset to first page when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
        }
    }, [isOpen]);

    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const currentReviews = reviews.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handleMediaClick = (review: ReviewData, mediaIndex: number) => {
        setCurrentReviewMedia(review.media || []);
        setCurrentMediaIndex(mediaIndex);
        setIsLightboxOpen(true);
    };

    const handleCloseLightbox = () => {
        setIsLightboxOpen(false);
    };

    const handleNavigate = (index: number) => {
        setCurrentMediaIndex(index);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                All Reviews ({reviews.length})
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Showing {startIndex + 1}-{Math.min(endIndex, reviews.length)} of {reviews.length} reviews
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Reviews List */}
                    <div className="overflow-y-auto max-h-[60vh] p-6">
                        <div className="space-y-4">
                            {currentReviews.map((review) => (
                                <div key={review.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            {review.userPhotoURL ? (
                                                <img
                                                    src={review.userPhotoURL}
                                                    alt={review.userName}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-white font-bold text-sm">
                                                    {review.userName.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Review Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{review.userName}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(review.createdAt)}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <GradientStar
                                                            key={star}
                                                            size={14}
                                                            className={star <= review.rating ? 'opacity-100' : 'opacity-30'}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                                                {review.comment}
                                            </p>
                                            
                                            {/* Review Media */}
                                            {review.media && review.media.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {review.media.slice(0, 3).map((media, mediaIndex) => (
                                                            <div 
                                                                key={mediaIndex} 
                                                                className="relative group cursor-pointer"
                                                                onClick={() => handleMediaClick(review, mediaIndex)}
                                                            >
                                                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:shadow-md transition-shadow">
                                                                    {media.type === 'image' ? (
                                                                        <img
                                                                            src={media.url}
                                                                            alt={`Review image ${mediaIndex + 1}`}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                        />
                                                                    ) : (
                                                                        <div className="relative w-full h-full flex items-center justify-center">
                                                                            <video
                                                                                src={media.url}
                                                                                className="w-full h-full object-cover"
                                                                                muted
                                                                                preload="metadata"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none group-hover:bg-black/30 transition-colors">
                                                                                <Play className="w-4 h-4 text-white opacity-80 group-hover:scale-110 transition-transform" />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Show more indicator for additional media */}
                                                                {mediaIndex === 2 && review.media && review.media.length > 3 && (
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                                                        <span className="text-white font-bold text-sm">
                                                                            +{review.media.length - 3}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Vote Buttons */}
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => onVoteReview(review.id, true)}
                                                    disabled={votingReviews[review.id]}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                                        userVotes[review.id] === true 
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    {optimisticUpdates[review.id]?.helpful ?? (review.helpful || 0)}
                                                </button>
                                                <button 
                                                    onClick={() => onVoteReview(review.id, false)}
                                                    disabled={votingReviews[review.id]}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                                        userVotes[review.id] === false 
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                    {optimisticUpdates[review.id]?.notHelpful ?? (review.notHelpful || 0)}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                                            currentPage === page
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

           
        </div>
    );
}
