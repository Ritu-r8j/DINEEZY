'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
// Removed heavy motion animations for better performance
import {
    Search,
    Clock,
    MapPin,
    ShoppingCart,
    X,
    Utensils,
    Sparkles,
    Users,
    CheckCircle,
    AlertCircle,
    Star,
    ExternalLink,
    Facebook,
    Instagram,
    Twitter,
    Award,
    Heart
} from 'lucide-react';
import GradientStar from '@/components/ui/GradientStar';

// Add custom styles for better mobile experience
const customStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  .animate-slide-up {
    animation: slideUp 0.4s ease-out;
  }
  .search-filter-container {
    min-height: 120px;
  }
  .category-pills-container {
    min-height: 50px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .category-pills-container::-webkit-scrollbar {
    display: none;
  }
  .search-suggestions {
    animation: slideDown 0.2s ease-out;
  }
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .card-hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
  }
  .image-zoom {
    transform: scale(1.1);
  }
  .badge-glow {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
  }
  .price-glow {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
  }
`;
import {
    getMenuItems,
    getRestaurantSettings,
    MenuItem
} from '@/app/(utils)/firebaseOperations';
import { CartManager, CartMenuItem } from '@/app/(utils)/cartUtils';
import { getCategoryMappings, CategoryMappings } from '@/app/(utils)/categoryOperations';
import { getCategoryDisplayName } from '@/lib/categoryData';
import { useCart } from '@/app/(contexts)/CartContext';

// Enhanced MenuItem interface with discount and badges
interface EnhancedMenuItem extends MenuItem {
    discountPrice?: number;
    currency?: string;
    isBestSeller?: boolean;
    isRecommended?: boolean;
    totalRatings?: number;
    totalOrders?: number;
    viewCount?: number;
    orderCount?: number;
}

// CartMenuItem is now imported from cartUtils
export default function Menu() {
    const router = useRouter();
    const params = useParams();
    const restaurantId = params.id as string;

    const [activeCategory, setActiveCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [menuItems, setMenuItems] = useState<EnhancedMenuItem[]>([]);
    const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [categoryMappings, setCategoryMappings] = useState<CategoryMappings>({});
    const [customCategories, setCustomCategories] = useState<any[]>([]);
    const [showSocialMedia, setShowSocialMedia] = useState(false);

    // Helper function to check if restaurant is currently open
    const isRestaurantOpen = () => {
        if (!restaurantInfo?.hours) return false;

        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

        const dayHours = restaurantInfo.hours[currentDay];
        if (!dayHours || !dayHours.open) return false;

        // Parse time strings (format: "HH:MM")
        const [fromHour, fromMin] = dayHours.from.split(':').map(Number);
        const [toHour, toMin] = dayHours.to.split(':').map(Number);

        const fromTime = fromHour * 60 + fromMin;
        const toTime = toHour * 60 + toMin;

        // Handle 24-hour operation (00:00 to 00:00)
        if (fromTime === 0 && toTime === 0) return true;

        // Handle overnight hours (e.g., 22:00 to 02:00)
        if (toTime < fromTime) {
            return currentTime >= fromTime || currentTime <= toTime;
        }

        return currentTime >= fromTime && currentTime <= toTime;
    };

    // Calculate average rating from menu items
    const getAverageRating = (): string => {
        if (!menuItems || menuItems.length === 0) return '0.0';

        const itemsWithRatings = menuItems.filter(item => item.rating && item.rating > 0);
        if (itemsWithRatings.length === 0) return '4.5'; // Default fallback

        const sum = itemsWithRatings.reduce((acc, item) => acc + (item.rating || 0), 0);
        return (sum / itemsWithRatings.length).toFixed(2);
    };

    // Calculate total reviews from menu items
    const getTotalReviews = () => {
        if (!menuItems || menuItems.length === 0) return 0;

        return menuItems.reduce((acc, item) => acc + (item.totalRatings || 0), 0);
    };

    // Get minimum order value from restaurant settings
    const getMinOrderValue = () => {
        // Default minimum order value
        return '₹299';
    };

    // Get free delivery threshold
    const getFreeDeliveryThreshold = () => {
        // Use default threshold
        return '₹499';
    };

    // Helper functions for enhanced display
    const hasDiscount = (item: EnhancedMenuItem) => {
        return !!(item.discountPrice && 
                 typeof item.discountPrice === 'number' && 
                 item.discountPrice > 0 && 
                 item.discountPrice < item.price);
    };

    const getDiscountPercentage = (item: EnhancedMenuItem) => {
        if (!hasDiscount(item)) return 0;
        return Math.round(((item.price - item.discountPrice!) / item.price) * 100);
    };

    const formatCurrency = (amount: number, currency: string = 'INR') => {
        const symbol = currency === 'INR' ? '₹' : '$';
        return `${symbol}${amount.toFixed(2)}`;
    };

    const getSpiceCount = (spiceLevel?: string) => {
        switch (spiceLevel) {
            case 'mild': return 1;
            case 'medium': return 2;
            case 'hot': return 3;
            case 'very-hot': return 4;
            default: return 0;
        }
    };

    // Load menu data
    useEffect(() => {
        const loadData = async () => {
            if (!restaurantId) {
                setError('Restaurant ID is required');
                setIsLoading(false);
                return;
            }

            try {
                // Check if cart is from different restaurant
                if (CartManager.isDifferentRestaurant(restaurantId)) {
                    // Clear cart if from different restaurant
                    CartManager.clearCart();
                }

                // Fetch restaurant info first
                const restaurantResult = await getRestaurantSettings(restaurantId);
                if (restaurantResult.success && restaurantResult.data) {
                    setRestaurantInfo(restaurantResult.data);

                    // Fetch menu items and category mappings in parallel
                    const [menuResult, mappingsResult] = await Promise.all([
                        getMenuItems(restaurantResult.data.adminId),
                        getCategoryMappings(restaurantResult.data.adminId)
                    ]);

                    if (menuResult.success && menuResult.data) {
                        // Transform menu items to include enhanced fields
                        const enhancedItems: EnhancedMenuItem[] = menuResult.data.map((item: MenuItem) => {
                            // Properly validate discount price
                            const rawDiscountPrice = (item as any).discountPrice;
                            const validDiscountPrice = rawDiscountPrice && 
                                                     typeof rawDiscountPrice === 'number' && 
                                                     rawDiscountPrice > 0 && 
                                                     rawDiscountPrice < item.price ? rawDiscountPrice : undefined;

                            return {
                                ...item,
                                discountPrice: validDiscountPrice,
                                currency: (item as any).currency || 'INR',
                                isBestSeller: (item as any).isBestSeller || false,
                                isRecommended: (item as any).isRecommended || false,
                                totalRatings: (item as any).totalRatings || 0,
                                totalOrders: (item as any).totalOrders || 0,
                                viewCount: (item as any).viewCount || 0,
                                orderCount: (item as any).orderCount || 0,
                            };
                        });
                        setMenuItems(enhancedItems);
                    } else {
                        setError(menuResult.error || 'Failed to load menu items');
                    }

                    if (mappingsResult.success) {
                        setCategoryMappings(mappingsResult.data);
                        setCustomCategories(mappingsResult.customCategories || []);
                    }
                } else {
                    setError(restaurantResult.error || 'Restaurant not found');
                }

            } catch (err) {
                setError('An unexpected error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [restaurantId]);

    // Get categories dynamically from menu items with custom display names
    const categoryIds = Array.from(new Set(menuItems.map(item => item.category)));
    const categories = [
        { id: "All", displayName: "All" },
        ...categoryIds.map(catId => ({
            id: catId,
            displayName: getCategoryDisplayName(catId, categoryMappings, customCategories)
        }))
    ];

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === "All" || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCategoryDisplayName(item.category, categoryMappings, customCategories).toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Generate autocomplete suggestions from menu items
    const generateSuggestions = (term: string) => {
        if (!term || term.length < 2) return [];

        const suggestions = new Set<string>();

        menuItems.forEach(item => {
            // Add item names that contain the search term
            if (item.name.toLowerCase().includes(term.toLowerCase())) {
                suggestions.add(item.name);
            }

            // Add custom category names that contain the search term
            const categoryDisplayName = getCategoryDisplayName(item.category, categoryMappings, customCategories);
            if (categoryDisplayName.toLowerCase().includes(term.toLowerCase())) {
                suggestions.add(categoryDisplayName);
            }

            // Add words from description that contain the search term
            const descriptionWords = item.description.toLowerCase().split(' ');
            descriptionWords.forEach(word => {
                if (word.includes(term.toLowerCase()) && word.length > 2) {
                    suggestions.add(word.charAt(0).toUpperCase() + word.slice(1));
                }
            });
        });

        return Array.from(suggestions).slice(0, 5); // Limit to 5 suggestions
    };

    // Update suggestions when search term changes (with debounce)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.length >= 2) {
                const newSuggestions = generateSuggestions(searchTerm);
                setSuggestions(newSuggestions);
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
                setSuggestions([]);
            }
        }, 150); // 150ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, menuItems]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.search-container')) {
                setShowSuggestions(false);
            }
            // Close social media popup when clicking outside
            if (!target.closest('.social-media-popup') && showSocialMedia) {
                setShowSocialMedia(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSocialMedia]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
                    setSearchTerm(suggestions[selectedSuggestionIndex]);
                    setShowSuggestions(false);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                break;
        }
    };

    const { openCustomization } = useCart();

    const addToCart = (item: MenuItem) => {
        try {
            // Check if item has variants or add-ons
            if ((item.variants && Array.isArray(item.variants) && item.variants.length > 0) ||
                (item.addons && Array.isArray(item.addons) && item.addons.length > 0)) {
                // Open cart with customization
                openCustomization(item, restaurantId);
            } else {
                // Add directly to cart if no customization needed
                const result = CartManager.addToCart(item, 1, restaurantId);

                if (result.success) {
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 500);

                    // Dispatch custom event to notify other components
                    window.dispatchEvent(new CustomEvent('cartUpdated', {
                        detail: { cartItems: result.cartItems, cartCount: result.cartCount }
                    }));
                } else {
                    console.error('Failed to add item to cart');
                }
            }
        } catch (error) {
            console.error('Error adding item to cart:', error);
        }
    };


    // Show loading state while data is being loaded
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="relative mb-8">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Utensils className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                    <p className="text-muted-foreground font-medium animate-fade-in">
                        Preparing delicious menu...
                    </p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4 animate-fade-in">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">
                        Oops! Something went wrong
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {error}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
                {/* Enhanced Hero Section with Better Responsiveness */}
                <section className="relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute top-20 left-4 sm:left-10 w-24 sm:w-32 h-24 sm:h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
                        <div className="absolute bottom-20 right-4 sm:right-10 w-32 sm:w-40 h-32 sm:h-40 bg-primary/8 rounded-full blur-3xl animate-float-reverse" />
                    </div>

                    {/* Mobile Hero Section - More compact sizing */}
                    <div className="lg:hidden relative w-full h-64 xs:h-72 sm:h-80">
                        <div className="relative w-full h-full animate-fade-in">
                            {/* Video Background for Mobile (when available) */}
                            {restaurantInfo?.video ? (
                                <>
                                    <video
                                        src={restaurantInfo.video}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback to image if video fails to load
                                            const target = e.target as HTMLVideoElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                    {/* Fallback Image (hidden by default, shown if video fails) */}
                                    <Image
                                        src={restaurantInfo?.image || '/placeholder-restaurant.jpg'}
                                        alt={restaurantInfo?.name || 'Restaurant'}
                                        fill
                                        className="object-cover"
                                        sizes="100vw"
                                        priority
                                        style={{ display: 'none' }}
                                        onLoad={(e) => {
                                            // Show image if video is not available or failed
                                            const video = e.currentTarget.parentElement?.querySelector('video');
                                            if (!video || video.style.display === 'none') {
                                                e.currentTarget.style.display = 'block';
                                            }
                                        }}
                                    />
                                </>
                            ) : (
                                /* Static Image when no video */
                                <Image
                                    src={restaurantInfo?.image || '/placeholder-restaurant.jpg'}
                                    alt={restaurantInfo?.name || 'Restaurant'}
                                    fill
                                    className="object-cover"
                                    sizes="100vw"
                                    priority
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />

                            {/* Pure Veg Badge - Top Right Corner */}
                            {restaurantInfo?.restaurantType && (
                                <div className="absolute top-3 xs:top-4 sm:top-6 right-3 xs:right-4 sm:right-6 z-10 animate-fade-in">
                                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold border border-green-300 dark:border-green-700 shadow-lg">
                                        Pure {restaurantInfo.restaurantType}
                                    </span>
                                </div>
                            )}

                            {/* Social Media Popup Button - Top Left Corner */}
                            {(restaurantInfo?.socialMedia?.facebook || restaurantInfo?.socialMedia?.instagram || restaurantInfo?.socialMedia?.twitter) && (
                                <div className="absolute top-3 xs:top-4 sm:top-6 left-3 xs:left-4 sm:left-6 z-10">
                                    <div className="relative social-media-popup">
                                        <button
                                            onClick={() => setShowSocialMedia(!showSocialMedia)}
                                            className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
                                            aria-label="Social Media"
                                        >
                                            <svg className="w-4 h-4 xs:w-4.5 xs:h-4.5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                            </svg>
                                        </button>

                                        {/* Social Media Links Popup - Vertical Layout */}
                                        {showSocialMedia && (
                                            <div className="absolute top-full left-0 mt-2 animate-fade-in">
                                                <div className="flex flex-col gap-2 p-1.5">
                                                    {restaurantInfo?.socialMedia?.facebook && (
                                                        <a
                                                            href={restaurantInfo.socialMedia.facebook}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all hover:scale-110 shadow-lg hover:shadow-xl animate-slide-up"
                                                            style={{ animationDelay: '0.05s' }}
                                                        >
                                                            <Facebook className="w-4 h-4 text-white" />
                                                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                                Facebook
                                                            </div>
                                                        </a>
                                                    )}

                                                    {restaurantInfo?.socialMedia?.instagram && (
                                                        <a
                                                            href={restaurantInfo.socialMedia.instagram}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 rounded-lg transition-all hover:scale-110 shadow-lg hover:shadow-xl animate-slide-up"
                                                            style={{ animationDelay: '0.1s' }}
                                                        >
                                                            <Instagram className="w-4 h-4 text-white" />
                                                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                                Instagram
                                                            </div>
                                                        </a>
                                                    )}

                                                    {restaurantInfo?.socialMedia?.twitter && (
                                                        <a
                                                            href={restaurantInfo.socialMedia.twitter}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 rounded-lg transition-all hover:scale-110 shadow-lg hover:shadow-xl animate-slide-up"
                                                            style={{ animationDelay: '0.15s' }}
                                                        >
                                                            <Twitter className="w-4 h-4 text-white" />
                                                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                                Twitter
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Fallback Social Media Icons - Always show if no social media configured */}
                            {(!restaurantInfo?.socialMedia?.facebook && !restaurantInfo?.socialMedia?.instagram && !restaurantInfo?.socialMedia?.twitter) && (
                                <div className="absolute top-3 xs:top-4 sm:top-6 left-3 xs:left-4 sm:left-6 z-10">
                                    <div className="relative social-media-popup">
                                        <button
                                            onClick={() => setShowSocialMedia(!showSocialMedia)}
                                            className="w-8 h-8 xs:w-9 xs:h-9 flex items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
                                            aria-label="Social Media"
                                        >
                                            <svg className="w-4 h-4 xs:w-4.5 xs:h-4.5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                            </svg>
                                        </button>

                                        {/* Default Social Media Links Popup */}
                                        {showSocialMedia && (
                                            <div className="absolute top-full left-0 mt-2 animate-fade-in">
                                                <div className="flex flex-col gap-2 p-1.5">
                                                    <a
                                                        href="#"
                                                        onClick={(e) => e.preventDefault()}
                                                        className="group relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all hover:scale-110 shadow-lg hover:shadow-xl animate-slide-up"
                                                        style={{ animationDelay: '0.05s' }}
                                                    >
                                                        <Facebook className="w-4 h-4 text-white" />
                                                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                            Facebook
                                                        </div>
                                                    </a>

                                                    <a
                                                        href="#"
                                                        onClick={(e) => e.preventDefault()}
                                                        className="group relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 rounded-lg transition-all hover:scale-110 shadow-lg hover:shadow-xl animate-slide-up"
                                                        style={{ animationDelay: '0.1s' }}
                                                    >
                                                        <Instagram className="w-4 h-4 text-white" />
                                                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                            Instagram
                                                        </div>
                                                    </a>

                                                    <a
                                                        href="#"
                                                        onClick={(e) => e.preventDefault()}
                                                        className="group relative w-8 h-8 flex items-center justify-center bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 rounded-lg transition-all hover:scale-110 shadow-lg hover:shadow-xl animate-slide-up"
                                                        style={{ animationDelay: '0.15s' }}
                                                    >
                                                        <Twitter className="w-4 h-4 text-white" />
                                                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                            Twitter
                                                        </div>
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Compact Mobile Overlay Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 xs:p-4 sm:p-6">
                                <div className="text-white space-y-1.5 xs:space-y-2 sm:space-y-3 animate-slide-up">
                                    <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold leading-tight">
                                        {restaurantInfo?.name || 'Restaurant'}
                                    </h1>
                                    {restaurantInfo?.description && (
                                        <p className="text-sm xs:text-base sm:text-lg opacity-90 line-clamp-2">
                                            {restaurantInfo.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-xs opacity-80">
                                        <span className="flex items-center gap-1 xs:gap-2">
                                            <MapPin className="w-3 h-3 xs:w-4 xs:h-4" />
                                            {restaurantInfo?.address?.city && restaurantInfo?.address?.state
                                                ? `${restaurantInfo.address.city}, ${restaurantInfo.address.state}`
                                                : 'Location'}
                                        </span>
                                        <span className="hidden xs:inline">•</span>
                                        <span className="hidden xs:inline">{restaurantInfo?.cuisine || 'International Cuisine'}</span>
                                        <span className="hidden xs:inline">•</span>
                                        {isRestaurantOpen() ? (
                                            <span className="flex items-center gap-1 text-green-400">
                                                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-400 rounded-full animate-pulse" />
                                                Open Now
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-400">
                                                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-red-400 rounded-full" />
                                                Closed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-2 xs:py-3 sm:py-6 lg:py-8">
                        <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-12 items-start animate-fade-in">
                            {/* Restaurant Info - Redesigned Horizontal Layout */}
                            <div className="hidden lg:flex lg:flex-row gap-6 xl:gap-8">
                                {/* Restaurant Image */}
                                <div className="relative group animate-fade-in flex-shrink-0">
                                    <div className="relative w-56 xl:w-64 h-56 xl:h-64">
                                        {/* Show video on hover for desktop, image by default */}
                                        {restaurantInfo?.video ? (
                                            <>
                                                <Image
                                                    src={restaurantInfo?.image || '/placeholder-restaurant.jpg'}
                                                    alt={restaurantInfo?.name || 'Restaurant'}
                                                    fill
                                                    className="object-cover rounded-2xl shadow-2xl group-hover:opacity-0 transition-all duration-500"
                                                />
                                                <video
                                                    src={restaurantInfo.video}
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                                                />
                                            </>
                                        ) : (
                                            <Image
                                                src={restaurantInfo?.image || '/placeholder-restaurant.jpg'}
                                                alt={restaurantInfo?.name || 'Restaurant'}
                                                fill
                                                className="object-cover rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-500"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
                                    </div>

                                    {/* Social Media Icons Below Image */}
                                    <div className="mt-4">
                                        <p className="text-xs text-muted-foreground mb-2 font-medium">Follow Us:</p>
                                        <div className="flex items-center gap-2">
                                            {restaurantInfo?.socialMedia?.facebook && (
                                                <a
                                                    href={restaurantInfo.socialMedia.facebook}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full transition-all hover:scale-110"
                                                    title="Facebook"
                                                >
                                                    <Facebook className="w-5 h-5 text-white" />
                                                </a>
                                            )}

                                            {restaurantInfo?.socialMedia?.instagram && (
                                                <a
                                                    href={restaurantInfo.socialMedia.instagram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full transition-all hover:scale-110"
                                                    title="Instagram"
                                                >
                                                    <Instagram className="w-5 h-5 text-white" />
                                                </a>
                                            )}

                                            {restaurantInfo?.socialMedia?.twitter && (
                                                <a
                                                    href={restaurantInfo.socialMedia.twitter}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 flex items-center justify-center bg-sky-500 hover:bg-sky-600 rounded-full transition-all hover:scale-110"
                                                    title="Twitter"
                                                >
                                                    <Twitter className="w-5 h-5 text-white" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Restaurant Details */}
                                <div className="flex-1 space-y-3 animate-fade-in">
                                    {/* Title and Badge */}
                                    <div className="flex items-start gap-3">
                                        <h1 className="text-3xl xl:text-4xl font-bold text-foreground">
                                            {restaurantInfo?.name || 'Restaurant'}
                                        </h1>
                                        {restaurantInfo?.restaurantType && (
                                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold border border-green-300 dark:border-green-700">
                                                Pure {restaurantInfo.restaurantType}
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {restaurantInfo?.description && (
                                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                                            {restaurantInfo.description}
                                        </p>
                                    )}

                                    {/* Location, Cuisine, Price, Status */}
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {restaurantInfo?.address?.city && restaurantInfo?.address?.state
                                                ? `${restaurantInfo.address.city}, ${restaurantInfo.address.state}`
                                                : 'Location'}
                                        </span>
                                        <span>•</span>
                                        <span>{restaurantInfo?.cuisine || 'International Cuisine'}</span>
                                        <span>•</span>
                                        {isRestaurantOpen() ? (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                Open Now
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                Closed
                                            </span>
                                        )}
                                    </div>

                                    {/* Specialties */}
                                    {restaurantInfo?.specialties && restaurantInfo.specialties.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-semibold text-muted-foreground">Specialties:</span>
                                            {restaurantInfo.specialties.slice(0, 3).map((specialty: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="px-2.5 py-1 bg-muted/50 text-foreground rounded-md text-xs font-medium border border-border"
                                                >
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Dietary Options */}
                                    {restaurantInfo?.dietaryOptions && restaurantInfo.dietaryOptions.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {restaurantInfo.dietaryOptions.slice(0, 3).map((option: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="flex items-center gap-1 text-xs text-muted-foreground"
                                                >
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                    {option}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Rating */}
                                    {getTotalReviews() > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => {
                                                    const rating = parseFloat(getAverageRating());
                                                    return (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                            <span className="font-bold text-foreground">{getAverageRating()}</span>
                                            <span className="text-sm text-muted-foreground">
                                                ({getTotalReviews()} {getTotalReviews() === 1 ? 'review' : 'reviews'})
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 pt-2 flex-nowrap">
                                        <button
                                            onClick={() => router.push(`/user/reservation/${restaurantId}`)}
                                            className="group inline-flex items-center gap-2 bg-white dark:bg-card text-foreground px-4 py-2.5 rounded-lg font-semibold text-sm border-2 border-border hover:border-primary shadow-sm hover:shadow-md transition-all hover:scale-105 flex-shrink-0"
                                        >
                                            <Utensils className="w-4 h-4" />
                                            Reserve Table
                                            <span className="transition-transform group-hover:translate-x-1">→</span>
                                        </button>

                                        {restaurantInfo?.mapDirectionsLink && (
                                            <a
                                                href={restaurantInfo.mapDirectionsLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card text-foreground rounded-lg text-sm font-semibold border-2 border-border hover:border-primary shadow-sm hover:shadow-md transition-all hover:scale-105 flex-shrink-0"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                Direction
                                            </a>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* Compact Mobile/Tablet Content */}
                            <div className="lg:hidden space-y-4 mt-4 px-3 xs:px-4">
                                {/* Specialties */}
                                {restaurantInfo?.specialties && restaurantInfo.specialties.length > 0 && (
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground">Specialties:</span>
                                        {restaurantInfo.specialties.slice(0, 2).map((specialty: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-2.5 py-1 bg-muted/50 text-foreground rounded-md text-xs font-medium border border-border"
                                            >
                                                {specialty}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Dietary Options */}
                                {restaurantInfo?.dietaryOptions && restaurantInfo.dietaryOptions.length > 0 && (
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {restaurantInfo.dietaryOptions.slice(0, 2).map((option: string, index: number) => (
                                            <span
                                                key={index}
                                                className="flex items-center gap-1 text-xs text-muted-foreground"
                                            >
                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                {option}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Mobile Ratings Section */}
                                {getTotalReviews() > 0 && (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => {
                                                const rating = parseFloat(getAverageRating());
                                                return (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <span className="font-bold text-foreground text-sm">{getAverageRating()}</span>
                                        <span className="text-muted-foreground text-xs">
                                            ({getTotalReviews()} {getTotalReviews() === 1 ? 'review' : 'reviews'})
                                        </span>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-center gap-3 flex-nowrap">
                                    <button
                                        onClick={() => router.push(`/user/reservation/${restaurantId}`)}
                                        className="group inline-flex items-center gap-2 bg-white dark:bg-card text-foreground px-4 py-2.5 rounded-lg font-semibold text-sm border-2 border-border hover:border-primary shadow-sm transition-all flex-shrink-0"
                                    >
                                        <Utensils className="w-4 h-4" />
                                        Reserve Table
                                        <span className="transition-transform group-hover:translate-x-1">→</span>
                                    </button>

                                    {restaurantInfo?.mapDirectionsLink && (
                                        <a
                                            href={restaurantInfo.mapDirectionsLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card text-foreground rounded-lg text-sm font-semibold border-2 border-border hover:border-primary shadow-sm transition-all flex-shrink-0"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Direction
                                        </a>
                                    )}
                                </div>


                            </div>

                            {/* Enhanced Info Card - Right Side */}
                            <div className="relative hidden lg:block animate-fade-in">
                                <div className="bg-card border border-border rounded-2xl p-5 shadow-lg w-64 space-y-4 sticky top-20">
                                    {/* Open/Closed Status */}
                                    {isRestaurantOpen() ? (
                                        <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 py-2 rounded-lg">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-green-600 dark:text-green-400 font-bold text-sm">Open Now</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                                            <span className="text-red-600 dark:text-red-400 font-bold text-sm">Closed</span>
                                        </div>
                                    )}

                                    {/* Delivery Time */}
                                    {restaurantInfo?.deliveryTime && (
                                        <div className="flex items-center gap-3 text-foreground">
                                            <Clock className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-semibold">{restaurantInfo.deliveryTime} min</p>
                                                <p className="text-xs text-muted-foreground">Delivery time</p>
                                            </div>
                                        </div>
                                    )}



                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Compact Search and Filter Section */}
                <section className="sticky top-0 z-40 backdrop-blur">
                    <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-3 xs:py-4">
                        <div className="space-y-3 xs:space-y-4">
                            {/* Enhanced Search Bar */}
                            <div className="max-w-2xl mx-auto">
                                <div className="relative group search-container">
                                    <div className="flex items-center border border-border/50 rounded-2xl bg-background/50 backdrop-blur-sm px-4 py-3 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50 focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10">
                                        <Search className="w-5 h-5 text-muted-foreground mr-3 transition-colors group-focus-within:text-primary" />
                                        <input
                                            type="text"
                                            placeholder="Search for dishes, ingredients..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setSelectedSuggestionIndex(-1);
                                            }}
                                            onKeyDown={handleKeyDown}
                                            className="w-full bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground placeholder:font-normal"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="ml-2 p-1 rounded-full hover:bg-muted/50 transition-colors"
                                            >
                                                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        )}
                                    </div>
                                    {/* Smart Autocomplete Suggestions */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="search-suggestions absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                            <div className="p-2">
                                                <div className="text-xs text-muted-foreground px-3 py-2 border-b border-border/50 flex items-center gap-2">
                                                    <Search className="w-3 h-3" />
                                                    Smart suggestions
                                                </div>
                                                <div className="py-2">
                                                    {suggestions.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => {
                                                                setSearchTerm(suggestion);
                                                                setShowSuggestions(false);
                                                                setSelectedSuggestionIndex(-1);
                                                            }}
                                                            className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${index === selectedSuggestionIndex
                                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                                : 'hover:bg-muted/50'
                                                                }`}
                                                        >
                                                            <Search className="w-3 h-3 text-muted-foreground" />
                                                            <span className="text-sm text-foreground">{suggestion}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Enhanced Category Pills - Better mobile scrolling */}
                            <div className="category-pills-container flex flex-nowrap justify-start gap-2 xs:gap-3 pb-2">
                                {categories.map((category, index) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setActiveCategory(category.id)}
                                        className={`relative px-4 xs:px-5 py-2.5 text-xs xs:text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105 whitespace-nowrap animate-fade-in flex-shrink-0 border ${activeCategory === category.id
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-primary'
                                            : 'bg-background/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground border-border/50 hover:border-primary/50'
                                            }`}
                                    >
                                        {activeCategory === category.id && (
                                            <div className="absolute inset-0 bg-primary rounded-full transition-all duration-300" />
                                        )}
                                        <span className="relative z-10">{category.displayName}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Enhanced Search Results Info */}
                            {searchTerm && (
                                <div className="text-center animate-fade-in">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full border border-border/50">
                                        <Search className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            Found <span className="font-semibold text-foreground">{filteredItems.length}</span> item{filteredItems.length !== 1 ? 's' : ''} for
                                            <span className="font-medium text-primary ml-1">"{searchTerm}"</span>
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Compact Menu Items Grid */}
                <section className="container mx-auto p-1 xs:p-5 sm:p-6 lg:p-8 py-4 xs:py-5 sm:py-6">
                    <div className="max-w-6xl mx-auto">

                        {/* Enhanced Menu Items Grid - Mobile horizontal, Desktop grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5  xs:gap-5 sm:gap-6 pb-10">
                            {filteredItems.length === 0 ? (
                                <div className="col-span-full text-center py-12 xs:py-16 animate-fade-in">
                                    <div className="w-20 xs:w-24 h-20 xs:h-24 mx-auto mb-4 xs:mb-6 bg-muted/30 rounded-full flex items-center justify-center">
                                        <Search className="w-10 xs:w-12 h-10 xs:h-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg xs:text-xl font-semibold text-foreground mb-2">No items found</h3>
                                    <p className="text-muted-foreground text-sm xs:text-base px-4">
                                        Try adjusting your search or browse different categories
                                    </p>
                                </div>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="group animate-fade-in hover:card-hover transition-all duration-500 "
                                    >
                                        {/* Mobile: Clean Horizontal Layout */}
                                        <div
                                            onClick={() => router.push(`/user/menu/${restaurantId}/${item.id}`)}
                                            className="sm:hidden border border-border/70 rounded-2xl overflow-hidden dark:shadow-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/30 mb-4 "
                                        >
                                            <div className="flex items-center ml-5"> {/* <-- add items-center here */}
                                                {/* Mobile Image - Left Side */}
                                                <div className="relative w-24 h-24 flex-shrink-0 flex items-center">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        sizes="96px"
                                                        className="object-cover rounded-md"
                                                        priority={index < 4}
                                                    />
                                                    {/* Enhanced Mobile Badges - Simplified and repositioned */}
                                                    <div className="absolute -top-1 -right-1 flex flex-col gap-0.5 items-end">
                                                        {/* Discount Badge - Highest Priority */}
                                                        {hasDiscount(item) && (
                                                            <div className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-lg">
                                                                {getDiscountPercentage(item)}% OFF
                                                            </div>
                                                        )}

                                                        {/* Best Seller Badge - Only if no discount */}
                                                        {item.isBestSeller && !hasDiscount(item) && (
                                                            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg shadow-md border border-amber-400/30">
                                                                <div className="flex items-center px-1 py-0.5">
                                                                    <Award className="w-2.5 h-2.5" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Secondary badges on left side for mobile */}
                                                    <div className="absolute -top-1 -left-1 flex flex-col gap-0.5 items-start">
                                                        {/* Recommended Badge */}
                                                        {item.isRecommended && (
                                                            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-md border border-emerald-400/30">
                                                                <div className="flex items-center px-1 py-0.5">
                                                                    <Heart className="w-2.5 h-2.5 fill-current" />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Popular Badge - Only if not best seller or recommended */}
                                                        {!item.isBestSeller && !item.isRecommended && item.tags?.includes('Popular') && (
                                                            <div className="bg-primary text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-lg">
                                                                <Sparkles className="w-2 h-2" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!item.available && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                            <AlertCircle className="w-5 h-5 text-white" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Mobile Content - Right Side */}
                                                <div className="flex-1 p-4 flex flex-col justify-center">
                                                    <div className="space-y-2">
                                                        <h3 className="text-lg font-bold text-foreground line-clamp-1">
                                                            {item.name}
                                                        </h3>

                                                        {/* Rating and Status */}
                                                        <div className="flex items-center gap-2">
                                                          
                                                            {Number(item.rating) > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <GradientStar size={12} />
                                                                    <span className="text-sm font-semibold text-foreground">{item.rating.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {item.available ? (
                                                                <div className="flex items-center gap-1 text-green-600">
                                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                                    <span className="text-xs font-medium">Available</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-red-500">
                                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                                    <span className="text-xs font-medium">Unavailable</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            {Number(item.calories) > 0 && (
                                                                <span>{item.calories} cal</span>
                                                            )}
                                                            {item.preparationTime && item.preparationTime > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-2.5 h-2.5" />
                                                                    {item.preparationTime}m
                                                                </span>
                                                            )}

                                                        </div>
                                                    </div>

                                                    {/* Enhanced Price and Button */}
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex flex-col">
                                                            {hasDiscount(item) ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                                        {formatCurrency(item.discountPrice!, item.currency)}
                                                                    </span>
                                                                    <span className="text-sm text-gray-400 line-through">
                                                                        {formatCurrency(item.price, item.currency)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <p className="text-lg font-bold text-foreground">
                                                                    {formatCurrency(item.price, item.currency)}
                                                                </p>
                                                            )}

                                                            {/* Total Orders */}
                                                            {(item.totalOrders || 0) > 0 && (
                                                                <span className="text-xs text-gray-500">
                                                                    {item.totalOrders} orders
                                                                </span>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addToCart(item);
                                                            }}
                                                            disabled={!item.available}
                                                            className={`px-3 py-2 rounded-lg font-semibold transition-all text-xs hover:scale-105 active:scale-95 ${item.available
                                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                                                                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                                                                } ${isAnimating ? 'animate-pulse' : ''}`}
                                                        >
                                                            {item.available ? (
                                                                <div className="flex items-center gap-1">
                                                                    <ShoppingCart className="w-4 h-4" />
                                                                    <span>Add</span>
                                                                </div>
                                                            ) : (
                                                                <span>Unavailable</span>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop: Vertical Layout (unchanged) */}
                                        <div
                                            onClick={() => router.push(`/user/menu/${restaurantId}/${item.id}`)}
                                            className="hidden sm:block h-full bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer hover:border-primary/50"
                                        >
                                            {/* Enhanced Item Image with Better Layout */}
                                            <div className="relative h-44 overflow-hidden rounded-t-xl">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                    className="object-cover transition-all duration-700 group-hover:image-zoom"
                                                    priority={index < 4}
                                                />

                                                {/* Enhanced Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                                                {/* Enhanced Top Right Badges Container - Simplified */}
                                                <div className="absolute top-2 xs:top-3 right-2 xs:right-3 flex flex-col gap-1 xs:gap-1.5">
                                                    {/* Discount Badge - Highest Priority */}
                                                    {hasDiscount(item) && (
                                                        <div className="bg-red-500 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-bold shadow-lg animate-fade-in backdrop-blur-sm border border-white/20">
                                                            {getDiscountPercentage(item)}% OFF
                                                        </div>
                                                    )}

                                                    {/* Best Seller Badge - Only if no discount */}
                                                    {item.isBestSeller && !hasDiscount(item) && (
                                                        <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg shadow-md animate-fade-in backdrop-blur-sm border border-amber-400/30">
                                                            {/* Mobile: Icon only */}
                                                            <div className="flex items-center px-1.5 py-0.5 xs:hidden">
                                                                <Award className="w-3 h-3" />
                                                            </div>
                                                            {/* Tablet and up: Icon + Text */}
                                                            <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
                                                                <Award className="w-3 h-3" />
                                                                <span>Best Seller</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Top Left Badges - Secondary Priority */}
                                                <div className="absolute top-2 xs:top-3 left-2 xs:left-3 flex flex-col gap-1 xs:gap-1.5">
                                                    {/* Recommended Badge */}
                                                    {item.isRecommended && (
                                                        <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-md animate-fade-in backdrop-blur-sm border border-emerald-400/30">
                                                            {/* Mobile: Icon only */}
                                                            <div className="flex items-center px-1.5 py-0.5 xs:hidden">
                                                                <Heart className="w-3 h-3 fill-current" />
                                                            </div>
                                                            {/* Tablet and up: Icon + Text */}
                                                            <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
                                                                <Heart className="w-3 h-3 fill-current" />
                                                                <span>Recommended</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Popular Badge - Only if not best seller or recommended */}
                                                    {!item.isBestSeller && !item.isRecommended && item.tags?.includes('Popular') && (
                                                        <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold shadow-lg animate-fade-in backdrop-blur-sm border border-white/20">
                                                            <Sparkles className="w-2.5 xs:w-3 h-2.5 xs:h-3 inline mr-1" />
                                                            Popular
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bottom Left Info */}
                                                <div className="absolute bottom-2 xs:bottom-3 left-2 xs:left-3 right-2 xs:right-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 xs:gap-2">
                                                            {Number(item.rating) > 0 && (
                                                                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 xs:px-3 py-1">
                                                                    <GradientStar size={12} className="xs:w-4 xs:h-4" />
                                                                    <span className="text-white text-xs xs:text-sm font-semibold">{item.rating.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            {item.preparationTime && item.preparationTime > 0 && (
                                                                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 xs:px-3 py-1">
                                                                    <Clock className="w-3 xs:w-4 h-3 xs:h-4 text-white" />
                                                                    <span className="text-white text-xs xs:text-sm font-semibold">{item.preparationTime}m</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Enhanced Price Badge */}
                                                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs xs:text-sm font-bold shadow-lg backdrop-blur-sm border border-white/20 group-hover:price-glow transition-all duration-300">
                                                            {hasDiscount(item) ? (
                                                                <div className="flex items-center gap-1">
                                                                    <span>{formatCurrency(item.discountPrice!, item.currency)}</span>
                                                                    <span className="text-xs line-through opacity-70">{formatCurrency(item.price, item.currency)}</span>
                                                                </div>
                                                            ) : (
                                                                <span>{formatCurrency(item.price, item.currency)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Availability Overlay */}
                                                {!item.available && (
                                                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                                        <div className="text-white text-center px-4">
                                                            <AlertCircle className="w-8 xs:w-10 h-8 xs:h-10 mx-auto mb-2 animate-pulse" />
                                                            <p className="font-bold text-sm xs:text-base">Currently Unavailable</p>
                                                            <p className="text-xs xs:text-sm opacity-80 mt-1">Check back later</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Enhanced Item Details */}
                                            <div className="p-3 xs:p-4 sm:p-5 space-y-3 xs:space-y-4">
                                                {/* Title and Description */}
                                                <div className="space-y-2">
                                                    <h3 className="text-lg xs:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-muted-foreground text-sm xs:text-base leading-relaxed line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                </div>

                                                {/* Enhanced Info Pills - Reorganized for better mobile UX */}
                                                <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                                                    {/* Priority badges first */}
                                                    {hasDiscount(item) && (
                                                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 rounded-full px-2 py-1">
                                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-red-600 dark:text-red-400">{getDiscountPercentage(item)}% OFF</span>
                                                        </div>
                                                    )}

                                                    {/* Calories */}
                                                     
                                                    {Number(item.calories) > 0 && (
                                                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                            <span className="text-xs xs:text-sm font-medium text-foreground">{item.calories} cal</span>
                                                        </div>
                                                    )}

                                                    {/* Category */}
                                                    <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5">
                                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                        <span className="text-xs xs:text-sm font-medium text-primary">{getCategoryDisplayName(item.category, categoryMappings, customCategories)}</span>
                                                    </div>

                                                    {/* Vegetarian/Non-Veg - Only show one */}
                                                    {item.tags?.includes('Vegetarian') && (
                                                        <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/20 rounded-full px-3 py-1.5">
                                                            <span className="text-green-600 dark:text-green-400 text-xs">🟢</span>
                                                            <span className="text-xs xs:text-sm font-medium text-green-600 dark:text-green-400">Veg</span>
                                                        </div>
                                                    )}

                                                    {item.tags?.includes('Non-Vegetarian') && !item.tags?.includes('Vegetarian') && (
                                                        <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/20 rounded-full px-3 py-1.5">
                                                            <span className="text-red-600 dark:text-red-400 text-xs">🔴</span>
                                                            <span className="text-xs xs:text-sm font-medium text-red-600 dark:text-red-400">Non-Veg</span>
                                                        </div>
                                                    )}

                                                    {/* Special badges - Only show if space allows */}
                                                    {item.isBestSeller && (
                                                        <div className="hidden sm:flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 rounded-full px-2 py-1">
                                                            <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Best Seller</span>
                                                        </div>
                                                    )}

                                                    {item.isRecommended && (
                                                        <div className="hidden sm:flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-2 py-1">
                                                            <Heart className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-current" />
                                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Recommended</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Enhanced Price and Add to Cart */}
                                                <div className="flex items-center justify-between pt-3 xs:pt-4 border-t border-border/50">
                                                    <div className="space-y-1">
                                                        <div className="flex items-baseline gap-2">
                                                            {hasDiscount(item) ? (
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xl xs:text-2xl font-bold text-green-600 dark:text-green-400">
                                                                            {formatCurrency(item.discountPrice!, item.currency)}
                                                                        </p>
                                                                        <p className="text-sm xs:text-base text-gray-400 line-through">
                                                                            {formatCurrency(item.price, item.currency)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-xl xs:text-2xl font-bold text-foreground">
                                                                    {formatCurrency(item.price, item.currency)}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Total Orders */}
                                                        {(item.totalOrders || 0) > 0 && (
                                                            <div className="text-xs text-gray-500">
                                                                {item.totalOrders} orders
                                                            </div>
                                                        )}

                                                        {item.available ? (
                                                            <div className="flex items-center gap-1.5 text-xs xs:text-sm text-green-600 dark:text-green-400 animate-fade-in">
                                                                <CheckCircle className="w-3 xs:w-4 h-3 xs:h-4" />
                                                                <span className="font-medium">Available</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-xs xs:text-sm text-red-500">
                                                                <AlertCircle className="w-3 xs:w-4 h-3 xs:h-4" />
                                                                <span className="font-medium">Unavailable</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(item);
                                                        }}
                                                        disabled={!item.available}
                                                        className={`px-4 xs:px-6 py-2 xs:py-3 rounded-xl font-bold transition-all text-sm xs:text-base hover:scale-105 active:scale-95 shadow-lg ${item.available
                                                            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-xl hover:from-primary/90 hover:to-primary'
                                                            : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                                                            } ${isAnimating ? 'animate-pulse' : ''}`}
                                                    >
                                                        {item.available ? (
                                                            <div className="flex items-center gap-2">
                                                                <ShoppingCart className="w-5 h-5" />
                                                                <span className="hidden xs:inline">Add to Cart</span>
                                                                <span className="xs:hidden">Add</span>
                                                            </div>
                                                        ) : (
                                                            <span>Unavailable</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

            </div>
        </>
    );
}