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
    Star
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

    // Helper functions for enhanced display
    const hasDiscount = (item: EnhancedMenuItem) => {
        return !!(item.discountPrice && item.discountPrice < item.price);
    };

    const getDiscountPercentage = (item: EnhancedMenuItem) => {
        if (!hasDiscount(item)) return 0;
        return Math.round(((item.price - item.discountPrice!) / item.price) * 100);
    };

    const formatCurrency = (amount: number, currency: string = 'INR') => {
        const symbol = currency === 'INR' ? '₹' : '$';
        return `${symbol}${amount.toFixed(0)}`;
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
                        const enhancedItems: EnhancedMenuItem[] = menuResult.data.map((item: MenuItem) => ({
                            ...item,
                            discountPrice: (item as any).discountPrice,
                            currency: (item as any).currency || 'INR',
                            isBestSeller: (item as any).isBestSeller || false,
                            isRecommended: (item as any).isRecommended || false,
                            totalRatings: (item as any).totalRatings || 0,
                            totalOrders: (item as any).totalOrders || 0,
                            viewCount: (item as any).viewCount || 0,
                            orderCount: (item as any).orderCount || 0,
                        }));
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
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        <Image
                            src={restaurantInfo?.logoDataUrl || '/placeholder-restaurant.jpg'}
                            alt={restaurantInfo?.name || 'Restaurant'}
                            fill
                            className="object-cover"
                            sizes="100vw"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />

                        {/* Compact Mobile Overlay Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 xs:p-4 sm:p-6">
                            <div className="text-white space-y-1.5 xs:space-y-2 sm:space-y-3 animate-slide-up">
                                <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold leading-tight">
                                    {restaurantInfo?.name || 'Restaurant'}
                                </h1>
                                <p className="text-sm xs:text-base sm:text-lg opacity-90">Best restaurant in kanpur</p>
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
                                    <span className="flex items-center gap-1 text-green-400">
                                        <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-400 rounded-full animate-pulse" />
                                        Open Now
                                    </span>
                                </div>
                        </div>
                        </div>
                    </div>
                </div>

                <div className="relative container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-2 xs:py-3 sm:py-6 lg:py-8">
                    <div className="grid lg:grid-cols-[1fr_auto] gap-6 lg:gap-12 items-start animate-fade-in">
                        {/* Restaurant Info - Compact Desktop Layout */}
                        <div className="hidden lg:flex lg:flex-row gap-4 xl:gap-6">
                            <div className="relative group animate-fade-in">
                                <div className="relative w-48 xl:w-56 h-48 xl:h-56">
                                    <Image
                                        src={restaurantInfo?.logoDataUrl || '/placeholder-restaurant.jpg'}
                                        alt={restaurantInfo?.name || 'Restaurant'}
                                        fill
                                        className="object-cover rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl" />
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 animate-fade-in">
                                <div>
                                    <h1 className="text-2xl xl:text-3xl font-bold text-foreground mb-2">
                                        {restaurantInfo?.name || 'Restaurant'}
                                    </h1>
                                    <p className="text-base xl:text-lg text-muted-foreground mb-2">Best restaurant in kanpur</p>
                                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {restaurantInfo?.address?.city && restaurantInfo?.address?.state
                                                ? `${restaurantInfo.address.city}, ${restaurantInfo.address.state}`
                                                : 'Location'}
                                        </span>
                                        <span>•</span>
                                        <span>{restaurantInfo?.cuisine || 'International Cuisine'}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                            Open Now
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 text-black fill-current dark:text-white" />
                                            ))}
                                        </div>
                                        <span className="font-semibold text-foreground text-sm">4.6</span>
                                        <span className="text-muted-foreground text-sm">(324 reviews)</span>
                                    </div>
                                </div>

                                {/* Reserve Table Button */}
                                <div className="pt-4 animate-fade-in">
                                    <button
                                        onClick={() => router.push(`/user/reservation/${restaurantId}`)}
                                        className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 xl:px-6 py-2 xl:py-3 rounded-xl font-semibold text-sm xl:text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 hover:bg-primary/90"
                                    >
                                        <Utensils className="w-3 xl:w-4 h-3 xl:h-4" />
                                        Reserve Table
                                        <span className="transition-transform group-hover:translate-x-1">→</span>
                                    </button>
                                </div>

                               
                            </div>
                        </div>

                        {/* Compact Mobile/Tablet Content */}
                        <div className="lg:hidden space-y-3 xs:space-y-4 mt-3 xs:mt-4">
                            {/* Mobile Ratings Section */}
                            <div className="flex items-center justify-center gap-4 text-center">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-3 h-3 xs:w-4 xs:h-4 text-black fill-current dark:text-white" />
                                        ))}
                                    </div>
                                    <span className="font-semibold text-foreground text-xs xs:text-sm">4.6</span>
                                    <span className="text-muted-foreground text-xs">(324 reviews)</span>
                                </div>
                            </div>

                            {/* Mobile Reserve Table Button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={() => router.push(`/user/reservation/${restaurantId}`)}
                                    className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 xs:px-6 py-2 xs:py-3 rounded-xl font-semibold text-sm xs:text-base shadow-lg hover:shadow-xl transition-all hover:scale-105 hover:bg-primary/90 animate-fade-in"
                                >
                                    <Utensils className="w-4 h-4" />
                                    Reserve Table
                                    <span className="transition-transform group-hover:translate-x-1">→</span>
                                </button>
                            </div>

                            {/* Mobile Restaurant Description */}
                            {restaurantInfo?.description && (
                                <div className="text-center px-3 xs:px-4 animate-fade-in">
                                    <p className="text-muted-foreground leading-relaxed text-sm xs:text-base">
                                        {restaurantInfo.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Timing Card - Better responsive positioning */}
                        <div className="relative hidden lg:block animate-fade-in">
                            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-3 xl:p-4 shadow-lg w-48 xl:w-52 h-52 xl:h-56 flex flex-col justify-center space-y-2 xl:space-y-3 sticky top-20">
                                <div className="text-center space-y-2 xl:space-y-3">
                                    {/* Open/Closed Status */}
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2.5 xl:w-3 h-2.5 xl:h-3 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-green-600 dark:text-green-400 font-semibold text-sm xl:text-base">Open Now</span>
                                    </div>

                                    {/* Timing */}
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Clock className="w-4 xl:w-5 h-4 xl:h-5" />
                                        <span className="font-medium text-sm xl:text-base">25-35 min</span>
                                    </div>

                                    {/* Min Order */}
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Users className="w-4 xl:w-5 h-4 xl:h-5" />
                                        <span className="font-medium text-sm xl:text-base">Min order ₹299</span>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-full h-px bg-border/50" />

                                    {/* Additional Info */}
                                    <div className="space-y-1.5 xl:space-y-2">
                                        <div className="text-xs xl:text-sm text-muted-foreground">
                                            <span className="font-medium">Delivery:</span> Free above ₹499
                                        </div>
                                        <div className="text-xs xl:text-sm text-muted-foreground">
                                            <span className="font-medium">Payment:</span> Online & COD
                                        </div>
                                    </div>
                                </div>
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
                                                        className={`w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${
                                                            index === selectedSuggestionIndex 
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
                                                {/* Enhanced Mobile Badges */}
                                                <div className="absolute -top-1 -right-1 flex flex-col gap-1">
                                                    {/* Discount Badge */}
                                                    {hasDiscount(item) && (
                                                        <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                                                            {getDiscountPercentage(item)}% OFF
                                                        </div>
                                                    )}
                                                    
                                                    {/* Best Seller Badge */}
                                                    {item.isBestSeller && (
                                                        <div className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                                                            ⭐
                                                        </div>
                                                    )}
                                                    
                                                    {/* Recommended Badge */}
                                                    {item.isRecommended && (
                                                        <div className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                                                            ❤️
                                                        </div>
                                                    )}
                                                    
                                                    {/* Popular Badge (fallback) */}
                                                    {!item.isBestSeller && !item.isRecommended && item.tags?.includes('Popular') && (
                                                        <div className="bg-primary text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                                            <Sparkles className="w-2 h-2 inline mr-1" />
                                                            Popular
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
                                                        <div className="flex items-center gap-1">
                                                            <GradientStar size={12} />
                                                            <span className="text-sm font-semibold text-foreground">4.5</span>
                                                </div>
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
                                                        <span>{item.calories} cal</span>
                                                {item.preparationTime && (
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
                                            
                                            {/* Enhanced Top Right Badges Container */}
                                            <div className="absolute top-2 xs:top-3 right-2 xs:right-3 flex flex-col gap-1.5 xs:gap-2">
                                                {/* Discount Badge */}
                                                {hasDiscount(item) && (
                                                    <div className="bg-red-500 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-bold shadow-lg animate-fade-in backdrop-blur-sm border border-white/20">
                                                        {getDiscountPercentage(item)}% OFF
                                                    </div>
                                                )}
                                                
                                                {/* Best Seller Badge */}
                                                {item.isBestSeller && (
                                                    <div className="bg-yellow-500 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-bold shadow-lg animate-fade-in backdrop-blur-sm border border-white/20 group-hover:badge-glow transition-all duration-300">
                                                        <Sparkles className="w-2.5 xs:w-3 h-2.5 xs:h-3 inline mr-1" />
                                                        BESTSELLER
                                                    </div>
                                                )}
                                                
                                                {/* Recommended Badge */}
                                                {item.isRecommended && (
                                                    <div className="bg-green-500 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-bold shadow-lg animate-fade-in backdrop-blur-sm border border-white/20">
                                                        ❤️ Recommended
                                                    </div>
                                                )}
                                                
                                                {/* Popular Badge (fallback) */}
                                                {!item.isBestSeller && !item.isRecommended && item.tags?.includes('Popular') && (
                                                    <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold shadow-lg animate-fade-in backdrop-blur-sm border border-white/20 group-hover:badge-glow transition-all duration-300">
                                                        <Sparkles className="w-2.5 xs:w-3 h-2.5 xs:h-3 inline mr-1" />
                                                        Popular
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Left Info */}
                                            <div className="absolute bottom-2 xs:bottom-3 left-2 xs:left-3 right-2 xs:right-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 xs:gap-2">
                                                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 xs:px-3 py-1">
                                                            <GradientStar size={12} className="xs:w-4 xs:h-4" />
                                                            <span className="text-white text-xs xs:text-sm font-semibold">4.5</span>
                                                        </div>
                                                        {item.preparationTime && (
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

                                            {/* Enhanced Info Pills */}
                                            <div className="flex flex-wrap items-center gap-2 xs:gap-3">
                                                {/* Calories */}
                                                <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1.5">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                    <span className="text-xs xs:text-sm font-medium text-foreground">{item.calories} cal</span>
                                                </div>
                                                
                                                {/* Category */}
                                                <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5">
                                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                                    <span className="text-xs xs:text-sm font-medium text-primary">{getCategoryDisplayName(item.category, categoryMappings, customCategories)}</span>
                                                </div>
                                                
                                                {/* Vegetarian/Non-Veg */}
                                                {item.tags?.includes('Vegetarian') && (
                                                    <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/20 rounded-full px-3 py-1.5">
                                                        <span className="text-green-600 dark:text-green-400 text-xs">🟢</span>
                                                        <span className="text-xs xs:text-sm font-medium text-green-600 dark:text-green-400">Veg</span>
                                                    </div>
                                                )}
                                                
                                                {item.tags?.includes('Non-Vegetarian') && (
                                                    <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/20 rounded-full px-3 py-1.5">
                                                        <span className="text-red-600 dark:text-red-400 text-xs">🔴</span>
                                                        <span className="text-xs xs:text-sm font-medium text-red-600 dark:text-red-400">Non-Veg</span>
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