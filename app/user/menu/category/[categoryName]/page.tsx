'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, use } from 'react';
import { Plus, ChevronLeft, ChevronRight, Star, Clock, MapPin, Filter, SortAsc, Heart, Share2, Info, Shield, Leaf, Zap, Flame, ChevronDown, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getAllRestaurants, getAllMenuItems, getMenuItemsRatings, RestaurantSettings, MenuItem as FirebaseMenuItem } from '@/app/(utils)/firebaseOperations';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  calories: number;
  category: string;
  allergens: string[];
  ingredients: string | string[];
  isGlutenFree: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  preparationTime: number;
  rating: number;
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'very-hot';
  tags: string[];
  available: boolean;
  adminId: string;
  restaurantLocation?: {
    lat: number;
    lng: number;
  } | null;
  restaurantAddress?: {
    street: string;
    city: string;
    postalCode: string;
    state: string;
  } | null;
}

interface Restaurant {
  id: string;
  name: string;
  image?: string;
  rating?: number;
  deliveryTime?: string;
  cuisine?: string;
  location: string;
  offer?: string;
  priceRange?: string;
  specialties?: string[];
  dietaryOptions?: string[];
  isVeg?: boolean;
  isNonVeg?: boolean;
  isPureVeg?: boolean;
  distance?: string;
  deliveryFee?: number;
  minimumOrder?: number;
  address: {
    street: string;
    city: string;
    postalCode: string;
    state: string;
  };
  phone: string;
  email: string;
}

const filterOptions = [
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥬' },
  { id: 'vegan', name: 'Vegan', icon: '🌱' },
  { id: 'gluten-free', name: 'Gluten Free', icon: '🌾' },
  { id: 'low-calorie', name: 'Low Calorie', icon: '💪' },
  { id: 'quick-prep', name: 'Quick Prep', icon: '⚡' },
  { id: 'spicy', name: 'Spicy', icon: '🌶️' }
];

const sortOptions = [
  { id: 'relevance', name: 'Relevance' },
  { id: 'rating', name: 'Rating' },
  { id: 'price-low', name: 'Price: Low to High' },
  { id: 'price-high', name: 'Price: High to Low' },
  { id: 'prep-time', name: 'Prep Time' },
  { id: 'calories', name: 'Calories' },
  { id: 'distance', name: 'Distance' }
];

export default function CategoryPage({ params }: { params: Promise<{ categoryName: string }> }) {
  const { categoryName: encodedCategoryName } = use(params);
  const categoryName = decodeURIComponent(encodedCategoryName);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ratings, setRatings] = useState<{ [menuItemId: string]: { average: number; count: number } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('prompt');
  const [showAllItems, setShowAllItems] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [locationFetched, setLocationFetched] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Function to get restaurant image from database
  const getRestaurantImage = useCallback((restaurant: RestaurantSettings) => {
    return restaurant.logoDataUrl || restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
  }, []);

  // Function to calculate distance between two coordinates using Haversine formula
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

  // Function to get user's current location
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
        console.error('Error getting location:', error);
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

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch restaurants, menu items, and ratings in parallel
        const [restaurantsResult, menuItemsResult, ratingsResult] = await Promise.all([
          getAllRestaurants(),
          getAllMenuItems(),
          getMenuItemsRatings()
        ]);

        if (restaurantsResult.success && menuItemsResult.success && ratingsResult.success && restaurantsResult.data && menuItemsResult.data) {
          // Transform restaurant data to match our interface
          const transformedRestaurants: Restaurant[] = restaurantsResult.data.map((restaurant: RestaurantSettings) => ({
            id: restaurant.id || '',
            name: restaurant.name,
            image: getRestaurantImage(restaurant),
            rating: restaurant.rating || 4.0,
            deliveryTime: restaurant.deliveryTime || '30-45 mins',
            cuisine: restaurant.cuisine || 'Multi-cuisine',
            location: restaurant.address?.city || 'Unknown',
            offer: 'Special Offer',
            priceRange: '₹200-₹800',
            specialties: restaurant.specialties || ['Popular'],
            dietaryOptions: restaurant.dietaryOptions || ['Vegetarian'],
            isVeg: restaurant.restaurantType === 'Veg' || restaurant.restaurantType === 'Both',
            isNonVeg: restaurant.restaurantType === 'Non-Veg' || restaurant.restaurantType === 'Both',
            isPureVeg: restaurant.restaurantType === 'Veg',
            distance: '2.5 km',
            deliveryFee: 25,
            minimumOrder: 199,
            address: restaurant.address,
            phone: restaurant.phone,
            email: restaurant.email
          }));

          // Transform menu items data with location information
          const transformedMenuItems: MenuItem[] = menuItemsResult.data.map((item: FirebaseMenuItem) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image,
            calories: item.calories,
            category: item.category,
            allergens: item.allergens || [],
            ingredients: item.ingredients,
            isGlutenFree: item.isGlutenFree,
            isVegan: item.isVegan,
            isVegetarian: item.isVegetarian,
            preparationTime: item.preparationTime,
            rating: item.rating,
            spiceLevel: item.spiceLevel,
            tags: item.tags || [],
            available: item.available ?? item.isAvailable,
            adminId: item.adminId,
            restaurantLocation: item.restaurantLocation,
            restaurantAddress: item.restaurantAddress
          }));

          setRestaurants(transformedRestaurants);
          setMenuItems(transformedMenuItems);
          if (ratingsResult.data) {
            setRatings(ratingsResult.data);
          }
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    getUserLocation();
  }, [getRestaurantImage, getUserLocation]);

  // Filter and sort all items (without pagination)
  const allFilteredItems = useMemo(() => {
    // First filter by category/search and dietary filters
    let items = menuItems.filter(item => {
    const categoryMatch = item.category.toLowerCase().includes(categoryName.toLowerCase());
    const nameMatch = item.name.toLowerCase().includes(categoryName.toLowerCase());
    const descriptionMatch = item.description.toLowerCase().includes(categoryName.toLowerCase());
    
    const searchMatch = categoryMatch || nameMatch || descriptionMatch;
    
    const filterMatch = selectedFilters.length === 0 || selectedFilters.some(filter => {
      switch (filter) {
        case 'vegetarian': return item.isVegetarian;
        case 'vegan': return item.isVegan;
        case 'gluten-free': return item.isGlutenFree;
        case 'low-calorie': return item.calories <= 300;
        case 'quick-prep': return item.preparationTime <= 15;
        case 'spicy': return item.spiceLevel === 'hot' || item.spiceLevel === 'very-hot';
        default: return false;
      }
    });

    return searchMatch && filterMatch;
    });

    // Apply location-based filtering if user location is available
    if (userLocation && !showAllItems) {
      const nearbyItems = items.filter(item => {
        if (!item.restaurantLocation) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          item.restaurantLocation.lat,
          item.restaurantLocation.lng
        );
        return distance <= 50; // Within 50km
      });

      // If we have nearby items, use them; otherwise show all items
      if (nearbyItems.length > 0) {
        items = nearbyItems;
      } else {
        setShowAllItems(true); // Automatically show all items if none nearby
      }
    }

    // Sort the items
    return items.sort((a, b) => {
    switch (sortBy) {
      case 'rating': 
        const ratingA = ratings[a.id] ? ratings[a.id].average : 0;
        const ratingB = ratings[b.id] ? ratings[b.id].average : 0;
        return ratingB - ratingA;
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'prep-time': return a.preparationTime - b.preparationTime;
      case 'calories': return a.calories - b.calories;
        case 'distance':
          if (!userLocation || !a.restaurantLocation || !b.restaurantLocation) return 0;
          const distanceA = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            a.restaurantLocation.lat,
            a.restaurantLocation.lng
          );
          const distanceB = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            b.restaurantLocation.lat,
            b.restaurantLocation.lng
          );
          return distanceA - distanceB;
        case 'relevance':
        default: 
          // For relevance, prioritize by distance if location is available
          if (userLocation && a.restaurantLocation && b.restaurantLocation) {
            const distanceA = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              a.restaurantLocation.lat,
              a.restaurantLocation.lng
            );
            const distanceB = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              b.restaurantLocation.lat,
              b.restaurantLocation.lng
            );
            return distanceA - distanceB;
          }
          // If no location data, sort by rating as fallback
          const fallbackRatingA = ratings[a.id] ? ratings[a.id].average : 0;
          const fallbackRatingB = ratings[b.id] ? ratings[b.id].average : 0;
          return fallbackRatingB - fallbackRatingA;
      }
    });
  }, [menuItems, categoryName, selectedFilters, userLocation, showAllItems, ratings, sortBy, calculateDistance]);

  // Get paginated items
  const filteredItems = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * itemsPerPage;
    return allFilteredItems.slice(startIndex, endIndex);
  }, [allFilteredItems, currentPage, itemsPerPage]);

  // Update hasMoreItems when allFilteredItems changes
  useEffect(() => {
    setHasMoreItems(filteredItems.length < allFilteredItems.length);
  }, [filteredItems.length, allFilteredItems.length]);

  const addToCart = (item: MenuItem) => {
    // Here you would typically add the item to a cart context or state management
    console.log('Added to cart:', item.name);
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Infinite scroll functionality
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMoreItems) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setIsLoadingMore(false);
    }, 500); // Simulate loading delay
  }, [isLoadingMore, hasMoreItems]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreItems && !isLoadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMoreItems, hasMoreItems, isLoadingMore]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilters, sortBy, showAllItems, userLocation]);

  // Loading state - wait for both data and location
  if (loading || !locationFetched) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? `Loading ${categoryName} items...` : 'Detecting your location...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Info className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          <Link 
            href="/user/menu"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Menu</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        {/* Category Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 capitalize">
            {categoryName}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {filteredItems.length} items available
          </p>
            
            {/* Location Status Indicator */}
            {locationPermission === 'granted' && userLocation && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs sm:text-sm">
                  {showAllItems ? 'Showing all items' : 'Showing items within 50km'}
                </span>
              </div>
            )}
            
            {locationPermission === 'denied' && (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <MapPin className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Location access denied - showing all items</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-3 w-3" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <div className="flex items-center gap-1.5">
              <SortAsc className="h-3 w-3 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded px-2 py-1.5 text-xs border-0 focus:ring-2 focus:ring-gray-500 min-w-[120px]"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
            
            {/* Location Toggle */}
            {userLocation && (
              <button
                onClick={() => setShowAllItems(!showAllItems)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                  showAllItems 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {showAllItems ? 'Show Nearby Only' : 'Show All Items'}
                </span>
                <span className="sm:hidden">
                  {showAllItems ? 'Nearby' : 'All'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                    selectedFilters.includes(filter.id)
                      ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{filter.icon}</span>
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-14">
          {filteredItems.map((item) => (
            <div key={item.id} className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/5 bg-background/70 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300">
              <div className="relative">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
                  }}
                />
                {!item.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Unavailable
                    </span>
                  </div>
                )}
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                    favorites.includes(item.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <Heart className={`h-3 w-3 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3" fill="url(#starGradient)" stroke="none" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {ratings[item.id] ? ratings[item.id].average.toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{item.description}</p>

                {/* Restaurant name and address */}
                <div className="mb-2">
                  <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                    {restaurants.find(r => r.id === item.adminId)?.name || 'Restaurant'}
                  </p>
                    {userLocation && item.restaurantLocation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            item.restaurantLocation.lat,
                            item.restaurantLocation.lng
                          ).toFixed(1)}km
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                    {item.restaurantAddress?.city || restaurants.find(r => r.id === item.adminId)?.address?.city || 'Location'}
                  </p>
                </div>

                {/* Quick dietary info */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.isVegetarian && (
                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                      Veg
                    </span>
                  )}
                  {item.isVegan && (
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                      Vegan
                    </span>
                  )}
                  {item.isGlutenFree && (
                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                      GF
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">₹{item.price}</p>
                  </div>
                  <button 
                    onClick={() => addToCart(item)}
                    disabled={!item.available}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded text-xs hover:bg-gray-700 dark:hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Infinite Scroll Loading */}
        {hasMoreItems && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Loading more items...</span>
              </div>
            ) : (
              <div className="text-gray-400 dark:text-gray-600 text-sm">
                Scroll down to load more items
              </div>
            )}
          </div>
        )}

        {/* No more items message */}
        {!hasMoreItems && filteredItems.length > 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 text-sm">
              You've reached the end of the list
            </div>
          </div>
        )}


        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Filter className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No items found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters to see more items.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}