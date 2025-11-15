'use client';

import { MessageCircle, X, Camera, ChevronRight, Edit3, Trash2, Star } from 'lucide-react';
import GradientStar from '@/components/ui/GradientStar';
import { RestaurantReviewData } from '@/app/(utils)/firebaseOperations';

interface ReviewsSectionProps {
  reviews: RestaurantReviewData[];
  user: any;
  showAllReviews: boolean;
  showReviewForm: boolean;
  editingReview: RestaurantReviewData | null;
  reviewForm: { rating: number; comment: string };
  reviewMedia: File[];
  isSubmittingReview: boolean;
  error: string | null;
  onShowReviewForm: () => void;
  onCloseReviewForm: () => void;
  onReviewFormChange: (form: { rating: number; comment: string }) => void;
  onMediaSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveMedia: (index: number) => void;
  onSubmitReview: () => void;
  onEditReview: (review: RestaurantReviewData) => void;
  onDeleteReview: (reviewId: string) => void;
  getTimeAgo: (date: Date) => string;
}

export default function ReviewsSection({
  reviews,
  user,
  showAllReviews,
  showReviewForm,
  editingReview,
  reviewForm,
  reviewMedia,
  isSubmittingReview,
  error,
  onShowReviewForm,
  onCloseReviewForm,
  onReviewFormChange,
  onMediaSelect,
  onRemoveMedia,
  onSubmitReview,
  onEditReview,
  onDeleteReview,
  getTimeAgo
}: ReviewsSectionProps) {
  // Star Rating Component
  const StarRating = ({ rating, onRatingChange, readonly = false, size = 'default' }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'small' | 'default' | 'large';
  }) => {
    const sizeClasses = {
      small: 16,
      default: 20,
      large: 24
    };

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange?.(star)}
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              } transition-transform duration-200`}
          >
            <GradientStar
              size={sizeClasses[size]}
              className={star <= rating ? 'opacity-100' : 'opacity-30'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="bg-white dark:bg-[#0f1419] rounded-lg">
      {/* Reviews Header */}
      <div className="p-4 sm:p-6 pb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Reviews
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseReviewForm}
          />
          <div className="relative bg-white dark:bg-[#0f1419] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingReview ? 'Edit Review' : 'Write a Review'}
                </h3>
                <button
                  onClick={onCloseReviewForm}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Rating Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    How was your experience?
                  </label>
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={reviewForm.rating}
                      onRatingChange={(rating) => onReviewFormChange({ ...reviewForm, rating })}
                      size="large"
                    />
                    {reviewForm.rating > 0 && (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {reviewForm.rating === 1 && 'Poor'}
                        {reviewForm.rating === 2 && 'Fair'}
                        {reviewForm.rating === 3 && 'Good'}
                        {reviewForm.rating === 4 && 'Very Good'}
                        {reviewForm.rating === 5 && 'Excellent'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comment Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Share your experience
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => onReviewFormChange({ ...reviewForm, comment: e.target.value })}
                    placeholder="Tell others about your experience at this restaurant..."
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-background/70 border border-gray-200 dark:border-foreground/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9cbff] focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all dark:hover:border-primary/20"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Minimum 10 characters
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {reviewForm.comment.length}/500
                    </span>
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Add Photos
                  </label>

                  {/* Upload Area */}
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onMediaSelect}
                      className="hidden"
                      id="review-photos"
                    />

                    {/* Photo Grid */}
                    <div className="grid grid-cols-4 gap-3">
                      {/* Existing Photos */}
                      {reviewMedia.map((file, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-background/70 border border-gray-200 dark:border-foreground/5">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => onRemoveMedia(index)}
                            className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add Photo Button */}
                      {reviewMedia.length < 4 && (
                        <label
                          htmlFor="review-photos"
                          className="aspect-square border-2 border-dashed border-[#b8dcff80] dark:border-[#c9cbff80] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#c9cbff] dark:hover:border-[#e5c0ff] transition-colors bg-gradient-to-br from-[#b8dcff20] via-[#c9cbff20] to-[#e5c0ff20]"
                        >
                          <Camera className="w-6 h-6 text-[#7c3aed] mb-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-1">
                            Add photo
                          </span>
                        </label>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Add up to 4 photos (Max 10MB each)
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onCloseReviewForm}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSubmitReview}
                    disabled={isSubmittingReview || reviewForm.rating === 0 || !reviewForm.comment.trim() || reviewForm.comment.length < 10}
                    className="flex-1 px-6 py-3 bg-gradient-to-br from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-gray-900 dark:text-white rounded-xl hover:shadow-md disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2 font-medium"
                  >
                    {isSubmittingReview ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white" />
                        {editingReview ? 'Updating...' : 'Publishing...'}
                      </>
                    ) : (
                      <>
                        {editingReview ? 'Update Review' : 'Publish Review'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List - Horizontal Scroll */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          <>
            {/* Scroll Indicator */}
            {reviews.length > 1 && (
              <div className="px-4 sm:px-6">
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Scroll to see more reviews
                </p>
              </div>
            )}

            {/* Horizontal Scrolling Reviews */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 sm:px-6 pb-4 first:pl-4 last:pr-4">
                {reviews.map((review, index) => {
                  const isCurrentUser = user && review.userId === user.uid;
                  return (
                    <div key={review.id} className={`flex-shrink-0 w-80 rounded-2xl p-4 border ${isCurrentUser
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-background/70 border-gray-100 dark:border-foreground/5'
                      } ${index === 0 ? 'ml-0' : ''} ${index === reviews.length - 1 ? 'mr-4' : ''}`}>
                      {/* Review Header */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* User Avatar */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={review.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName || 'User')}&background=4F46E5&color=fff`}
                            alt={review.userName || 'User'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700"
                            onError={(e) => {
                              // Fallback to a default avatar if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName || 'User')}&background=6B7280&color=fff`;
                            }}
                          />
                          {review.isVerified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1 min-w-0">
                          {/* User Info and Rating */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                  {(() => {
                                    if (review.userName && review.userName.trim()) {
                                      return review.userName;
                                    }
                                    if (isCurrentUser && user) {
                                      if (user.displayName) return user.displayName;
                                      if (user.email) {
                                        const emailName = user.email.split('@')[0];
                                        return emailName.split('.').map((part: string) =>
                                          part.charAt(0).toUpperCase() + part.slice(1)
                                        ).join(' ');
                                      }
                                      return 'You';
                                    }
                                    return 'Anonymous';
                                  })()}
                                </h4>
                                {isCurrentUser && (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                {review.rating}
                                <Star className="w-3 h-3 ml-1" fill="url(#starGradient)" stroke="none" />
                              </div>
                            </div>

                            {/* User Actions */}
                            {user && review.userId === user.uid && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onEditReview(review)}
                                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
                                  title="Edit review"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                </button>
                                <button
                                  onClick={() => onDeleteReview(review.id)}
                                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors cursor-pointer"
                                  title="Delete review"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Time */}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            {(() => {
                              try {
                                if (review.createdAt) {
                                  // Handle Firebase Timestamp
                                  if (typeof review.createdAt === 'object' && 'seconds' in review.createdAt) {
                                    return getTimeAgo(new Date(review.createdAt.seconds * 1000));
                                  }
                                  // Handle regular Date
                                  if (review.createdAt instanceof Date) {
                                    return getTimeAgo(review.createdAt);
                                  }
                                  // Handle string date
                                  if (typeof review.createdAt === 'string') {
                                    return getTimeAgo(new Date(review.createdAt));
                                  }
                                  // Handle timestamp number
                                  if (typeof review.createdAt === 'number') {
                                    return getTimeAgo(new Date(review.createdAt));
                                  }
                                }
                                return 'Recently';
                              } catch (error) {
                                console.warn('Error parsing review date:', error);
                                return 'Recently';
                              }
                            })()}
                          </p>

                          {/* Review Text */}
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-4">
                            {review.comment || 'No comment provided'}
                          </p>

                          {/* Review Images */}
                          {review.media && review.media.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {review.media.slice(0, 3).map((mediaItem, index) => (
                                <div key={mediaItem.id || index} className="relative aspect-square">
                                  <img
                                    src={mediaItem.url}
                                    alt={`Review photo ${index + 1}`}
                                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  />
                                  {index === 2 && review.media && review.media.length > 3 && (
                                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                                      <span className="text-white text-xs font-medium">
                                        +{review.media.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* See All Reviews Button */}
            {reviews.length > 5 && (
              <div className="px-4 sm:px-6">
                <button
                  onClick={() => {/* Handle show all reviews */ }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-[#b8dcff80] via-[#c9cbff80] to-[#e5c0ff80] hover:shadow-md font-medium text-sm transition-all cursor-pointer rounded-xl"
                >
                  See all {reviews.length} reviews
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12 px-4 sm:px-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-background/70 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-foreground/5">
              <MessageCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reviews yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Be the first to share your experience!</p>
          </div>
        )}

        {/* Write Review Button */}
        <div className="px-4 sm:px-6 pb-4">
          <button
            onClick={onShowReviewForm}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-[#b8dcff80] via-[#c9cbff80] to-[#e5c0ff80] hover:shadow-md rounded-xl font-medium text-sm transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Leave a review
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}