'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
    getMenuItems,
    MenuItem,
    getMenuItemReviews,
    createReview,
    voteOnReview,
    getUserVoteForReview,
    ReviewData
} from '@/app/(utils)/firebaseOperations';
import { CartManager } from '@/app/(utils)/cartUtils';
import { useAuth } from '@/app/(contexts)/AuthContext';

// Enhanced custom styles for better mobile experience and polished UI
const customStyles = `
  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide-up {
    animation: slideUp 0.5s ease-out;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-spin {
    animation: spin 1.5s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-scale-in {
    animation: scaleIn 0.3s ease-out;
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-bounce-subtle {
    animation: bounceSubtle 0.6s ease-out;
  }
  @keyframes bounceSubtle {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-4px); }
    60% { transform: translateY(-2px); }
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .glass-effect {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .gradient-border {
    background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    border-radius: 12px;
    padding: 1px;
  }
  .gradient-border > div {
    background: inherit;
    border-radius: inherit;
  }
  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  .text-shadow {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  .scroll-smooth {
    scroll-behavior: smooth;
  }
  @media (max-width: 475px) {
    .xs\\:text-xs { font-size: 0.75rem; }
    .xs\\:text-sm { font-size: 0.875rem; }
    .xs\\:text-base { font-size: 1rem; }
    .xs\\:text-lg { font-size: 1.125rem; }
    .xs\\:text-xl { font-size: 1.25rem; }
    .xs\\:text-2xl { font-size: 1.5rem; }
    .xs\\:p-2 { padding: 0.5rem; }
    .xs\\:p-3 { padding: 0.75rem; }
    .xs\\:p-4 { padding: 1rem; }
    .xs\\:p-5 { padding: 1.25rem; }
    .xs\\:p-6 { padding: 1.5rem; }
    .xs\\:px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
    .xs\\:px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .xs\\:px-4 { padding-left: 1rem; padding-right: 1rem; }
    .xs\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .xs\\:py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .xs\\:py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
    .xs\\:py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .xs\\:py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .xs\\:py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
    .xs\\:py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .xs\\:gap-2 { gap: 0.5rem; }
    .xs\\:gap-3 { gap: 0.75rem; }
    .xs\\:gap-4 { gap: 1rem; }
    .xs\\:gap-6 { gap: 1.5rem; }
    .xs\\:mb-2 { margin-bottom: 0.5rem; }
    .xs\\:mb-3 { margin-bottom: 0.75rem; }
    .xs\\:mb-4 { margin-bottom: 1rem; }
    .xs\\:mb-6 { margin-bottom: 1.5rem; }
    .xs\\:mb-8 { margin-bottom: 2rem; }
    .xs\\:space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
    .xs\\:space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
    .xs\\:space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
    .xs\\:space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
    .xs\\:w-auto { width: auto; }
    .xs\\:w-4 { width: 1rem; }
    .xs\\:w-5 { width: 1.25rem; }
    .xs\\:w-6 { width: 1.5rem; }
    .xs\\:w-8 { width: 2rem; }
    .xs\\:w-10 { width: 2.5rem; }
    .xs\\:w-12 { width: 3rem; }
    .xs\\:h-4 { height: 1rem; }
    .xs\\:h-5 { height: 1.25rem; }
    .xs\\:h-6 { height: 1.5rem; }
    .xs\\:h-8 { height: 2rem; }
    .xs\\:h-10 { height: 2.5rem; }
    .xs\\:h-12 { height: 3rem; }
    .xs\\:rounded-lg { border-radius: 0.5rem; }
    .xs\\:rounded-xl { border-radius: 0.75rem; }
    .xs\\:rounded-2xl { border-radius: 1rem; }
    .xs\\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .xs\\:flex-row { flex-direction: row; }
    .xs\\:flex-col { flex-direction: column; }
    .xs\\:items-center { align-items: center; }
    .xs\\:items-start { align-items: flex-start; }
    .xs\\:justify-center { justify-content: center; }
    .xs\\:justify-between { justify-content: space-between; }
    .xs\\:text-center { text-align: center; }
    .xs\\:text-left { text-align: left; }
  }
  @media (min-width: 640px) {
    .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .sm\\:flex-row { flex-direction: row; }
    .sm\\:items-center { align-items: center; }
    .sm\\:justify-between { justify-content: space-between; }
  }
  @media (min-width: 1024px) {
    .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .lg\\:flex-row { flex-direction: row; }
    .lg\\:items-center { align-items: center; }
    .lg\\:justify-between { justify-content: space-between; }
  }
`;

// Import components
import ProductInfo from './components/ProductInfo';
import ReviewForm from './components/ReviewForm';
import ReviewList from './components/ReviewList';
import ReviewSummary from './components/ReviewSummary';
import CustomerMedia from './components/CustomerMedia';
import AllReviewsModal from './components/AllReviewsModal';

// CartMenuItem is now imported from cartUtils

export default function MenuItemDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, userProfile } = useAuth();

    const restaurantId = params.id as string;
    const itemId = params.itemId as string;

    // State variables
    const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [showWriteReview, setShowWriteReview] = useState(false);
    const [userVotes, setUserVotes] = useState<{ [reviewId: string]: boolean }>({});
    const [votingReviews, setVotingReviews] = useState<{ [reviewId: string]: boolean }>({});
    const [optimisticUpdates, setOptimisticUpdates] = useState<{ [reviewId: string]: { helpful: number, notHelpful: number } }>({});
    const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);

    // Load menu data
    useEffect(() => {
        const loadData = async () => {
            if (!restaurantId || !itemId) {
                setError('Invalid restaurant or menu item ID');
                setLoading(false);
                return;
            }

            try {
                // Check if cart is from different restaurant
                if (CartManager.isDifferentRestaurant(restaurantId)) {
                    // Clear cart if from different restaurant
                    CartManager.clearCart();
                }

                // Fetch menu items
                const menuResult = await getMenuItems(restaurantId);
                if (menuResult.success && menuResult.data) {
                    const item = menuResult.data.find(item => item.id === itemId);
                    if (item) {
                        setMenuItem(item);
                    } else {
                        setError('Menu item not found');
                    }
                } else {
                    setError('Failed to load menu items');
                }
            } catch (err) {
                setError('Failed to load menu item');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [restaurantId, itemId]);

    // Load reviews when component mounts
    useEffect(() => {
        const loadReviews = async () => {
            if (!itemId) return;

            try {
                const result = await getMenuItemReviews(itemId);
                if (result.success && result.data) {
                    setReviews(result.data);
                }
            } catch (error) {
                // Handle error silently
            }
        };

        loadReviews();
    }, [itemId]);

    // Load user votes when user or reviews change
    useEffect(() => {
        const loadUserVotes = async () => {
            if (user && reviews.length > 0) {
                const votes: { [reviewId: string]: boolean } = {};
                const votePromises = reviews.map(async (review) => {
                    const voteResult = await getUserVoteForReview(review.id, user.uid);
                    if (voteResult.success && voteResult.data) {
                        return { reviewId: review.id, isHelpful: voteResult.data.isHelpful };
                    }
                    return null;
                });
                const voteResults = await Promise.all(votePromises);
                voteResults.forEach(vote => {
                    if (vote) {
                        votes[vote.reviewId] = vote.isHelpful;
                    }
                });
                setUserVotes(votes);
            }
        };

        loadUserVotes();
    }, [user, reviews]);

    // Submit a new review
    const handleSubmitReview = async (reviewData: { rating: number, comment: string, media: any[] }) => {
        if (!user || !userProfile || !menuItem) return;

        setIsSubmittingReview(true);
        setReviewError(null);

        try {
            const reviewPayload = {
                menuItemId: itemId,
                restaurantId: restaurantId,
                userId: user.uid,
                userName: userProfile.displayName || user.displayName || 'Anonymous',
                userEmail: userProfile.email || user.email || '',
                userPhotoURL: userProfile.photoURL || user.photoURL || '',
                rating: reviewData.rating,
                comment: reviewData.comment,
                isVerified: false, // Could be set to true if user has ordered this item
                media: reviewData.media
            };

            const result = await createReview(reviewPayload);
            if (result.success && result.data) {
                // Add the new review to the list
                setReviews(prev => [result.data, ...prev]);
                setShowWriteReview(false);

                // Refresh reviews to get the latest data with correct timestamps
                const reviewsResult = await getMenuItemReviews(itemId);
                if (reviewsResult.success && reviewsResult.data) {
                    setReviews(reviewsResult.data);
                }
            } else {
                setReviewError(result.error || 'Failed to submit review');
            }
        } catch (error) {
            setReviewError('Failed to submit review');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Vote on a review with optimistic updates
    const handleVoteReview = async (reviewId: string, isHelpful: boolean) => {
        if (!user || votingReviews[reviewId]) return;

        setVotingReviews(prev => ({ ...prev, [reviewId]: true })); // Set loading state

        const currentUserVote = userVotes[reviewId];

        // Optimistic update - update UI immediately
        setUserVotes(prev => ({ ...prev, [reviewId]: isHelpful }));

        // Calculate and store optimistic vote counts
        const currentReview = reviews.find(r => r.id === reviewId);
        if (currentReview) {
            let newHelpful = currentReview.helpful || 0;
            let newNotHelpful = currentReview.notHelpful || 0;

            if (currentUserVote === true && isHelpful) {
                // User is removing their helpful vote
                newHelpful = Math.max(0, newHelpful - 1);
            } else if (currentUserVote === false && !isHelpful) {
                // User is removing their not helpful vote
                newNotHelpful = Math.max(0, newNotHelpful - 1);
            } else if (currentUserVote === true && !isHelpful) {
                // User is changing from helpful to not helpful
                newHelpful = Math.max(0, newHelpful - 1);
                newNotHelpful = newNotHelpful + 1;
            } else if (currentUserVote === false && isHelpful) {
                // User is changing from not helpful to helpful
                newNotHelpful = Math.max(0, newNotHelpful - 1);
                newHelpful = newHelpful + 1;
            } else if (currentUserVote === undefined) {
                // User is voting for the first time
                if (isHelpful) {
                    newHelpful = newHelpful + 1;
                } else {
                    newNotHelpful = newNotHelpful + 1;
                }
            }

            // Store optimistic updates
            setOptimisticUpdates(prev => ({
                ...prev,
                [reviewId]: { helpful: newHelpful, notHelpful: newNotHelpful }
            }));

            // Update local reviews state optimistically
            setReviews(prev => prev.map(review =>
                review.id === reviewId
                    ? { ...review, helpful: newHelpful, notHelpful: newNotHelpful }
                    : review
            ));
        }

        try {
            const result = await voteOnReview(reviewId, user.uid, isHelpful);
            if (!result.success) {
                // Revert optimistic updates on failure
                setUserVotes(prev => {
                    const newState = { ...prev };
                    if (currentUserVote === undefined) {
                        delete newState[reviewId];
                    } else {
                        newState[reviewId] = currentUserVote;
                    }
                    return newState;
                });
                setOptimisticUpdates(prev => {
                    const newState = { ...prev };
                    delete newState[reviewId];
                    return newState;
                });
            } else {
                // Clear optimistic updates on success
                setOptimisticUpdates(prev => {
                    const newState = { ...prev };
                    delete newState[reviewId];
                    return newState;
                });
            }
        } catch (error) {
            // Revert optimistic updates on error
            setUserVotes(prev => {
                const newState = { ...prev };
                if (currentUserVote === undefined) {
                    delete newState[reviewId];
                } else {
                    newState[reviewId] = currentUserVote;
                }
                return newState;
            });
            setOptimisticUpdates(prev => {
                const newState = { ...prev };
                delete newState[reviewId];
                return newState;
            });
        } finally {
            // Clear loading state
            setVotingReviews(prev => {
                const newState = { ...prev };
                delete newState[reviewId];
                return newState;
            });
        }
    };

    // Calculate average rating
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    // Format date for display - show actual date and time
    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Recently';

        let date;
        
        // Handle Firestore server timestamp objects
        if (timestamp._methodName === 'serverTimestamp') {
            // This is a server timestamp placeholder, use current time
            date = new Date();
        } else if (timestamp.toDate && typeof timestamp.toDate === 'function') {
            // Firestore Timestamp object
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            // Firestore timestamp with seconds property
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp instanceof Date) {
            // Already a Date object
            date = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            // String or number timestamp
            date = new Date(timestamp);
        } else {
            // Fallback to current time
            date = new Date();
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Recently';
        }

        // Format as "Dec 15, 2023 at 2:30 PM"
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleAddToCart = (qty: number) => {
        if (menuItem) {
            CartManager.addToCart(menuItem, qty, restaurantId);
        }
    };

    const handleViewAllReviews = () => {
        setShowAllReviewsModal(true);
    };

    const handleCloseAllReviewsModal = () => {
        setShowAllReviewsModal(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center p-4">
                <div className="text-center animate-fade-in">
                    <div className="relative mb-4 xs:mb-6">
                        <div className="w-12 h-12 xs:w-16 xs:h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 xs:w-8 xs:h-8 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
                              <span className="text-white dark:text-gray-900 font-bold text-xs xs:text-sm">D</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-muted-foreground font-medium animate-fade-in text-sm xs:text-base">
                        Loading delicious details...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !menuItem) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center p-4">
                <div className="text-center max-w-sm mx-auto animate-fade-in">
                    <div className="w-16 h-16 xs:w-20 xs:h-20 mx-auto mb-4 xs:mb-6 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
                              <span className="text-white dark:text-gray-900 font-bold text-sm xs:text-base">D</span>
                            </div>
                    </div>
                    <h2 className="text-lg xs:text-xl font-bold text-foreground mb-2 xs:mb-3">
                        Oops! Something went wrong
                    </h2>
                    <p className="text-muted-foreground mb-4 xs:mb-6 text-sm xs:text-base">
                        {error || 'Menu item not found'}
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 xs:px-6 py-2 xs:py-3 bg-primary text-primary-foreground rounded-lg xs:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm xs:text-base"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
                {/* Mobile-Optimized Back Button */}
                <div className="sticky top-0 bottom-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm md:h-12 flex items-center">
                    <div className="container mx-auto px-2 xs:px-3 sm:px-4 lg:px-8 py-2 xs:py-3 flex items-center h-full">
                        <button
                            onClick={() => router.back()}
                            className=" cursor-pointer flex items-center gap-1.5 xs:gap-2 text-muted-foreground hover:text-foreground transition-colors group animate-fade-in"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs xs:text-sm font-medium">Back to Menu</span>
                        </button>
                    </div>
                </div>

                {/* Mobile-Optimized Main Content */}
                <main className="py-2 xs:py-3 sm:py-4 lg:py-6">
                    <div className="container mx-auto px-2 xs:px-3 sm:px-4 lg:px-8">
                        <ProductInfo
                            menuItem={menuItem}
                            onAddToCart={handleAddToCart}
                        />
                    </div>
                </main>

                {/* Enhanced Reviews Section */}
                <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/60 backdrop-blur-sm border-t border-border/20">
                    <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-6 sm:py-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Top Section: Customer Media & Review Summary */}
                            {reviews?.some(r => r.media && r.media.length > 0) ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 mb-6 xs:mb-8">
                                    {/* Customer Media Section */}
                                    <div className="order-1 lg:order-1">
                                        <div className="h-full">
                                            <CustomerMedia reviews={reviews} />
                                        </div>
                                    </div>

                                    {/* Review Summary Section */}
                                    <div className="order-2 lg:order-2">
                                        <div className="h-full">
                                            <ReviewSummary reviews={reviews} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 mb-6 xs:mb-8">
                                    {/* Review Summary comes first if no customer media */}
                                    <div className="order-1 lg:order-1">
                                        <div className="h-full">
                                            <ReviewSummary reviews={reviews} />
                                        </div>
                                    </div>
                                    {/* Empty div acts as placeholder for customer media on layout */}
                                    <div className="order-2 lg:order-2">
                                        <div className="h-full"></div>
                                    </div>
                                </div>
                            )}

                            {/* Individual Reviews Section */}
                            <div data-reviews-section className="space-y-4 xs:space-y-6">
                                {/* Reviews Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 xs:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                                            <svg className="w-4 h-4 xs:w-5 xs:h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-lg xs:text-xl lg:text-2xl font-bold text-foreground">
                                                Customer Reviews
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {reviews.length} review{reviews.length !== 1 ? 's' : ''} from verified customers
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Action Button */}
                                    <div className="flex-shrink-0">
                                        {user ? (
                                            <button
                                                onClick={() => setShowWriteReview(!showWriteReview)}
                                                className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm xs:text-base w-fit sm:w-auto"
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    {showWriteReview ? 'Cancel Review' : 'Write a Review'}
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => router.push('/user/login')}
                                                className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm xs:text-base w-full sm:w-auto"
                                            >
                                                <span className="relative z-10 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                    </svg>
                                                    Login to Review
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Review Form */}
                                {showWriteReview && user && (
                                    <div className="bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 backdrop-blur-sm rounded-2xl p-4 xs:p-6 border border-border/30 shadow-lg animate-fade-in">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">Share Your Experience</h3>
                                        </div>
                                        <ReviewForm
                                            onSubmit={handleSubmitReview}
                                            onCancel={() => setShowWriteReview(false)}
                                            isSubmitting={isSubmittingReview}
                                            error={reviewError}
                                        />
                                    </div>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-3 xs:space-y-4">
                                    <ReviewList
                                        reviews={reviews}
                                        userVotes={userVotes}
                                        optimisticUpdates={optimisticUpdates}
                                        votingReviews={votingReviews}
                                        onVoteReview={handleVoteReview}
                                        formatDate={formatDate}
                                        onViewAllReviews={handleViewAllReviews}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* All Reviews Modal */}
            <AllReviewsModal
                isOpen={showAllReviewsModal}
                onClose={handleCloseAllReviewsModal}
                reviews={reviews}
                userVotes={userVotes}
                optimisticUpdates={optimisticUpdates}
                votingReviews={votingReviews}
                onVoteReview={handleVoteReview}
                formatDate={formatDate}
            />
        </>
    );
}