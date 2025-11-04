'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, Star, ChevronDown, MapPin, Heart, ChevronLeft, ChevronRight, Calendar, Users, UtensilsCrossed, X } from 'lucide-react';
import { getAllRestaurants, getFilteredRestaurants, getRestaurantRating, RestaurantSettings } from '@/app/(utils)/firebaseOperations';
import { useRouter } from 'next/navigation';

export default function RestaurantListingPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [restaurants, setRestaurants] = useState<RestaurantSettings[]>([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { averageRating: number; totalReviews: number }>>({});
    const [filters, setFilters] = useState({
        dietary: [] as string[],
        priceRange: [] as string[],
        amenities: [] as string[],
        cuisines: [] as string[]
    });
    const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('All Ratings');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('prompt');
    const [locationFetched, setLocationFetched] = useState(false);
    const [showAllRestaurants, setShowAllRestaurants] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<{
        restaurants: RestaurantSettings[];
        cuisines: string[];
        dishes: string[];
        popular: string[];
    }>({ restaurants: [], cuisines: [], dishes: [], popular: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const horizontalScrollRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const suggestionsRef = useRef<HTMLDivElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Location utility functions
    const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    const getUserLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationPermission('denied');
            setLocationFetched(true);
            return;
        }

        setLocationPermission('loading');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationPermission('granted');
                setLocationFetched(true);
            },
            (error) => {
                // console.error('Error getting location:', error);
                setLocationPermission('denied');
                setLocationFetched(true);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    }, []);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Fetch restaurants on component mount
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                setLoading(true);
                const result = await getAllRestaurants();
                if (result.success && result.data) {
                    setRestaurants(result.data);
                    setFilteredRestaurants(result.data);

                    // Fetch ratings for each restaurant
                    const ratingsData: Record<string, { averageRating: number; totalReviews: number }> = {};
                    for (const restaurant of result.data) {
                        if (restaurant.id) {
                            const ratingResult = await getRestaurantRating(restaurant.id);
                            if (ratingResult.success && ratingResult.data) {
                                ratingsData[restaurant.id] = {
                                    averageRating: ratingResult.data.averageRating,
                                    totalReviews: ratingResult.data.totalReviews
                                };
                            }
                        }
                    }
                    setRestaurantRatings(ratingsData);
                } else {
                    setError(result.error || 'Failed to fetch restaurants');
                }
            } catch (err) {
                setError('An error occurred while fetching restaurants');
                // console.error('Error fetching restaurants:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurants();
        getUserLocation();
    }, [getUserLocation]);



    // Apply filters when they change
    useEffect(() => {
        const applyFilters = async () => {
            if (restaurants.length === 0) return;

            try {
                const result = await getFilteredRestaurants({
                    searchQuery: debouncedSearchQuery || undefined,
                    dietary: filters.dietary,
                    priceRange: filters.priceRange,
                    amenities: filters.amenities,
                    cuisines: filters.cuisines
                });

                if (result.success && result.data) {
                    setFilteredRestaurants(result.data);
                } else {
                    // console.error('Error applying filters:', result.error);
                }
            } catch (err) {
                // console.error('Error applying filters:', err);
            }
        };

        const timeoutId = setTimeout(applyFilters, 300);
        return () => clearTimeout(timeoutId);
    }, [debouncedSearchQuery, filters, restaurants]);

    const handleFilterChange = useCallback((category: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [category]: prev[category as keyof typeof prev].includes(value)
                ? prev[category as keyof typeof prev].filter(item => item !== value)
                : [...prev[category as keyof typeof prev], value]
        }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters({
            dietary: [],
            priceRange: [],
            amenities: [],
            cuisines: []
        });
        setSearchQuery('');
        setSelectedRatingFilter('All Ratings');
        setShowSuggestions(false);
        setSuggestions({ restaurants: [], cuisines: [], dishes: [], popular: [] });
    }, []);

    const handleRatingSelect = useCallback((rating: string) => {
        setSelectedRatingFilter(rating);
    }, []);

    // Enhanced fuzzy search function
    const fuzzySearch = useCallback((query: string, text: string): boolean => {
        if (!query || !text) return false;

        const queryLower = query.toLowerCase();
        const textLower = text.toLowerCase();

        // Exact match gets highest priority
        if (textLower.includes(queryLower)) return true;

        // Fuzzy matching for typos and partial matches
        const queryWords = queryLower.split(' ');
        const textWords = textLower.split(' ');

        return queryWords.some(qWord =>
            textWords.some(tWord =>
                tWord.startsWith(qWord) ||
                qWord.startsWith(tWord) ||
                (qWord.length > 2 && tWord.includes(qWord))
            )
        );
    }, []);

    // Enhanced debounced search with fuzzy matching and better suggestions
    const debouncedSearch = useCallback((query: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        setIsSearching(query.length > 0);

        searchTimeoutRef.current = setTimeout(() => {
            if (query.trim().length > 0 && restaurants.length > 0) {
                const searchTerm = query.toLowerCase();

                // Search restaurants with fuzzy matching
                const matchingRestaurants = restaurants
                    .filter(restaurant =>
                        fuzzySearch(query, restaurant.name) ||
                        fuzzySearch(query, restaurant.cuisine || '') ||
                        fuzzySearch(query, restaurant.description || '') ||
                        restaurant.specialties?.some(specialty => fuzzySearch(query, specialty))
                    )
                    .sort((a, b) => {
                        // Sort by relevance (exact matches first)
                        const aExact = a.name.toLowerCase().includes(searchTerm);
                        const bExact = b.name.toLowerCase().includes(searchTerm);
                        if (aExact && !bExact) return -1;
                        if (!aExact && bExact) return 1;
                        return 0;
                    })
                    .slice(0, 5);

                // Search cuisines with fuzzy matching
                const allCuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))] as string[];
                const matchingCuisines = allCuisines
                    .filter(cuisine => fuzzySearch(query, cuisine))
                    .slice(0, 5);

                // Search dishes/specialties with fuzzy matching
                const allSpecialties = restaurants
                    .flatMap(r => r.specialties || [])
                    .filter(Boolean);
                const uniqueSpecialties = [...new Set(allSpecialties)];
                const matchingDishes = uniqueSpecialties
                    .filter(dish => fuzzySearch(query, dish))
                    .slice(0, 5);

                // Popular searches based on query
                const popularSearches = [
                    'Pizza', 'Burger', 'Chinese', 'Indian', 'Italian', 'Mexican',
                    'Fast Food', 'Desserts', 'Healthy', 'Vegetarian', 'Non-veg'
                ].filter(item => fuzzySearch(query, item)).slice(0, 3);

                setSuggestions({
                    restaurants: matchingRestaurants,
                    cuisines: matchingCuisines,
                    dishes: matchingDishes,
                    popular: popularSearches
                });
                setShowSuggestions(true);
            } else {
                setSuggestions({ restaurants: [], cuisines: [], dishes: [], popular: [] });
                setShowSuggestions(false);
            }
        }, 150); // Faster response time
    }, [restaurants, fuzzySearch]);

    // Handle search input changes with debouncing
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    }, [debouncedSearch]);

    // Get popular suggestions when input is empty
    const getPopularSuggestions = useCallback(() => {
        if (restaurants.length === 0) return { restaurants: [], cuisines: [], dishes: [], popular: [] };

        // Get top restaurants by rating
        const topRestaurants = restaurants
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 3);

        // Get most common cuisines
        const cuisineCounts = restaurants.reduce((acc, restaurant) => {
            if (restaurant.cuisine) {
                acc[restaurant.cuisine] = (acc[restaurant.cuisine] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const popularCuisines = Object.entries(cuisineCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cuisine]) => cuisine);

        // Get popular dishes from specialties
        const specialtyCounts = restaurants
            .flatMap(r => r.specialties || [])
            .reduce((acc, specialty) => {
                acc[specialty] = (acc[specialty] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        const popularDishes = Object.entries(specialtyCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([dish]) => dish);

        return {
            restaurants: topRestaurants,
            cuisines: popularCuisines,
            dishes: popularDishes,
            popular: []
        };
    }, [restaurants]);

    // Handle suggestion selection
    const handleSuggestionClick = useCallback((suggestion: string) => {
        setSearchQuery(suggestion);
        setDebouncedSearchQuery(suggestion);
        setShowSuggestions(false);
        setSuggestions({ restaurants: [], cuisines: [], dishes: [], popular: [] });
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Handle restaurant suggestion click
    const handleRestaurantClick = useCallback((restaurant: RestaurantSettings) => {
        setSearchQuery(restaurant.name);
        setShowSuggestions(false);
        setSuggestions({ restaurants: [], cuisines: [], dishes: [], popular: [] });
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile filter on outside click and escape key
    useEffect(() => {
        if (!isMobileFilterOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.mobile-filter-sidebar') && !target.closest('.mobile-filter-button')) {
                setIsMobileFilterOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMobileFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isMobileFilterOpen]);

    // Memoized helper functions
    const getRestaurantImage = useCallback((restaurant: RestaurantSettings) => {
        return restaurant.logoDataUrl || restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
    }, []);

    const getCuisineType = useCallback((restaurant: RestaurantSettings) => {
        return restaurant.cuisine || 'Multi-cuisine';
    }, []);

    const getDeliveryTime = useCallback((restaurant: RestaurantSettings) => {
        return restaurant.deliveryTime || '20-30 min';
    }, []);

    const getRating = useCallback((restaurant: RestaurantSettings) => {
        if (restaurant.id && restaurantRatings[restaurant.id]) {
            return restaurantRatings[restaurant.id].averageRating;
        }
        return restaurant.rating || 4.5;
    }, [restaurantRatings]);

    // Memoized active filters count
    const activeFiltersCount = useMemo(() => {
        return Object.values(filters).flat().length + (searchQuery.trim() ? 1 : 0) + (selectedRatingFilter !== 'All Ratings' ? 1 : 0);
    }, [filters, searchQuery, selectedRatingFilter]);

    // Memoized rating filter function
    const applyRatingFilter = useCallback((restaurants: RestaurantSettings[]) => {
        if (selectedRatingFilter === 'All Ratings') {
            return restaurants;
        }

        return restaurants.filter(restaurant => {
            const rating = getRating(restaurant);

            switch (selectedRatingFilter) {
                case '4.5+ Stars':
                    return rating >= 4.5;
                case '4.0+ Stars':
                    return rating >= 4.0;
                case '3.5+ Stars':
                    return rating >= 3.5;
                case '3.0+ Stars':
                    return rating >= 3.0;
                default:
                    return true;
            }
        });
    }, [selectedRatingFilter, getRating]);

    // Memoized filtered restaurants with location filtering
    const allRestaurants = useMemo(() => {
        let restaurants = applyRatingFilter(filteredRestaurants);

        // Apply location-based filtering if user location is available
        if (userLocation && !showAllRestaurants) {
            const nearbyRestaurants = restaurants.filter(restaurant => {
                if (!restaurant.location?.lat || !restaurant.location?.lng) return false;
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    restaurant.location.lat,
                    restaurant.location.lng
                );
                return distance <= 50; // Within 50km
            });

            // If we have nearby restaurants, use them; otherwise show all restaurants
            if (nearbyRestaurants.length > 0) {
                restaurants = nearbyRestaurants;
            } else {
                setShowAllRestaurants(true); // Automatically show all restaurants if none nearby
            }
        }

        // Sort by distance if location is available
        if (userLocation) {
            restaurants = restaurants.sort((a, b) => {
                if (!a.location?.lat || !a.location?.lng || !b.location?.lat || !b.location?.lng) return 0;
                const distanceA = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    a.location.lat,
                    a.location.lng
                );
                const distanceB = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    b.location.lat,
                    b.location.lng
                );
                return distanceA - distanceB;
            });
        }

        return restaurants;
    }, [filteredRestaurants, applyRatingFilter, userLocation, showAllRestaurants, calculateDistance]);

    // Memoized helper function to get total reviews
    const getTotalReviews = useCallback((restaurant: RestaurantSettings) => {
        if (restaurant.id && restaurantRatings[restaurant.id]) {
            return restaurantRatings[restaurant.id].totalReviews;
        }
        return 0;
    }, [restaurantRatings]);

    // Memoized helper function to get restaurant type badge
    const getRestaurantTypeBadge = useCallback((restaurant: RestaurantSettings) => {
        if (!restaurant.restaurantType) return null;

        const typeColors = {
            'Veg': 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200',
            'Non-Veg': 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200',
            'Both': 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200'
        };

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[restaurant.restaurantType]}`}>
                {restaurant.restaurantType}
            </span>
        );
    }, []);

    // Toggle favorite
    const toggleFavorite = useCallback((restaurantId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(restaurantId)) {
                newFavorites.delete(restaurantId);
            } else {
                newFavorites.add(restaurantId);
            }
            return newFavorites;
        });
    }, []);

    // Horizontal scroll functions
    const scrollLeft = useCallback(() => {
        if (horizontalScrollRef.current) {
            horizontalScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    }, []);

    const scrollRight = useCallback(() => {
        if (horizontalScrollRef.current) {
            horizontalScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    }, []);


    if (loading || !locationFetched) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-slate-300 mx-auto mb-3"></div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {loading ? 'Loading restaurants...' : 'Detecting your location...'}
                    </h3>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Something went wrong</h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-3 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-2 bg-gray-900 dark:bg-slate-700 text-white rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-slate-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
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

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Mobile Filter Overlay */}
                {isMobileFilterOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden" />
                )}

                {/* Main Content */}
                <main className="flex-1">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                        {/* Search Bar */}
                        <div className="mb-6 sm:mb-8">
                            <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto relative  sm:px-0">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    </div>
                                    <input
                                        ref={searchInputRef}
                                        className="block w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base shadow-sm"
                                        placeholder="Search restaurants, cuisines..."
                                        type="search"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        onFocus={() => {
                                            if (searchQuery.trim().length === 0) {
                                                const popularSuggestions = getPopularSuggestions();
                                                setSuggestions({
                                                    ...popularSuggestions,
                                                    popular: popularSuggestions.popular || []
                                                });
                                                setShowSuggestions(true);
                                            } else if (suggestions.restaurants.length > 0 || suggestions.cuisines.length > 0 || suggestions.dishes.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setShowSuggestions(false);
                                                setSuggestions({ restaurants: [], cuisines: [], dishes: [], popular: [] });
                                            }}
                                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 touch-manipulation"
                                        >
                                            <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                                        </button>
                                    )}
                                </div>

                                {/* Search Suggestions Dropdown */}
                                {showSuggestions && (
                                    <div
                                        ref={suggestionsRef}
                                        className="absolute top-full left-0 right-0 mt-1 sm:mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 sm:py-2 z-50 max-h-60 sm:max-h-80 overflow-y-auto overflow-x-hidden"
                                    >
                                        {searchQuery.trim().length > 0 ? (
                                            <>
                                                {/* Restaurants */}
                                                {suggestions.restaurants.length > 0 && (
                                                    <>
                                                        <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                                            Restaurants
                                                        </div>
                                                        {suggestions.restaurants.map((restaurant, index) => (
                                                            <button
                                                                key={`restaurant-${index}`}
                                                                onClick={() => handleRestaurantClick(restaurant)}
                                                                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 sm:gap-3 group rounded-lg mx-1 sm:mx-2 touch-manipulation"
                                                            >
                                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                                    <img
                                                                        src={getRestaurantImage(restaurant)}
                                                                        alt={restaurant.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate">
                                                                        {restaurant.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                        {restaurant.cuisine} • {restaurant.address?.city}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                    <Star className="w-3 h-3" fill="url(#starGradient)" stroke="none" />
                                                                    <span className="font-medium">{getRating(restaurant)}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}

                                                {/* Cuisines */}
                                                {suggestions.cuisines.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                                                            Cuisines
                                                        </div>
                                                        {suggestions.cuisines.map((cuisine, index) => (
                                                            <button
                                                                key={`cuisine-${index}`}
                                                                onClick={() => handleSuggestionClick(cuisine)}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-3 group rounded-lg mx-2"
                                                            >
                                                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                                                    <span className="text-lg">🍽️</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                                        {cuisine}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                        Cuisine
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}

                                                {/* Dishes */}
                                                {suggestions.dishes.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                                                            Dishes
                                                        </div>
                                                        {suggestions.dishes.map((dish, index) => (
                                                            <button
                                                                key={`dish-${index}`}
                                                                onClick={() => handleSuggestionClick(dish)}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-3 group rounded-lg mx-2"
                                                            >
                                                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                                                    <span className="text-lg">🍴</span>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                                        {dish}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                        Popular dish
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="px-4 py-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                                    Popular
                                                </div>
                                                {getPopularSuggestions().restaurants.map((restaurant, index) => (
                                                    <button
                                                        key={`popular-restaurant-${index}`}
                                                        onClick={() => handleRestaurantClick(restaurant)}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-3 group rounded-lg mx-2"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={getRestaurantImage(restaurant)}
                                                                alt={restaurant.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                                {restaurant.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {restaurant.cuisine} • {restaurant.address?.city}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <Star className="w-3 h-3" fill="url(#starGradient)" stroke="none" />
                                                            <span className="font-medium">{getRating(restaurant)}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                            {/* Sidebar */}
                            <aside className={`
                        fixed lg:sticky top-0 left-0 h-full lg:h-auto
                        w-80 sm:w-72 lg:w-64 xl:w-72 2xl:w-80 
                            flex-shrink-0 order-1 lg:order-1 z-50 lg:z-auto
                        transform transition-all duration-500 ease-out lg:transform-none
                        ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        mobile-filter-sidebar
                    `}>
                                <div className="sticky top-2 xl:top-4 h-full xl:h-auto">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 h-full xl:h-auto overflow-y-auto">
                                        {/* Mobile Header */}
                                        <div className="flex items-center justify-between mb-4 lg:hidden">
                                            <div>
                                                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-[#87C6FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                                                    </svg>
                                                    Filters
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Refine your search</p>
                                            </div>
                                            <button
                                                onClick={() => setIsMobileFilterOpen(false)}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                                            >
                                                <X className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
                                            </button>
                                        </div>

                                        {/* Clear All Filters Button */}
                                        {activeFiltersCount > 0 && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={clearAllFilters}
                                                    className="cursor-pointer w-full px-3 py-3 text-xs font-medium text-white hover:bg-gray-900 bg-gray-700 border border-gray-800 rounded-lg transition-all duration-300 shadow-lg hover:shadow-black/30"
                                                >
                                                    Clear All Filters ({activeFiltersCount})
                                                </button>
                                            </div>
                                        )}

                                        {/* Dietary Preferences */}
                                        <div className="mb-4">
                                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Dietary Preferences</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'].map((item) => (
                                                    <label key={item} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={filters.dietary.includes(item)}
                                                            onChange={() => handleFilterChange('dietary', item)}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cuisines */}
                                        <div className="mb-4">
                                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Cuisines</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                {['Italian', 'Indian', 'Chinese', 'Mexican', 'Japanese'].map((item) => (
                                                    <label key={item} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={filters.cuisines.includes(item)}
                                                            onChange={() => handleFilterChange('cuisines', item)}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rating & Sort Filter */}
                                        <div className="mb-4">
                                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Rating & Sort</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                {[
                                                    { value: 'All Ratings', label: 'All Ratings (Default)' },
                                                    { value: '4.0+ Stars', label: '4.0+ Stars' },
                                                    { value: '3.0+ Stars', label: '3.0+ Stars' },
                                                    { value: '2.0+ Stars', label: '2.0+ Stars' },
                                                    { value: 'Popularity', label: 'Most Popular' },
                                                    { value: 'Price: Low to High', label: 'Price: Low to High' },
                                                    { value: 'Price: High to Low', label: 'Price: High to Low' }
                                                ].map((option) => (
                                                    <label key={option.value} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                                                        <input
                                                            type="radio"
                                                            name="rating-sort-filter"
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                                            checked={selectedRatingFilter === option.value}
                                                            onChange={() => handleRatingSelect(option.value)}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>



                                        {/* Amenities */}
                                        <div>
                                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Amenities</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                {['Outdoor Seating', 'Wi-Fi', 'Pet-Friendly'].map((item) => (
                                                    <label key={item} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={filters.amenities.includes(item)}
                                                            onChange={() => handleFilterChange('amenities', item)}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{item}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Main Content Area */}
                            <div className="lg:col-span-3 order-2 lg:order-2">
                                {/* Mobile Header & Filter Button */}
                                <div className="flex items-center justify-between mb-4 lg:hidden">
                                    <div>
                                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Restaurants</h1>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Discover amazing places to dine</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMobileFilterOpen(true)}
                                        className="mobile-filter-button flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black text-white font-medium text-xs hover:from-[#76B8FE] hover:to-[#AC9FFF] transition-all duration-300 shadow-lg hover:shadow-[#87C6FE]/25"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                                        </svg>
                                        <span>Filter</span>
                                        {activeFiltersCount > 0 && (
                                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-medium">
                                                {activeFiltersCount}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Filter Controls */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
                                    <button
                                        onClick={() => setShowAllRestaurants(!showAllRestaurants)}
                                        className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-indigo-600 text-indigo-600 rounded-full text-xs sm:text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 hover:scale-105 touch-manipulation"
                                    >
                                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Show Nearby Only</span>
                                        <span className="sm:hidden">Nearby</span>
                                    </button>
                                </div>

                                {/* Featured Restaurants */}
                                <section>
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <Star fill="gray" stroke="none" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 mr-2" />
                                            <span className="hidden sm:inline">Featured Restaurants</span>
                                            <span className="sm:hidden">Featured</span>
                                        </h2>
                                        <div className="flex space-x-2 hidden lg:flex">
                                            <button
                                                onClick={scrollLeft}
                                                className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                aria-label="Scroll left"
                                            >
                                                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            <button
                                                onClick={scrollRight}
                                                className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                aria-label="Scroll right"
                                            >
                                                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">Top-rated restaurants for dining & delivery</p>

                                    <div
                                        ref={horizontalScrollRef}
                                        className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-2 sm:pb-3 scroll-smooth [&::-webkit-scrollbar]:hidden"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {allRestaurants.slice(0, 3).map((restaurant, index) => (
                                            <div
                                                key={`featured-${restaurant.id || index}`}
                                                className="flex-shrink-0 w-64 sm:w-72 lg:w-80 cursor-pointer group"
                                                onClick={() => router.push(`/user/menu/${restaurant.id}`)}
                                            >
                                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
                                                    <div className="relative">
                                                        <img
                                                            alt={restaurant.name}
                                                            className="h-40 sm:h-48 w-full object-cover"
                                                            src={getRestaurantImage(restaurant)}
                                                        />
                                                        <div className="absolute top-2 right-2 bg-black/50 p-1.5 sm:p-2 rounded-full">
                                                            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${favorites.has(restaurant.id || '') ? 'text-red-500 fill-current' : 'text-white'}`} />
                                                        </div>
                                                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                            {restaurant.restaurantType || 'Veg'}
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">
                                                            {getDeliveryTime(restaurant)}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 sm:p-4">
                                                        <h3 className="text-lg sm:text-xl font-semibold mb-1 text-gray-900 dark:text-white">{restaurant.name}</h3>
                                                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                            <Star className="h-3 w-3 sm:h-4 sm:w-4" fill="url(#starGradient)" stroke="none" />
                                                            <span className="ml-1">{getRating(restaurant)}</span>
                                                            <span className="mx-2">•</span>
                                                            <span>{getTotalReviews(restaurant)} reviews</span>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2">{restaurant.description || 'Best restaurant in town'}</p>
                                                        <div className="flex items-center space-x-2 text-xs mb-3 sm:mb-4">
                                                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">{getCuisineType(restaurant)}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/user/menu/${restaurant.id}`);
                                                                }}
                                                                className="cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 touch-manipulation w-full sm:w-auto shadow-sm hover:shadow-md"
                                                            >

                                                                <span>View Menu</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/user/reservation/${restaurant.id}`);
                                                                }}
                                                                className="cursor-pointer bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 hover:scale-105 touch-manipulation w-full sm:w-auto shadow-sm hover:shadow-lg"
                                                            >
                                                                Book Table
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* All Restaurants */}
                                <section className="mt-8 sm:mt-10 lg:mt-12">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                            <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-500 mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">All Restaurants</span>
                                            <span className="sm:hidden">All</span>
                                        </h2>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">Found {allRestaurants.length} restaurants for dining & delivery</p>

                                    <div className="space-y-4 sm:space-y-6">
                                        {allRestaurants.map((restaurant, index) => (
                                            <div
                                                key={restaurant.id || index}
                                                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col sm:flex-row transform hover:shadow-xl transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02]"
                                            >
                                                <img
                                                    alt={restaurant.name}
                                                    className="w-full sm:w-48 lg:w-56 object-cover"
                                                    src={getRestaurantImage(restaurant)}
                                                />
                                                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
                                                    <div>
                                                        <h3 className="text-lg sm:text-xl font-semibold mb-1 text-gray-900 dark:text-white">{restaurant.name}</h3>
                                                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">

                                                            <Star className="h-3 w-3 sm:h-4 sm:w-4" fill="url(#starGradient)" stroke="none" />
                                                            <span className="ml-1">{getRating(restaurant)}</span>
                                                            <span className="mx-2">•</span>
                                                            <span>{getTotalReviews(restaurant)} reviews</span>
                                                            <span className="mx-2">•</span>
                                                            <span>{getCuisineType(restaurant)}</span>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2">{restaurant.description || 'Best restaurant in town'}</p>
                                                        <div className="flex items-center space-x-2 text-xs mb-2 sm:mb-3">
                                                            {restaurant.specialties?.slice(0, 2).map((specialty, idx) => (
                                                                <span key={idx} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">{specialty}</span>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            <span className="ml-1">{restaurant.address?.city}, {restaurant.address?.state}</span>
                                                            {userLocation && restaurant.location && (
                                                                <>
                                                                    <span className="mx-2">•</span>
                                                                    <span>{calculateDistance(
                                                                        userLocation.lat,
                                                                        userLocation.lng,
                                                                        restaurant.location.lat,
                                                                        restaurant.location.lng
                                                                    ).toFixed(1)}km</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/user/menu/${restaurant.id}`);
                                                            }}
                                                            className="cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105 touch-manipulation shadow-sm hover:shadow-md"
                                                        >
                                                            View Menu
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/user/reservation/${restaurant.id}`);
                                                            }}
                                                            className="cursor-pointer bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium flex-1 hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 hover:scale-105 touch-manipulation shadow-sm hover:shadow-lg"
                                                        >
                                                            Book Table
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}