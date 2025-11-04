'use client';

import { Star } from 'lucide-react';
import { ReviewData } from '@/app/(utils)/firebaseOperations';

interface ReviewSummaryProps {
    reviews: ReviewData[];
}

export default function ReviewSummary({ reviews }: ReviewSummaryProps) {
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

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
                <div className="space-y-6">
                    {/* Overall Rating */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Reviews</h2>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</div>
                            <div className="flex flex-col">
                                <div className="flex items-center text-black dark:text-white mb-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className="w-4 h-4"
                                            fill="url(#starGradient)"
                                            stroke="none"
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Based on {reviews.length} reviews</p>
                            </div>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = reviews.filter(r => r.rating === rating).length;
                                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                return (
                                    <div key={rating} className="flex items-center gap-2">
                                        <span className="w-3 text-xs font-medium text-gray-600 dark:text-gray-400">{rating}</span>
                                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                            <div
                                                className="bg-black h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-xs text-gray-600 dark:text-gray-400">{Math.round(percentage)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
