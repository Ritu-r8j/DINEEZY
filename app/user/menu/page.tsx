'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Edit, Clock, MapPin, SortAsc, Heart, Share2, Info, Shield, Leaf, Zap, Flame, ChevronDown, Loader2, Filter, Award } from 'lucide-react';
import Link from 'next/link';
import { getAllRestaurants, getAllMenuItems, getFilteredMenuItems, getMenuItemsRatings, RestaurantSettings, MenuItem as FirebaseMenuItem, getRestaurantRating } from '@/app/(utils)/firebaseOperations';
import { useRouter } from 'next/navigation';
import { CartManager } from '@/app/(utils)/cartUtils';
import { useCart } from '@/app/(contexts)/CartContext';
import { DEFAULT_CATEGORIES } from '@/lib/categoryData';

import GradientStar from '@/components/ui/GradientStar';

// Filter Icons SVG Components
const VegetarianIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.8" />
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VeganIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M8 12L11 15L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 2C6 2 2 6 2 12s4 10 10 10c2 0 4-1 5.5-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const GlutenFreeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M6 6L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const LowCalorieIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M8 10V6a4 4 0 018 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="10" y="13" width="4" height="4" rx="1" fill="currentColor" opacity="0.8" />
  </svg>
);

const QuickPrepIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
  </svg>
);

const SpicyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C10 2 8 4 8 6s0 6 0 6c0 2 2 4 4 4s4-2 4-4s0-4 0-6s-2-4-4-4Z" fill="currentColor" opacity="0.8" />
    <path d="M12 12v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Unified Filter and Sort Dropdown Component
const FilterSortDropdown = ({
  filterOptions,
  sortOptions,
  selectedFilters,
  sortBy,
  onFilterToggle,
  onSortChange,
  showFilters,
  setShowFilters
}: {
  filterOptions: any[];
  sortOptions: any[];
  selectedFilters: string[];
  sortBy: string;
  onFilterToggle: (filterId: string) => void;
  onSortChange: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowFilters(true);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <SortAsc className="h-3 w-3" />
        <span>{sortOptions.find(opt => opt.id === sortBy)?.name || 'Sort'}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Sort Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Sort By</h4>
            <div className="space-y-1">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSortChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${sortBy === option.id
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Section */}
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Filters</h4>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => onFilterToggle(filter.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${selectedFilters.includes(filter.id)
                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="flex items-center">{filter.icon}</span>
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;  // Added discount price
  currency: string;        // Added currency
  image: string;
  calories: number;
  category: string;
  allergens: string[];
  ingredients: string;
  isGlutenFree: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  preparationTime: number;
  rating: number;
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'very-hot';
  tags: string[];
  available: boolean;
  isAvailable: boolean;
  adminId: string;

  // Enhanced fields
  isBestSeller?: boolean;
  isRecommended?: boolean;
  totalRatings?: number;
  totalOrders?: number;
  viewCount?: number;
  orderCount?: number;

  // Video field
  video?: string;

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
  variants?: Array<{ name: string, price: number }>;
  addons?: Array<{ name: string, price: number }>;
}

interface Restaurant {
  id: string;
  name: string;
  image?: string;
  rating?: number;
  deliveryTime?: string;
  cuisine?: string;
  location: string;
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

interface HitsItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

const foodCategories = [
  {
    id: '1',
    name: 'Biryani',
    image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=200&h=200&fit=crop&crop=center'
  },
  {
    id: '2',
    name: 'Pizza',
    image: 'https://img.freepik.com/premium-photo/whole-italian-pizza-wooden-table-with-ingredients_251318-13.jpg?w=740'
  },
  {
    id: '3',
    name: 'Pasta',
    image: 'https://img.freepik.com/free-photo/penne-pasta-tomato-sauce-with-chicken-tomatoes-wooden-table_2829-19739.jpg?t=st=1759772976~exp=1759776576~hmac=4d33e5d8726ce75f5b3ac50ebf8eb28cbc978a8a67a1e591e982b976b2645a3b&w=1060'
  },
  {
    id: '4',
    name: 'Dosa',
    image: 'https://img.freepik.com/premium-photo/golden-crispy-plain-dosa-south-indian-classic_1498750-42.jpg?w=740'
  },
  {
    id: '5',
    name: 'Pure Veg',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop&crop=center'
  },
  {
    id: '6',
    name: 'Idli',
    image: 'https://img.freepik.com/premium-photo/mini-idli-with-tadka-soft-steamed-rice-cakes-with-flavorful-tempering_1341210-85.jpg?w=740'
  },
  {
    id: '7',
    name: 'North Indian',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&fit=crop&crop=center'
  },
  {
    id: '8',
    name: 'Samosa',
    image: 'https://img.freepik.com/free-photo/deep-fried-samosas-dumplings-gourmet-appetizer-generated-by-ai_188544-13491.jpg?t=st=1759773282~exp=1759776882~hmac=3bf24e51265c443d4eae663dc823d1a15a272751f0356d53d2990b5187b9cd05&w=740'
  },
  {
    id: '9',
    name: 'Poha',
    image: 'https://img.freepik.com/premium-photo/aloo-kanda-poha-tarri-pohe-with-spicy-chana-masala-curry_466689-47770.jpg?w=740'
  },
  // Move Tea and Cofee here (middle, after Poha)
  {
    id: '11',
    name: 'Tea',
    image: 'https://img.freepik.com/free-photo/front-view-milk-tea-concept-with-copy-space_23-2148555195.jpg?t=st=1759773496~exp=1759777096~hmac=d4e2e5ac68ea76e06e1b9f94106572eeb895ef9eba33c4b3e619bf1376482558&w=740'
  },
  {
    id: '12',
    name: 'Cofee',
    image: 'https://img.freepik.com/free-photo/view-3d-coffee-cup-with-roasted-beans_23-2151083732.jpg?t=st=1759773538~exp=1759777138~hmac=04d2684149c6731dce12e77cfa31c0a012feefdaff61e51f653e99f8626673e4&w=740'
  },
  {
    id: '10',
    name: 'Ice Cream',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop&crop=center'
  },
  {
    id: '13',
    name: 'Rolls',
    image: 'https://img.freepik.com/free-photo/close-up-delicious-asian-food_23-2150535885.jpg?t=st=1759773392~exp=1759776992~hmac=600c776ec9d991a84686402660446138c9fafd7c2a00d068a4530035041d186b&w=740'
  },
];

const filterOptions = [
  { id: 'vegetarian', name: 'Vegetarian', icon: <VegetarianIcon size={14} /> },
  { id: 'vegan', name: 'Vegan', icon: <VeganIcon size={14} /> },
  { id: 'gluten-free', name: 'Gluten Free', icon: <GlutenFreeIcon size={14} /> },
  { id: 'low-calorie', name: 'Low Calorie', icon: <LowCalorieIcon size={14} /> },
  { id: 'quick-prep', name: 'Quick Prep', icon: <QuickPrepIcon size={14} /> },
  { id: 'spicy', name: 'Spicy', icon: <SpicyIcon size={14} /> }
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

const categories = [
  { id: 'all', name: 'All', value: 'all' },
  { id: 'main-course', name: 'Main Course', value: 'main course' },
  { id: 'appetizers', name: 'Appetizers', value: 'appetizers' },
  { id: 'desserts', name: 'Desserts', value: 'desserts' },
  { id: 'beverages', name: 'Beverages', value: 'beverages' },
  { id: 'soups', name: 'Soups', value: 'soups' }
];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(true); // Keep true for unified dropdown
  const [favorites, setFavorites] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ratings, setRatings] = useState<{ [menuItemId: string]: { average: number; count: number } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [restaurantRatings, setRestaurantRatings] = useState<{ [restaurantId: string]: { averageRating: number; totalReviews: number } }>({});
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();

  // Function to get restaurant image from database
  const getRestaurantImage = useCallback((restaurant: RestaurantSettings) => {
    return restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
  }, []);

  // Function to get category display name for a menu item
  // For main menu page, always use default category names (no custom mappings)
  const getItemCategoryDisplayName = useCallback((item: MenuItem) => {
    // Find the default category
    const defaultCat = DEFAULT_CATEGORIES.find(cat => cat.id === item.category);
    return defaultCat?.name || item.category;
  }, []);

  // Helper functions for enhanced display
  const hasDiscount = useCallback((item: MenuItem) => {
    return !!(item.discountPrice && item.discountPrice < item.price);
  }, []);

  const getDiscountPercentage = useCallback((item: MenuItem) => {
    if (!hasDiscount(item)) return 0;
    return Math.round(((item.price - item.discountPrice!) / item.price) * 100);
  }, [hasDiscount]);

  const formatCurrency = useCallback((amount: number, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  }, []);

  const getSpiceCount = useCallback((spiceLevel: string) => {
    switch (spiceLevel) {
      case 'mild': return 1;
      case 'medium': return 2;
      case 'hot': return 3;
      case 'very-hot': return 4;
      default: return 0;
    }
  }, []);

  // Location utility functions
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      // Check if we have permission already
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            reject(new Error('Geolocation permission denied by user'));
            return;
          }
          requestLocation();
        }).catch(() => {
          // If permissions API is not supported, just request location
          requestLocation();
        });
      } else {
        requestLocation();
      }

      function requestLocation() {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            let errorMessage = 'Location access failed';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your connection.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage = 'An unknown error occurred while accessing location.';
                break;
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: false, // Changed to false to avoid timeout issues
            timeout: 8000, // Reduced timeout
            maximumAge: 600000 // 10 minutes
          }
        );
      }
    });
  };

  const filterRestaurantsByLocation = (allRestaurants: RestaurantSettings[], userLat: number, userLng: number, radiusKm: number = 50): RestaurantSettings[] => {
    return allRestaurants.filter(restaurant => {
      if (!restaurant.location?.lat || !restaurant.location?.lng) {
        return false;
      }

      const distance = calculateDistance(
        userLat,
        userLng,
        restaurant.location.lat,
        restaurant.location.lng
      );

      return distance <= radiusKm;
    });
  };

  const filterMenuItemsByLocation = (allMenuItems: FirebaseMenuItem[], userLat: number, userLng: number, radiusKm: number = 50): FirebaseMenuItem[] => {
    return allMenuItems.filter(item => {
      if (!item.restaurantLocation?.lat || !item.restaurantLocation?.lng) {
        return false;
      }

      const distance = calculateDistance(
        userLat,
        userLng,
        item.restaurantLocation.lat,
        item.restaurantLocation.lng
      );

      return distance <= radiusKm;
    });
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  const getRestaurantDistance = (restaurant: RestaurantSettings): string => {
    if (!userLocation || !restaurant.location?.lat || !restaurant.location?.lng) {
      return 'Distance unavailable';
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      restaurant.location.lat,
      restaurant.location.lng
    );

    return formatDistance(distance);
  };

  const getMenuItemDistance = (menuItem: FirebaseMenuItem): string => {
    if (!userLocation || !menuItem.restaurantLocation?.lat || !menuItem.restaurantLocation?.lng) {
      return 'Distance unavailable';
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      menuItem.restaurantLocation.lat,
      menuItem.restaurantLocation.lng
    );

    return formatDistance(distance);
  };

  const formatFullAddress = (restaurant: RestaurantSettings): string => {
    const address = restaurant.address;
    if (!address) return 'Address not available';

    const parts = [address.street, address.city, address.state, address.postalCode].filter(Boolean);
    return parts.join(', ');
  };

  const fetchRestaurantRatings = async (restaurants: RestaurantSettings[]) => {
    const ratingsPromises = restaurants.map(async (restaurant) => {
      const result = await getRestaurantRating(restaurant.adminId);
      const defaultRating = { averageRating: 0, totalReviews: 0 };

      if (!result.success || !result.data) {
        return { restaurantId: restaurant.adminId, rating: defaultRating };
      }

      return {
        restaurantId: restaurant.adminId,
        rating: {
          averageRating: result.data.averageRating,
          totalReviews: result.data.totalReviews
        }
      };
    });

    const ratings = await Promise.all(ratingsPromises);
    const ratingsMap: { [restaurantId: string]: { averageRating: number; totalReviews: number } } = {};

    ratings.forEach(({ restaurantId, rating }) => {
      ratingsMap[restaurantId] = rating;
    });

    return ratingsMap;
  };

  // Initialize cart count
  useEffect(() => {
    setCartCount(CartManager.getCartCount());

    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      setCartCount(CartManager.getCartCount());
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parallel data fetching for better performance
        // Note: We don't fetch category mappings on main menu page - only default categories shown
        const [locationPromise, restaurantsPromise, menuItemsPromise, ratingsPromise] = await Promise.allSettled([
          getUserLocation().catch(() => null), // Don't fail if location fails
          getAllRestaurants(),
          getAllMenuItems(),
          getMenuItemsRatings()
        ]);

        // Handle location
        const userCoords = locationPromise.status === 'fulfilled' ? locationPromise.value : null;
        if (userCoords) {
          setUserLocation(userCoords);
          setLocationPermission('granted');
          console.log('Location access granted:', userCoords);
        } else {
          setLocationPermission('denied');
          const errorMsg = locationPromise.status === 'rejected' ? locationPromise.reason?.message : 'Unknown location error';
          console.log('Location access denied:', errorMsg);
        }

        // Handle restaurants
        if (restaurantsPromise.status === 'fulfilled' && restaurantsPromise.value.success && restaurantsPromise.value.data) {
          let processedRestaurants = restaurantsPromise.value.data;

          // Apply location filter if available
          if (userCoords) {
            const nearbyRestaurants = filterRestaurantsByLocation(restaurantsPromise.value.data, userCoords.lat, userCoords.lng, 50);
            if (nearbyRestaurants.length > 0) {
              processedRestaurants = nearbyRestaurants;
            }
          }

          // Transform restaurant data to match our interface
          const transformedRestaurants: Restaurant[] = processedRestaurants.map((restaurant: RestaurantSettings) => ({
            id: restaurant.id || '',
            name: restaurant.name,
            image: getRestaurantImage(restaurant),
            rating: restaurant.rating || 4.0,
            deliveryTime: restaurant.deliveryTime || '30-45 mins',
            cuisine: restaurant.cuisine || 'Multi-cuisine',
            location: restaurant.address?.city || 'Unknown',
            specialties: restaurant.specialties || ['Popular'],
            dietaryOptions: restaurant.dietaryOptions || ['Vegetarian'],
            isVeg: restaurant.restaurantType === 'Veg' || restaurant.restaurantType === 'Both',
            isNonVeg: restaurant.restaurantType === 'Non-Veg' || restaurant.restaurantType === 'Both',
            isPureVeg: restaurant.restaurantType === 'Veg',
            distance: userCoords ? getRestaurantDistance(restaurant) : 'Distance unavailable',
            deliveryFee: 25,
            minimumOrder: 199,
            address: restaurant.address,
            phone: restaurant.phone,
            email: restaurant.email
          }));

          setRestaurants(transformedRestaurants);

          // Fetch restaurant ratings
          const ratings = await fetchRestaurantRatings(processedRestaurants);
          setRestaurantRatings(ratings);
        }

        // Handle menu items
        if (menuItemsPromise.status === 'fulfilled' && menuItemsPromise.value.success && menuItemsPromise.value.data) {
          let processedMenuItems = menuItemsPromise.value.data;

          // Apply location filter if available
          if (userCoords) {
            const nearbyMenuItems = filterMenuItemsByLocation(menuItemsPromise.value.data, userCoords.lat, userCoords.lng, 50);
            if (nearbyMenuItems.length > 0) {
              processedMenuItems = nearbyMenuItems;
            }
          }

          // Transform menu items data
          const transformedMenuItems: MenuItem[] = processedMenuItems.map((item: FirebaseMenuItem) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            discountPrice: item.discountPrice,
            currency: item.currency || 'INR',
            image: item.image,
            calories: item.calories,
            category: item.category,
            allergens: item.allergens || [],
            ingredients: typeof item.ingredients === 'string' ? item.ingredients : (item.ingredients || []).join(', '),
            isGlutenFree: item.isGlutenFree,
            isVegan: item.isVegan,
            isVegetarian: item.isVegetarian,
            preparationTime: item.preparationTime,
            rating: item.rating,
            spiceLevel: item.spiceLevel,
            tags: item.tags || [],
            available: item.available || false,
            isAvailable: item.isAvailable || item.available || false,
            adminId: item.adminId,

            // Enhanced fields
            isBestSeller: item.isBestSeller || false,
            isRecommended: item.isRecommended || false,
            totalRatings: item.totalRatings || 0,
            totalOrders: item.totalOrders || 0,
            viewCount: item.viewCount || 0,
            orderCount: item.orderCount || 0,

            // Video field
            video: item.video,

            restaurantLocation: item.restaurantLocation,
            restaurantAddress: item.restaurantAddress,
            variants: item.variants || [],
            addons: item.addons || []
          }));

          setMenuItems(transformedMenuItems);
        }

        // Handle ratings
        if (ratingsPromise.status === 'fulfilled' && ratingsPromise.value.success && ratingsPromise.value.data) {
          setRatings(ratingsPromise.value.data);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = menuItems.filter(item => {
    const categoryMatch = selectedCategory === 'all' ||
      item.category.toLowerCase().includes(selectedCategory.toLowerCase());

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

    return categoryMatch && filterMatch;
  }).sort((a, b) => {
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


  const { openCustomization } = useCart();

  const addToCart = (item: MenuItem) => {
    try {
      // Get the restaurant ID for this menu item
      const restaurantId = item.adminId;

      // Check if item has variants or add-ons
      if ((item.variants && Array.isArray(item.variants) && item.variants.length > 0) ||
        (item.addons && Array.isArray(item.addons) && item.addons.length > 0)) {
        // Open cart with customization
        openCustomization(item, restaurantId);
      } else {
        // Add directly to cart if no customization needed
        const result = CartManager.addToCart(item, 1, restaurantId);

        if (result.success) {
          // Update cart count state
          setCartCount(result.cartCount);

          // Show success feedback (you can add a toast notification here)
          console.log(`Added ${item.name} to cart`);

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

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const toggleFavorite = (restaurantId: string) => {
    setFavorites(prev =>
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );
  };

  // Carousel navigation functions
  const scrollCategories = (direction: 'left' | 'right') => {
    const container = document.getElementById('categories-container');
    if (container) {
      const scrollAmount = 200;
      const newPosition = direction === 'left'
        ? Math.max(0, categoryScrollPosition - scrollAmount)
        : categoryScrollPosition + scrollAmount;

      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setCategoryScrollPosition(newPosition);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 transition-colors duration-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300">Loading restaurants and menu items...</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Location Permission Request */}
        {locationPermission === 'denied' && (
          <div className="mb-6 p-4 bg-gradient-to-br from-white/10 to-transparent border border-foreground/10 backdrop-blur-md rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-foreground/80" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">Enable location for better experience</h3>
                  <p className="text-xs text-foreground/70">Get personalized restaurant recommendations and delivery estimates</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    setLocationPermission('pending');
                    const coords = await getUserLocation();
                    setUserLocation(coords);
                    setLocationPermission('granted');
                    // Refresh data with new location
                    window.location.reload();
                  } catch (error) {
                    setLocationPermission('denied');
                    console.error('Location request failed:', error);
                  }
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-xs font-medium rounded-lg hover:shadow-lg hover:from-primary/90 hover:to-primary transition-all duration-300 hover:-translate-y-0.5"
              >
                Enable
              </button>
            </div>
          </div>
        )}

        {/* Order our best food options Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What's on your mind?</h2>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollCategories('left')}
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => scrollCategories('right')}
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div
            id="categories-container"
            className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {foodCategories.map((category) => (
              <Link
                key={category.id}
                href={`/user/menu/category/${encodeURIComponent(category.name.toLowerCase())}`}
                className="flex flex-col items-center gap-3 min-w-[120px] cursor-pointer group hover:scale-105 transition-transform duration-200"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop';
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Top restaurant chains section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {locationPermission === 'granted' && userLocation
                  ? 'Top restaurant chains near you'
                  : 'Top restaurant chains in Kanpur'
                }
              </h2>

            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => {
                  const container = document.getElementById('restaurant-chains-container');
                  if (container) {
                    container.scrollBy({ left: -400, behavior: 'smooth' });
                  }
                }}
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => {
                  const container = document.getElementById('restaurant-chains-container');
                  if (container) {
                    container.scrollBy({ left: 400, behavior: 'smooth' });
                  }
                }}
                className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          <div id="restaurant-chains-container" className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {restaurants.slice(0, 6).map((restaurant) => (
              <div
                onClick={() => router.push(`/user/menu/${restaurant.id}`)}
                key={restaurant.id} className="cursor-pointer group w-48 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg dark:hover:border-primary/20">
                <div className="relative">
                  <img
                    alt={restaurant.name}
                    className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
                    }}
                  />
                  <button
                    onClick={() => toggleFavorite(restaurant.id)}
                    className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${favorites.includes(restaurant.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 hover:bg-red-500 hover:text-white'
                      }`}
                  >

                  </button>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{restaurant.name}</h3>
                  <div className="flex items-center gap-2 mb-1 text-xs text-gray-600 dark:text-gray-400">
                    {(restaurantRatings[restaurant.id]?.averageRating || restaurant.rating || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <GradientStar size={12} />
                        <span>{(restaurantRatings[restaurant.id]?.averageRating || restaurant.rating || 0).toFixed(2)}</span>
                        {restaurantRatings[restaurant.id]?.totalReviews && (
                          <span className="text-gray-500">({restaurantRatings[restaurant.id].totalReviews})</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{restaurant.deliveryTime || '30-45 mins'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">{restaurant.cuisine || 'Multi-cuisine'}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{restaurant.address?.city || restaurant.location}</span>
                  </div>
                  {restaurant.distance && restaurant.distance !== 'Distance unavailable' && (
                    <p className="text-xs text-primary dark:text-primary/90 mt-1">
                      {restaurant.distance} away
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Food Menu Section */}
        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Our Menu</h2>
          </div>

          {/* Filter and Sort Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <FilterSortDropdown
              filterOptions={filterOptions}
              sortOptions={sortOptions}
              selectedFilters={selectedFilters}
              sortBy={sortBy}
              onFilterToggle={toggleFilter}
              onSortChange={setSortBy}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
          </div>

          {/* Menu Items by Category */}
          {(() => {
            // Group menu items by category (using default category IDs)
            // Filter out items with custom categories (not in DEFAULT_CATEGORIES)
            const itemsWithDefaultCategories = filteredItems.filter(item => {
              return DEFAULT_CATEGORIES.some(cat => cat.id === item.category);
            });

            const groupedItems = itemsWithDefaultCategories.reduce((acc, item) => {
              const category = item.category || 'Other';
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(item);
              return acc;
            }, {} as Record<string, MenuItem[]>);

            return Object.entries(groupedItems).map(([categoryId, items]) => {
              // Always use default category name for main menu page
              const defaultCat = DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
              const displayName = defaultCat?.name || categoryId;

              return (
                <div key={categoryId} className="mb-6">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {displayName}
                    </h3>
                    <div className="hidden md:flex gap-2">
                      <button
                        onClick={() => {
                          const container = document.getElementById(`menu-items-${categoryId}`);
                          if (container) {
                            container.scrollBy({ left: -400, behavior: 'smooth' });
                          }
                        }}
                        className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          const container = document.getElementById(`menu-items-${categoryId}`);
                          if (container) {
                            container.scrollBy({ left: 400, behavior: 'smooth' });
                          }
                        }}
                        className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div id={`menu-items-${categoryId}`} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {items.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => router.push(`/user/menu/${item.adminId}/${item.id}`)}
                        className="group w-48 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg dark:hover:border-primary/20 cursor-pointer"
                      >
                        <div className="relative">
                          {item.video ? (
                            <video
                              src={item.video}
                              poster={item.image}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLVideoElement;
                                // Fallback to image if video fails
                                const img = document.createElement('img');
                                img.src = item.image;
                                img.alt = item.name;
                                img.className = "w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300";
                                img.onerror = () => {
                                  img.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
                                };
                                target.parentNode?.replaceChild(img, target);
                              }}
                            />
                          ) : (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
                              }}
                            />
                          )}

                          {/* Enhanced Badges - Moved to right side */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            {/* Video Badge */}
                            {item.video && (
                              <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span>Video</span>
                              </div>
                            )}

                            {/* Discount Badge */}
                            {hasDiscount(item) && (
                              <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                                {getDiscountPercentage(item)}% OFF
                              </div>
                            )}

                            {/* Best Seller Badge */}
                            {item.isBestSeller && (
                              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg shadow-md border border-amber-400/30">
                                {/* Mobile: Icon only */}
                                <div className="flex items-center px-1.5 py-0.5 sm:hidden">
                                  <Award className="w-3 h-3" />
                                </div>
                                {/* Desktop: Icon + Text */}
                                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
                                  <Award className="w-3 h-3" />
                                  <span>Best Seller</span>
                                </div>
                              </div>
                            )}

                            {/* Recommended Badge */}
                            {item.isRecommended && (
                              <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-md border border-emerald-400/30">
                                {/* Mobile: Icon only */}
                                <div className="flex items-center px-1.5 py-0.5 sm:hidden">
                                  <Heart className="w-3 h-3 fill-current" />
                                </div>
                                {/* Desktop: Icon + Text */}
                                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold">
                                  <Heart className="w-3 h-3 fill-current" />
                                  <span>Recommended</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Availability Overlay */}
                          {!item.available && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                                Unavailable
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-2.5">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                            {(ratings[item.id]?.average || item.rating || 0) > 0 && (
                              <div className="flex items-center gap-0.5">
                                <GradientStar size={10} />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {(ratings[item.id]?.average || item.rating || 0).toFixed(2)}
                                </span>
                                {(item.totalRatings || ratings[item.id]?.count) && (
                                  <span className="text-xs text-gray-500">({item.totalRatings || ratings[item.id].count})</span>
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">{item.description}</p>

                          {/* Restaurant name and address */}
                          <div className="mb-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 line-clamp-1">
                                {restaurants.find(r => r.id === item.adminId)?.name || 'Restaurant'}
                              </p>
                              {userLocation && item.restaurantLocation && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5 text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {calculateDistance(
                                      userLocation.lat,
                                      userLocation.lng,
                                      item.restaurantLocation.lat,
                                      item.restaurantLocation.lng
                                    ).toFixed(2)}km
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                              <MapPin className="h-2.5 w-2.5" />
                              <span className="line-clamp-1">
                                {item.restaurantAddress?.city || restaurants.find(r => r.id === item.adminId)?.address?.city || 'Location'}
                              </span>
                            </div>
                          </div>

                          {/* Enhanced Meta Information */}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <div className="flex items-center gap-2">
                              {item.preparationTime && (
                                <div className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{item.preparationTime}m</span>
                                </div>
                              )}
                              {item.calories > 0 && (
                                <span>{item.calories} cal</span>
                              )}
                            </div>

                            {/* Spice Level */}
                            {item.spiceLevel && item.spiceLevel !== 'none' && (
                              <div className="flex items-center">
                                {Array.from({ length: getSpiceCount(item.spiceLevel) }).map((_, i) => (
                                  <Flame key={i} className="h-2.5 w-2.5 text-red-500" />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Enhanced Dietary Info */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.isVegetarian && (
                              <span className="px-2 py-0.5 text-xs font-medium border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 rounded">
                                Vegetarian
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="px-2 py-0.5 text-xs font-medium border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 rounded">
                                Vegan
                              </span>
                            )}
                            {item.isGlutenFree && (
                              <span className="px-2 py-0.5 text-xs font-medium border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/20 rounded">
                                Gluten Free
                              </span>
                            )}

                            {/* Variants & Add-ons Indicators */}
                            {item.variants && item.variants.length > 0 && (
                              <span className="px-2 py-0.5 text-xs font-medium border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 rounded">
                                {item.variants.length} variant{item.variants.length > 1 ? 's' : ''}
                              </span>
                            )}
                            {item.addons && item.addons.length > 0 && (
                              <span className="px-2 py-0.5 text-xs font-medium border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/20 rounded">
                                {item.addons.length} add-on{item.addons.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          {/* Enhanced Pricing and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              {hasDiscount(item) ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(item.discountPrice!, item.currency)}
                                  </span>
                                  <span className="text-xs text-gray-400 line-through">
                                    {formatCurrency(item.price, item.currency)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(item.price, item.currency)}
                                </span>
                              )}

                              {/* Analytics Info */}
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
                              className="px-3 py-1.5 rounded-lg font-bold transition-all text-xs hover:scale-105 active:scale-95 shadow-md bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:shadow-lg hover:from-primary/90 hover:to-primary disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <div className="flex items-center gap-1">
                                <Plus className="h-3 w-3" />
                                <span>Add</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Filter className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No menu items found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters to see more items.</p>
            </div>
          )}
        </section>
      </div>


    </div>
  );
}