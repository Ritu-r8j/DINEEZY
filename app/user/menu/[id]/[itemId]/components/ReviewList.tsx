'use client';

import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Play, Eye } from 'lucide-react';
import { ReviewData } from '@/app/(utils)/firebaseOperations';
import { useState } from 'react';
import GradientStar from '@/components/ui/GradientStar';

interface ReviewListProps {
    reviews: ReviewData[];
    userVotes: {[reviewId: string]: boolean};
    optimisticUpdates: {[reviewId: string]: {helpful: number, notHelpful: number}};
    votingReviews: {[reviewId: string]: boolean};
    onVoteReview: (reviewId: string, isHelpful: boolean) => void;
    formatDate: (timestamp: any) => string;
    onViewAllReviews: () => void;
}

export default function ReviewList({
    reviews,
    userVotes,
    optimisticUpdates,
    votingReviews,
    onVoteReview,
    formatDate,
    onViewAllReviews
}: ReviewListProps) {
    const displayedReviews = reviews.slice(0, 10);
    const hasMoreReviews = reviews.length > 10;
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [currentReviewMedia, setCurrentReviewMedia] = useState<any[]>([]);

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

    return (
        <div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
            >
            {displayedReviews.map((review, index) => (
                <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 xs:p-5 shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300 group"
                >
                    <div className="flex items-start gap-3 xs:gap-4">
                        {/* Avatar */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: index * 0.1 + 0.1 }}
                            className="w-10 h-10 xs:w-12 xs:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow"
                        >
                            {review.userPhotoURL ? (
                                <img
                                    src={review.userPhotoURL}
                                    alt={review.userName}
                                    className="w-10 h-10 xs:w-12 xs:h-12 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-bold text-sm xs:text-lg">
                                    {review.userName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </motion.div>
                        
                        {/* Review Content */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                            className="flex-1 min-w-0"
                        >
                            <div className="flex items-start xs:items-center justify-between mb-2 xs:mb-3 gap-2">
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm xs:text-base truncate">{review.userName}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formatDate(review.createdAt)}</p>
                                </div>
                                <div className="flex items-center flex-shrink-0">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <GradientStar
                                            key={star}
                                            size={16}
                                            className={star <= review.rating ? 'opacity-100' : 'opacity-30'}
                                        />
                                    ))}
                                </div>
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
                                className="text-gray-700 dark:text-gray-300 text-sm xs:text-base leading-relaxed mb-3 xs:mb-4"
                            >
                                {review.comment}
                            </motion.p>
                            
                            {/* Review Media */}
                            {review.media && review.media.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 + 0.4 }}
                                    className="mb-3 xs:mb-4"
                                >
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 xs:gap-3">
                                        {review.media.slice(0, 5).map((media, mediaIndex) => (
                                            <motion.div
                                                key={mediaIndex}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 + 0.4 + mediaIndex * 0.05 }}
                                                whileHover={{ scale: 1.03 }}
                                                className="relative group cursor-pointer"
                                                onClick={() => handleMediaClick(review, mediaIndex)}
                                            >
                                                <div className="aspect-square rounded-lg xs:rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm group-hover:shadow-md transition-shadow">
                                                    {media.type === 'image' ? (
                                                        <img
                                                            src={media.url}
                                                            alt={`Review image ${mediaIndex + 1}`}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="relative w-full h-full flex items-center justify-center">
                                                            <video
                                                                src={media.url}
                                                                className="w-full h-full object-cover relative z-10"
                                                                muted
                                                                preload="metadata"
                                                                style={{ zIndex: 10 }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none z-20 group-hover:bg-black/30 transition-colors">
                                                                <Play className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white opacity-80 group-hover:scale-110 transition-transform" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Show more indicator for additional media */}
                                                {mediaIndex === 4 && review.media && review.media.length > 5 && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg xs:rounded-xl">
                                                        <span className="text-white font-bold text-xs xs:text-sm">
                                                            +{review.media.length - 5}
                                                        </span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                            
                            {/* Vote Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
                                className="flex items-center gap-2 xs:gap-3"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onVoteReview(review.id, true)}
                                    disabled={votingReviews[review.id]}
                                    className={`flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                                        userVotes[review.id] === true
                                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-300 border border-green-200/50 dark:border-green-700/50'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <ThumbsUp className="w-3 h-3 xs:w-4 xs:h-4" />
                                    <span className="font-bold">{optimisticUpdates[review.id]?.helpful ?? (review.helpful || 0)}</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onVoteReview(review.id, false)}
                                    disabled={votingReviews[review.id]}
                                    className={`flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                                        userVotes[review.id] === false
                                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-300 border border-red-200/50 dark:border-red-700/50'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    <ThumbsDown className="w-3 h-3 xs:w-4 xs:h-4" />
                                    <span className="font-bold">{optimisticUpdates[review.id]?.notHelpful ?? (review.notHelpful || 0)}</span>
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            ))}
            
            {/* View All Reviews Button */}
            {hasMoreReviews && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: displayedReviews.length * 0.1 }}
                    className="flex justify-center pt-6"
                >
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={onViewAllReviews}
                        className="flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 text-white dark:from-white dark:via-gray-100 dark:to-white dark:text-gray-900 dark:hover:from-gray-100 dark:hover:via-gray-50 dark:hover:to-gray-100 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                        <Eye className="w-5 h-5" />
                        <span>View All Reviews ({reviews.length})</span>
                    </motion.button>
                </motion.div>
            )}


        </motion.div>
        </div>
    );
}
