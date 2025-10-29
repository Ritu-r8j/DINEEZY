'use client';

import { useState, useEffect } from 'react';
import { Play, Image as ImageIcon, Eye, X, ChevronLeft, ChevronRight, User, Star } from 'lucide-react';
import { ReviewData } from '@/app/(utils)/firebaseOperations';

// Add custom styles for better mobile experience
const customStyles = `
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slideUp 0.4s ease-out;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-scale-in {
    animation: scaleIn 0.4s ease-out;
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-modal-enter {
    animation: modalEnter 0.4s ease-out;
  }
  @keyframes modalEnter {
    from { opacity: 0; transform: scale(0.8) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .animate-modal-exit {
    animation: modalExit 0.3s ease-in;
  }
  @keyframes modalExit {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(0.9) translateY(20px); }
  }
  .animate-backdrop-fade {
    animation: backdropFade 0.3s ease-out;
  }
  @keyframes backdropFade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .animate-backdrop-blur {
    animation: backdropBlur 0.4s ease-out;
  }
  @keyframes backdropBlur {
    from { backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
    to { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  }
  .modal-backdrop {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .modal-content {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .media-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.375rem;
  }
  @media (min-width: 475px) {
    .media-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
  }
  @media (min-width: 640px) {
    .media-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
  }
`;

interface CustomerMediaProps {
    reviews: ReviewData[];
}

export default function CustomerMedia({ reviews }: CustomerMediaProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalAnimating, setIsModalAnimating] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [allMedia, setAllMedia] = useState<any[]>([]);
    const [savedScrollPosition, setSavedScrollPosition] = useState(0);

    // Collect all media from reviews
    const mediaItems = reviews.reduce((acc: any[], review) => {
        if (review.media && review.media.length > 0) {
            const reviewMedia = review.media.map(media => ({
                ...media,
                reviewId: review.id,
                userName: review.userName,
                userPhotoURL: review.userPhotoURL,
                rating: review.rating,
                comment: review.comment
            }));
            acc.push(...reviewMedia);
        }
        return acc;
    }, []);

    const handleMediaClick = (mediaIndex: number) => {
        // Save current scroll position
        setSavedScrollPosition(window.scrollY);
        
        setAllMedia(mediaItems);
        setCurrentMediaIndex(mediaIndex);
        setIsModalAnimating(true);
        setIsModalOpen(true);
        
        // Auto-scroll to reviews section with better positioning
        setTimeout(() => {
            const reviewsSection = document.querySelector('[data-reviews-section]');
            if (reviewsSection) {
                // Get the element's position and scroll to it with offset
                const elementRect = reviewsSection.getBoundingClientRect();
                const absoluteElementTop = elementRect.top + window.scrollY;
                const offset = -500; // Offset from top to position better relative to modal
                
                window.scrollTo({
                    top: absoluteElementTop - offset,
                    behavior: 'smooth'
                });
            }
        }, 200);
    };

    const handleCloseModal = () => {
        setIsModalAnimating(false);
        setTimeout(() => {
            setIsModalOpen(false);
            // Restore previous scroll position
            window.scrollTo({
                top: savedScrollPosition,
                behavior: 'smooth'
            });
        }, 300);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCurrentMediaIndex(prev => 
                prev === 0 ? allMedia.length - 1 : prev - 1
            );
        } else {
            setCurrentMediaIndex(prev => 
                prev === allMedia.length - 1 ? 0 : prev + 1
            );
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isModalOpen) return;

            switch (event.key) {
                case 'Escape':
                    handleCloseModal();
                    break;
                case 'ArrowLeft':
                    handleNavigate('prev');
                    break;
                case 'ArrowRight':
                    handleNavigate('next');
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, allMedia.length, savedScrollPosition]);

    if (mediaItems.length === 0) {
        return null;
    }

    // Show first 3 media items on mobile, 6 on larger screens
    const displayedMedia = mediaItems.slice(0, 3);
    const hasMoreMedia = mediaItems.length > 3;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            {/* Clean & Compact Media Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200/50 dark:border-gray-700/50 animate-fade-in ">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-blue-500" />
                        Customer Moments
                    </h3>
                    <button
                        onClick={() => handleMediaClick(0)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1 rounded-full"
                    >
                        View All ({mediaItems.length})
                    </button>
                </div>

                {/* Clean Grid - Show only 2 items */}
                <div className="grid grid-cols-3 gap-1">
                    {mediaItems.slice(0, 2).map((media, index) => (
                        <div
                            key={`${media.reviewId}-${index}`}
                            className="relative group cursor-pointer animate-fade-in"
                            onClick={() => handleMediaClick(index)}
                        >
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm group-hover:shadow-md transition-all duration-300">
                                {media.type === 'image' ? (
                                    <img
                                        src={media.url}
                                        alt={`Customer moment ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <video
                                            src={media.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                            <Play className="w-3 h-3 xs:w-4 xs:h-4 text-white opacity-90 group-hover:scale-110 transition-transform" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Clean user info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        {media.userPhotoURL ? (
                                            <img
                                                src={media.userPhotoURL}
                                                alt={media.userName}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-2.5 h-2.5 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-xs font-medium truncate">
                                            {media.userName}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-black fill-current" />
                                            <span className="text-white text-xs">
                                                {media.rating}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* View indicator */}
                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Eye className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                            </div>
                        </div>
                    ))}

                    {/* Show more button */}
                    {mediaItems.length > 2 && (
                        <div
                            className="aspect-square rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center animate-fade-in"
                            onClick={() => handleMediaClick(0)}
                        >
                            <Eye className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mb-1" />
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-center px-1">
                                +{mediaItems.length - 2} more
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Compact & Clean Modal */}
            {isModalOpen && (
                <div 
                    className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 ${
                        isModalAnimating ? 'animate-backdrop-fade' : 'opacity-0'
                    }`}
                    onClick={handleCloseModal}
                >
                    <div 
                        className={`relative w-full max-w-4xl max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 transition-all duration-300 ${
                            isModalAnimating ? 'animate-modal-enter' : 'opacity-0 scale-95'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Compact Header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    {allMedia[currentMediaIndex]?.userPhotoURL ? (
                                        <img
                                            src={allMedia[currentMediaIndex]?.userPhotoURL}
                                            alt={allMedia[currentMediaIndex]?.userName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {allMedia[currentMediaIndex]?.userName}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-black fill-current" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {allMedia[currentMediaIndex]?.rating}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                    {currentMediaIndex + 1} of {allMedia.length}
                                </span>
                                <button
                                    onClick={handleCloseModal}
                                    className="w-6 h-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center transition-all duration-200"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* Clean Media Display */}
                        <div className="relative flex items-center justify-center p-4 min-h-[60vh] max-h-[70vh]">
                            {allMedia[currentMediaIndex]?.type === 'image' ? (
                                <img
                                    src={allMedia[currentMediaIndex]?.url}
                                    alt={`Customer moment ${currentMediaIndex + 1}`}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            ) : (
                                <video
                                    src={allMedia[currentMediaIndex]?.url}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                    controls
                                    autoPlay
                                    loop
                                    preload="metadata"
                                />
                            )}

                            {/* Navigation Arrows */}
                            {allMedia.length > 1 && (
                                <>
                                    <button
                                        onClick={() => handleNavigate('prev')}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg border border-gray-200 dark:border-gray-600"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('next')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg border border-gray-200 dark:border-gray-600"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Comment Section */}
                        {allMedia[currentMediaIndex]?.comment && (
                            <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                    "{allMedia[currentMediaIndex]?.comment}"
                                </p>
                            </div>
                        )}

                        {/* Thumbnail Navigation */}
                        {allMedia.length > 1 && (
                            <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-800/30">
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {allMedia.map((media, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentMediaIndex(index)}
                                            className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all duration-200 ${
                                                index === currentMediaIndex
                                                    ? 'ring-2 ring-blue-500 dark:ring-blue-400 scale-105 shadow-md'
                                                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                                            }`}
                                        >
                                            {media.type === 'image' ? (
                                                <img
                                                    src={media.url}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="relative w-full h-full bg-gray-800">
                                                    <video
                                                        src={media.url}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                        <Play className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}