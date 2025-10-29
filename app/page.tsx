"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CalendarClock,
  ChefHat,
  Clock,
  Coffee,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu,
  Phone,
  QrCode,
  Sparkles,
  Sun,
  Star,
  Twitter,
  Utensils,
  Moon,
  Wine,
  X,
  CreditCard,
  BarChart3
} from "lucide-react";
import { useTheme } from "./(contexts)/ThemeContext";
import { useAuth } from "./(contexts)/AuthContext";
import Link from "next/link";
import ProfileDropdown from "./(components)/ProfileDropdown";
import { getAllMenuItems, MenuItem, getMenuItemsRatings, getAllRestaurants, RestaurantSettings, getRestaurantRating } from "./(utils)/firebaseOperations";
import { CartManager } from "./(utils)/cartUtils";
import { useRouter } from "next/navigation";
import { sendNotification } from "./(utils)/notification";
import { toast } from "sonner";

const services = [
  {
    title: "QR Code Ordering System",
    description: "Contactless digital ordering through QR codes. Customers scan, browse menus, place orders, and pay directly from their smartphones. Reduces wait times and enhances safety.",
    icon: QrCode
  },
  {
    title: "Table Reservation Management",
    description: "Advanced reservation system for restaurants to manage table bookings, optimize seating, and provide better customer service. Includes automated confirmations and reminders.",
    icon: CalendarClock
  },
  {
    title: "Digital Menu Management",
    description: "Dynamic menu management with real-time updates, pricing control, inventory tracking, and customization options. Restaurants can easily modify menus and track popular items.",
    icon: Menu
  },
  {
    title: "Payment Processing",
    description: "Secure payment gateway supporting multiple payment methods including credit cards, UPI, digital wallets, and bank transfers. Integrated with leading payment processors.",
    icon: CreditCard
  },
  {
    title: "Order Processing & Kitchen Display",
    description: "Streamlined order management with kitchen display integration, order tracking, and delivery management. Helps restaurants improve efficiency and reduce errors.",
    icon: ChefHat
  },
  {
    title: "Analytics & Reporting",
    description: "Comprehensive business intelligence dashboard providing insights into sales, customer behavior, popular items, peak hours, and operational efficiency metrics.",
    icon: BarChart3
  }
];

// Dynamic dishes will be fetched from Firebase

// Dynamic restaurants will be fetched from Firebase

const testimonials = [
  {
    name: "Ananya Singh",
    role: "Delhi Foodie",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400&auto=format&fit=crop",
    quote:
      "Dineezy’s pre-order system is a blessing during my busy Delhi workdays. Skipping the queue and enjoying hot paneer tikka is unbeatable!"
  },
  {
    name: "Rahul Sharma",
    role: "Startup Founder",
    avatar: "https://images.unsplash.com/photo-1520880867055-1e30d1cb001c?q=80&w=400&auto=format&fit=crop",
    quote:
      "Love how easy it is to reserve a table for my team lunches in Bangalore. No confusion, instant confirmation, and the service is always prompt!"
  },
  {
    name: "Priya Nair",
    role: "Homemaker",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400&auto=format&fit=crop",
    quote:
      "With Dineezy, I get fresh home-style meals ready for pickup after my grocery runs in Mumbai. It’s so convenient and perfectly timed!"
  },
  {
    name: "Arjun Mehta",
    role: "Travel Blogger",
    avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=400&auto=format&fit=crop",
    quote:
      "Traveling across India, Dineezy has helped me discover hidden gems and authentic local restaurants I never would’ve found on my own."
  }
];

type AutoScrollOptions = {
  speed?: number;
  direction?: 1 | -1;
  idleDelay?: number;
};

const setupAutoScroll = (
  container: HTMLDivElement | null,
  { speed = 0.4, direction = 1, idleDelay = 1600 }: AutoScrollOptions = {}
) => {
  if (!container) {
    return () => {};
  }

  let frameId = 0;
  let resumeTimer: number | null = null;
  let isPaused = false;
  let isUserInteracting = false;

  const baseSpeed = Math.abs(speed);
  const signedSpeed = (direction >= 0 ? 1 : -1) * baseSpeed;
  const touchOptions: AddEventListenerOptions = { passive: true };
  const wheelOptions: AddEventListenerOptions = { passive: false };

  const ensureBounds = (force = false) => {
    const halfWidth = container.scrollWidth / 2;
    if (halfWidth <= 0) return;

    const epsilon = 0.5;
    const left = container.scrollLeft;

    if (!force && left > epsilon && left < halfWidth - epsilon) {
      return;
    }

    let wrapped = left;
    while (wrapped < 0) wrapped += halfWidth;
    while (wrapped >= halfWidth) wrapped -= halfWidth;
    container.scrollLeft = wrapped;
  };

  const step = () => {
    if (!isPaused && !isUserInteracting) {
      const halfWidth = container.scrollWidth / 2;
      if (halfWidth > 0) {
        container.scrollLeft += signedSpeed;
        ensureBounds();
      }
    }
    frameId = window.requestAnimationFrame(step);
  };

  const initialize = () => {
    const halfWidth = container.scrollWidth / 2;
    if (halfWidth <= 0) {
      frameId = window.requestAnimationFrame(initialize);
      return;
    }

    if (container.scrollLeft === 0) {
      container.scrollLeft = halfWidth / 2;
    }

    ensureBounds(true);
    frameId = window.requestAnimationFrame(step);
  };

  const pauseForInteraction = () => {
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
      resumeTimer = null;
    }
    isUserInteracting = true;
    isPaused = true;
  };

  const scheduleResume = (delay = idleDelay) => {
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
    }

    resumeTimer = window.setTimeout(() => {
      ensureBounds(true);
      isUserInteracting = false;
      isPaused = false;
      resumeTimer = null;
    }, delay);
  };

  const handleScroll = () => {
    if (!isUserInteracting) {
      ensureBounds();
    }
  };

  const handlePointerDown = () => {
    pauseForInteraction();
  };

  const handlePointerUp = () => {
    scheduleResume();
  };

  const handleTouchStart = () => {
    pauseForInteraction();
  };

  const handleTouchEnd = () => {
    scheduleResume(900);
  };

  const handleWheel = (event: WheelEvent) => {
    const dominantDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
    }

    if (dominantDelta === 0) {
      return;
    }

    pauseForInteraction();
    container.scrollLeft += dominantDelta;
    scheduleResume(1400);
  };

  frameId = window.requestAnimationFrame(initialize);

  container.addEventListener('scroll', handleScroll, { passive: true });
  container.addEventListener('pointerdown', handlePointerDown);
  container.addEventListener('pointerup', handlePointerUp);
  container.addEventListener('pointercancel', handlePointerUp);
  container.addEventListener('touchstart', handleTouchStart, touchOptions);
  container.addEventListener('touchend', handleTouchEnd);
  container.addEventListener('touchcancel', handleTouchEnd);
  container.addEventListener('wheel', handleWheel, wheelOptions);

  return () => {
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
    }
    window.cancelAnimationFrame(frameId);
    container.removeEventListener('scroll', handleScroll);
    container.removeEventListener('pointerdown', handlePointerDown);
    container.removeEventListener('pointerup', handlePointerUp);
    container.removeEventListener('pointercancel', handlePointerUp);
    container.removeEventListener('touchstart', handleTouchStart, touchOptions);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('touchcancel', handleTouchEnd);
    container.removeEventListener('wheel', handleWheel, wheelOptions);
  };
};


const sectionMotion = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8 }
};

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const isDarkMode = theme === "dark";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [ratings, setRatings] = useState<{ [menuItemId: string]: { average: number; count: number } }>({});
  const [restaurants, setRestaurants] = useState<RestaurantSettings[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantRatings, setRestaurantRatings] = useState<{ [restaurantId: string]: { averageRating: number; totalReviews: number } }>({});
  const [showCartNotification, setShowCartNotification] = useState(false);
  const router = useRouter();
  const dishMarqueeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const restaurantMarqueeRef = useRef<HTMLDivElement | null>(null);

  // Navigation items - dynamic based on auth status
  const navItems = user ? [
    { name: "Home", href: "#home" },
    { name: "Menu", href: "/user/menu" },
    { name: "Orders", href: "/user/orders" },
    { name: "Reservation", href: "/user/reservation" },
    { name: "Profile", href: "/user/profile" },
  ] : [
    { name: "Home", href: "#home" },
    { name: "Menu", href: "/user/menu" },
    { name: "Orders", href: "/user/orders" },
    { name: "Reservation", href: "/user/reservation" },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Get user's current location
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Filter dishes by location radius
  const filterDishesByLocation = (allDishes: MenuItem[], userLat: number, userLng: number, radiusKm: number = 50): MenuItem[] => {
    return allDishes.filter(dish => {
      if (!dish.restaurantLocation?.lat || !dish.restaurantLocation?.lng) {
        return false; // Skip dishes without location data
      }

      const distance = calculateDistance(
        userLat,
        userLng,
        dish.restaurantLocation.lat,
        dish.restaurantLocation.lng
      );

      return distance <= radiusKm;
    });
  };

  // Filter restaurants by location radius
  const filterRestaurantsByLocation = (allRestaurants: RestaurantSettings[], userLat: number, userLng: number, radiusKm: number = 50): RestaurantSettings[] => {
    return allRestaurants.filter(restaurant => {
      if (!restaurant.location?.lat || !restaurant.location?.lng) {
        return false; // Skip restaurants without location data
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

  // Handle quick order - add item to cart and navigate to checkout
  const handleQuickOrder = (dish: MenuItem) => {
    // Check if cart is from different restaurant
    if (CartManager.isDifferentRestaurant(dish.adminId)) {
      // Clear cart if from different restaurant
      CartManager.clearCart();
    }

    // Add item to cart
    const result = CartManager.addToCart(dish, 1, dish.adminId);

    if (result.success) {
      // Show notification
      setShowCartNotification(true);
      setTimeout(() => setShowCartNotification(false), 2000);

      // Navigate to checkout page
      router.push('/user/checkout');
    }
  };

  // Format distance for display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Get distance from user location to restaurant
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

  // Format full address
  const formatFullAddress = (restaurant: RestaurantSettings): string => {
    const address = restaurant.address;
    if (!address) return 'Address not available';

    const parts = [address.street, address.city, address.state, address.postalCode].filter(Boolean);
    return parts.join(', ');
  };

  // Fetch restaurant ratings
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

  // Optimized data fetching with reviews and efficient filtering
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parallel data fetching for better performance
        const [locationPromise, menuItemsPromise, ratingsPromise, restaurantsPromise] = await Promise.allSettled([
          getUserLocation().catch(() => null), // Don't fail if location fails
          getAllMenuItems(),
          getMenuItemsRatings(),
          getAllRestaurants()
        ]);

        // Handle location
        const userCoords = locationPromise.status === 'fulfilled' ? locationPromise.value : null;
        if (userCoords) {
          setUserLocation(userCoords);
          setLocationPermission('granted');
        } else {
          setLocationPermission('denied');
        }

        // Handle menu items
        if (menuItemsPromise.status === 'fulfilled' && menuItemsPromise.value.success && menuItemsPromise.value.data) {
          const allDishes = menuItemsPromise.value.data;

          // Handle ratings
          if (ratingsPromise.status === 'fulfilled' && ratingsPromise.value.success && ratingsPromise.value.data) {
            setRatings(ratingsPromise.value.data);
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

            // Sort by rating and take top 5
            const sortedRestaurants = processedRestaurants
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 5);

            setRestaurants(sortedRestaurants);

            // Fetch restaurant ratings
            const ratings = await fetchRestaurantRatings(sortedRestaurants);
            setRestaurantRatings(ratings);
          }

          // Efficient filtering and processing
          let processedDishes = allDishes;

          // Apply location filter if available
          if (userCoords) {
            const nearbyDishes = filterDishesByLocation(allDishes, userCoords.lat, userCoords.lng, 50);
            if (nearbyDishes.length > 0) {
              processedDishes = nearbyDishes;
            }
          }

          // Sort by rating (highest first) and take exactly 15 dishes
          const sortedDishes = processedDishes
            .sort((a, b) => {
              const ratingA = ratingsPromise.status === 'fulfilled' && ratingsPromise.value.success && ratingsPromise.value.data
                ? ratingsPromise.value.data[a.id]?.average || a.rating || 0
                : a.rating || 0;
              const ratingB = ratingsPromise.status === 'fulfilled' && ratingsPromise.value.success && ratingsPromise.value.data
                ? ratingsPromise.value.data[b.id]?.average || b.rating || 0
                : b.rating || 0;
              return ratingB - ratingA;
            })
            .slice(0, 15); // Take exactly 15 dishes

          setDishes(sortedDishes);
        } else {
          setError(menuItemsPromise.status === 'rejected'
            ? 'Failed to fetch menu items'
            : menuItemsPromise.value?.error || 'Unknown error');
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
        setRestaurantsLoading(false);
      }
    };
    ``
    fetchData();
  }, []);

  const dishRows = useMemo(() => [
    dishes.slice(0, 8),
    dishes.slice(8)
  ], [dishes]);

  const repeatedDishRows = useMemo(
    () => dishRows.map((row) => (row.length > 0 ? [...row, ...row] : [])),
    [dishRows]
  );

  const topRestaurants = useMemo(() => restaurants.slice(0, 5), [restaurants]);

  const repeatedTopRestaurants = useMemo(
    () => (topRestaurants.length > 0 ? [...topRestaurants, ...topRestaurants] : []),
    [topRestaurants]
  );

  useEffect(() => {
    dishMarqueeRefs.current = dishMarqueeRefs.current.slice(0, dishRows.length);

    const cleanups: Array<() => void> = [];

    dishRows.forEach((row, index) => {
      const container = dishMarqueeRefs.current[index];
      if (container && row.length > 0) {
        cleanups.push(
          setupAutoScroll(container, {
            speed: 0.6,
            direction: index % 2 === 0 ? 1 : -1,
            idleDelay: 1700
          })
        );
      }
    });

    const restaurantContainer = restaurantMarqueeRef.current;
    if (restaurantContainer && topRestaurants.length > 0) {
      cleanups.push(
        setupAutoScroll(restaurantContainer, {
          speed: 0.55,
          direction: 1,
          idleDelay: 1900
        })
      );
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [dishRows, topRestaurants]);

  // Auto scrolling handled imperatively so users can take control when interacting.

  // Optimized star rendering with proper rating calculation
  const renderStars = (dish: MenuItem) => {
    const dishRating = ratings[dish.id]?.average || dish.rating || 0;
    const roundedRating = Math.round(dishRating);

    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < roundedRating ? "text-transparent bg-clip-text bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff]" : "text-gray-300"}`}
        fill={index < roundedRating ? "url(#starGradient)" : "none"}
      />
    ));
  };

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${isDarkMode
        ? "bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-slate-100"
        : "bg-gray-100 text-slate-900"
        }`}
    >
      <link
        rel="stylesheet"
        href="data:text/css;base64,QG1lZGlhIG9ubHkgc2NyZWVuIHsKICBAa2V5ZnJhbWVzIGluZmluaXRlLXNjcm9sbCB7CiAgICAlICUgewogICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7CiAgICB9CiAgICAxMDAlIHsKICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpOwogICAgfQogIH0KfQouaW5maW5pdGUtc2Nyb2xsLWNvbnRhaW5lciB7CiAgZGlzcGxheTogZmxleDsKICBvdmVyZmxvdy14OiBhdXRvOwogIG92ZXJmbG93LXk6IGhpZGRlbjsKICBzY3JvbGwtYmVoYXZpb3I6IHNtb290aDsKICAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2g7CiAgc2Nyb2xsYmFyLXdpZHRoOiBub25lOwogIC1tcy1vdmVyZmxvdy1zdHlsZTogbm9uZTsKfQouaW5maW5pdGUtc2Nyb2xsLWNvbnRhaW5lcjo6LXdlYmtpdC1zY3JvbGxiYXIgewogIGRpc3BsYXk6IG5vbmU7Cn0KLmluZmluaXRlLXNjcm9sbC13cmFwcGVyIHsKICBkaXNwbGF5OiBmbGV4OwogIHdpZHRoOiBmaXQtY29udGVudDsKfQo="
      />
      
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
      <style jsx global>{`
        .dish-marquee,
        .restaurant-marquee {
          position: relative;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .dish-marquee::-webkit-scrollbar,
        .restaurant-marquee::-webkit-scrollbar {
          display: none;
        }

        .dish-marquee-inner,
        .restaurant-marquee-inner {
          display: flex;
          width: max-content;
        }
      `}</style>


      <main className="relative z-10">
        <div className="mx-auto w-full max-w-7xl px-4  mt-3 sm:px-6 lg:px-8 lg:pt-3">
          <motion.header
            id="home"
            className="flex flex-col gap-8"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-muted/10 shadow-sm backdrop-blur lg:flex-nowrap relative z-50">
              <div className="flex items-center gap-2">
                <img
                  src="logo.png"
                  alt="Dineezy Logo"
                  className={`w-24 h-24 object-cover object-center ${isDarkMode ? "invert" : ""}`}
                />
                <div className="ml-[-2rem]">
                  <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Dineezy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pr-[30px]">
                <button
                  onClick={toggleTheme}
                  className="group relative h-9 w-9 rounded-xl border border-foreground/10 bg-gradient-to-br from-white/10 to-transparent text-foreground shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 lg:flex lg:items-center lg:justify-center cursor-pointer"
                  aria-label="Toggle theme"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  <div className="relative flex  items-center justify-center">
                    {theme === "light" ? (
                      <Moon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-12" />
                    ) : (
                      <Sun className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-90" />
                    )}
                  </div>
                </button>

                {user ? (
                  <ProfileDropdown />
                ) : (
                  // User is not logged in - show login/signup
                  <>
                    <Link href="/user/login">
                      <button className="hidden rounded-[8px] border border-foreground/10 px-5 py-2 text-sm font-medium transition hover:border-primary/60 hover:text-primary lg:block cursor-pointer">
                        Log in
                      </button>
                    </Link>
                    <Link href="/user/register">
                      <button className="hidden rounded-[8px] border border-foreground/10 px-5 py-2 text-sm font-medium transition hover:border-primary/60 hover:text-primary lg:block cursor-pointer">
                        Sign Up
                      </button>
                    </Link>
                  </>
                )}

                <Link href="/user/menu">
                  <button className="hidden rounded-[8px] px-6 py-2 text-sm font-semibold shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl lg:block cursor-pointer bg-black text-white dark:bg-white dark:text-black hover:bg-primary/90 dark:hover:bg-white/90">
                    {user ? 'Order Now' : 'Get Started'}
                  </button>
                </Link>

              </div>
            </div>


            <div className="relative h-[50vh] lg:h-[60vh] -mx-4 sm:-mx-6 lg:mx-0 lg:rounded-3xl lg:overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1600&auto=format&fit=crop"
                alt="Restaurant interior"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/20" />
              <div className="relative z-10 flex h-full flex-col justify-center px-6 py-16 sm:px-8 md:px-12 lg:mx-auto lg:max-w-3xl lg:px-6 lg:py-20 lg:text-center lg:sm:px-12 lg:md:py-28 lg:lg:px-24">
                <motion.div
                  className="space-y-6 lg:space-y-6"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 1 }}
                >
                  <span className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-white/10 px-3 py-2 text-xs font-medium uppercase tracking-widest text-white sm:px-4 sm:text-sm">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" /> Premier dining, zero friction
                  </span>
                  <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-6xl lg:text-center">


                    Welcome back, {userProfile?.displayName?.split(' ')[0]
                      ? userProfile.displayName.split(' ')[0]
                      : (user?.displayName?.split(' ')[0]
                        ? user?.displayName?.split(' ')[0]
                        : "Foodie")
                    }!<br className="lg:hidden" /> Ready to dine?

                  </h1>
                  <p className="text-base leading-relaxed text-white sm:text-lg lg:text-xl lg:text-center">

                    Continue your culinary journey with personalized recommendations, quick reorders, and seamless reservations tailored just for you.

                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 lg:justify-center lg:gap-4">
                    <Link href="/user/reservation">
                      <button className="cursor-pointer w-full rounded-[8px] bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-neutral-100 sm:w-auto sm:px-8 lg:group lg:inline-flex lg:items-center lg:gap-2 ">
                        Reserve Table
                        <span aria-hidden className="hidden transition group-hover:translate-x-1 lg:inline-block">→</span>
                      </button>
                    </Link>
                    <Link href="/user/menu">
                      <button className="cursor-pointer w-full rounded-[8px] border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto sm:px-8">
                        Pre-Order Now
                      </button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.header>

          <motion.section id="dishes" className="mt-24" {...sectionMotion}>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Signature Picks</p>
                <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Top 15 Best-Selling Dishes</h2>

              </div>
              <div className="flex items-center gap-3">
                {locationPermission === 'denied' && (
                  <button
                    onClick={async () => {
                      try {
                        setLocationPermission('pending');
                        const coords = await getUserLocation();
                        setUserLocation(coords);
                        setLocationPermission('granted');

                        // Re-fetch dishes and ratings with new location
                        const [menuResult, ratingsResult] = await Promise.allSettled([
                          getAllMenuItems(),
                          getMenuItemsRatings()
                        ]);

                        if (menuResult.status === 'fulfilled' && menuResult.value.success && menuResult.value.data) {
                          const allDishes = menuResult.value.data;
                          const nearbyDishes = filterDishesByLocation(allDishes, coords.lat, coords.lng, 50);
                          const filteredDishes = nearbyDishes.length > 0 ? nearbyDishes : allDishes;

                          // Update ratings if available
                          if (ratingsResult.status === 'fulfilled' && ratingsResult.value.success && ratingsResult.value.data) {
                            setRatings(ratingsResult.value.data);
                          }

                          // Sort efficiently and take exactly 15 dishes
                          const sortedDishes = filteredDishes
                            .sort((a, b) => {
                              const ratingA = ratingsResult.status === 'fulfilled' && ratingsResult.value.success && ratingsResult.value.data
                                ? ratingsResult.value.data[a.id]?.average || a.rating || 0
                                : a.rating || 0;
                              const ratingB = ratingsResult.status === 'fulfilled' && ratingsResult.value.success && ratingsResult.value.data
                                ? ratingsResult.value.data[b.id]?.average || b.rating || 0
                                : b.rating || 0;
                              return ratingB - ratingA;
                            })
                            .slice(0, 15);

                          setDishes(sortedDishes);
                        }
                      } catch (error) {
                        setLocationPermission('denied');
                      }
                    }}
                    className="rounded-[8px] border border-foreground/10 px-4 py-2 text-sm font-medium transition hover:border-primary/60 hover:text-primary flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Enable Location
                  </button>
                )}
                <Link href="/user/menu">
                  <button className="rounded-[8px] border border-foreground/10 px-5 py-2 text-sm font-medium transition hover:border-primary/60 hover:text-primary cursor-pointer">
                    Explore full menu
                  </button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="mt-10 flex flex-col gap-8">
                {[1, 2].map((rowIndex) => (
                  <div key={rowIndex} className="relative">
                    <div className="flex gap-6 overflow-x-auto pb-4 pr-6">
                      {Array.from({ length: 8 }).map((_, dishIndex) => (
                        <div
                          key={dishIndex}
                          className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-foreground/5 bg-background/70 shadow-sm md:w-[320px] lg:w-[350px] animate-pulse"
                        >
                          <div className="h-40 sm:h-44 w-full bg-gray-200 dark:bg-gray-700" />
                          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                            <div className="space-y-2">
                              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="mt-10 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-[8px] bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : dishes.length === 0 ? (
              <div className="mt-10 text-center">
                <p className="text-muted-foreground mb-4">No dishes available at the moment.</p>
                <Link href="/user/menu">
                  <button className="rounded-[8px] bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 cursor-pointer">
                    Browse Menu
                  </button>
                </Link>
              </div>
            ) : (
              <div className="mt-10 flex flex-col gap-8">
                {dishRows.map((row, rowIndex) => {
                  if (!row.length) return null;
                  const repeated = repeatedDishRows[rowIndex];
                  return (
                    <div key={rowIndex} className="relative">
                      <div
                        className="dish-marquee pb-4 pr-6"
                        ref={(el) => {
                          dishMarqueeRefs.current[rowIndex] = el;
                        }}
                      >
                        <div className="infinite-scroll-wrapper dish-marquee-inner gap-6">
                          {repeated.map((dish, dishIndex) => (
                            <motion.div
                              key={`${dish.id}-${dishIndex}`}
                              whileHover={{ y: -4, scale: 1.02 }}
                              onClick={() => {
                                router.push(`/user/menu/${dish.adminId}`)
                              }}
                              className="group flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-foreground/5 bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 md:w-[320px] lg:w-[350px] cursor-pointer"
                            >
                              <div className="relative h-40 sm:h-44 w-full overflow-hidden">
                                <Image
                                  src={dish.image}
                                  alt={dish.name}
                                  fill
                                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 350px"
                                  className="object-cover transition-all duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>

                              <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                                <div>
                                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">{dish.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{dish.description}</p>
                                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                                    {(ratings[dish.id]?.average || dish.rating || 0) > 0 && (
                                      <>
                                        <div className="flex items-center">{renderStars(dish)}</div>
                                        <span className="text-xs sm:text-sm">{(ratings[dish.id]?.average || dish.rating || 0).toFixed(1)}</span>
                                        {ratings[dish.id]?.count && (
                                          <>
                                            <span className="text-xs">•</span>
                                            <span className="text-xs">({ratings[dish.id].count})</span>
                                          </>
                                        )}
                                        <span className="text-xs">•</span>
                                      </>
                                    )}
                                    <span className="text-xs">{dish.preparationTime} min</span>
                                  </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between">
                                  <span className="text-base sm:text-lg font-semibold text-foreground">₹{dish.price}</span>
                                  <button
                                    onClick={() => handleQuickOrder(dish)}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs sm:text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:shadow-md"
                                  >
                                    Quick Order
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>

          <motion.section id="restaurants" className="mt-24" {...sectionMotion}>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Spotlight</p>
                <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Top 5 Restaurants of the Month</h2>
                <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                  Hand-picked dining rooms delivering remarkable service, inspired menus, and rave-worthy experiences.
                </p>
              </div>
              <Link href="/user/reservation">
                <button className="rounded-[8px] border border-foreground/10 px-5 py-2 text-sm font-medium transition hover:border-primary/60 hover:text-primary cursor-pointer">
                  View all Restaurant
                </button>
              </Link>
            </div>
            {restaurantsLoading ? (
              <div className="mt-10 relative">
                <div className="flex gap-6 overflow-x-auto pb-4 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-foreground/5 bg-background/70 shadow-sm md:w-[320px] lg:w-[380px] xl:w-[400px] animate-pulse"
                    >
                      <div className="h-48 sm:h-52 w-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                          </div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="mt-10 text-center">
                <p className="text-muted-foreground mb-4">No restaurants available at the moment.</p>
                <Link href="/user/reservation">
                  <button className="rounded-[8px] bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 cursor-pointer">
                    Browse Reservations
                  </button>
                </Link>
              </div>
            ) : (
              <div className="mt-10 relative">
                <div
                  className="restaurant-marquee pb-4 pr-6"
                  ref={restaurantMarqueeRef}
                >
                  <div className="infinite-scroll-wrapper restaurant-marquee-inner gap-6">
                    {repeatedTopRestaurants.map((restaurant, index) => (
                      <motion.div
                        key={`${restaurant.adminId || restaurant.id || index}-${index}`}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="group flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-foreground/5 bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 md:w-[320px] lg:w-[380px] xl:w-[400px]"
                        onClick={() => router.push(`/user/menu/${restaurant.id}`)}
                      >
                        <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                          <Image
                            src={restaurant.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop"}
                            alt={restaurant.name}
                            fill
                            sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, (max-width: 1280px) 380px, 400px"
                            className="object-cover transition-all duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-semibold text-foreground truncate">{restaurant.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{restaurant.cuisine}</p>
                            </div>
                            {(restaurantRatings[restaurant.adminId]?.averageRating || restaurant.rating || 0) > 0 && (
                              <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-sm font-semibold text-primary flex-shrink-0">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4" fill="url(#starGradient)" />
                                <span className="text-xs sm:text-sm">
                                  {(restaurantRatings[restaurant.adminId]?.averageRating || restaurant.rating || 0).toFixed(1)}
                                </span>
                                {restaurantRatings[restaurant.adminId]?.totalReviews && (
                                  <span className="text-xs text-primary/70">
                                    ({restaurantRatings[restaurant.adminId].totalReviews})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{restaurant.description}</p>

                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2 leading-relaxed">{formatFullAddress(restaurant)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {restaurant.deliveryTime || '20-30 min'}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {getRestaurantDistance(restaurant)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-2">
                            <Link href={`/user/menu/${restaurant.adminId}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                              <button className="w-full rounded-lg bg-primary px-3 py-2 text-xs sm:text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md cursor-pointer">
                                Order Now
                              </button>
                            </Link>
                            <Link href={`/user/reservation/${restaurant.adminId}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                              <button className="w-full rounded-lg border border-primary/30 px-3 py-2 text-xs sm:text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/10 hover:border-primary/50 cursor-pointer">
                                Reserve Table
                              </button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.section>

          <motion.section id="services" className="mt-24" {...sectionMotion}>
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Services</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Everything you need, in one platform</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Dineezy connects you to reservations, tailored menus, and on-the-go pickups so your next meal is always on your schedule.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-[#b8dcff80] via-[#c9cbff80] to-[#e5c0ff80] p-6 text-slate-900 shadow-sm transition hover:shadow-md dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
                >
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-slate-900 shadow-sm dark:bg-primary/15 dark:text-primary flex-shrink-0">
                      <service.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{service.title}</h3>
                      <p className="text-sm text-slate-700 dark:text-muted-foreground leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section id="testimonials" className="mt-24" {...sectionMotion}>
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Community</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">What Our Guests Say</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                Real stories from diners who rely on Dineezy for date nights, team dinners, and moments worth savoring.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {testimonials.map((testimonial) => (
                <motion.div
                  key={testimonial.name}
                  whileHover={{ y: -6 }}
                  className="flex h-full flex-col gap-5 rounded-3xl border border-foreground/5 bg-background/70 p-6 shadow-sm transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 overflow-hidden rounded-[8px]">
                      <Image
                        src={testimonial.avatar}
                        alt={`${testimonial.name} avatar`}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-base font-semibold">{testimonial.name}</p>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{testimonial.quote}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" fill="url(#starGradient)" stroke="none" />
                    <Star className="h-4 w-4" fill="url(#starGradient)" stroke="none" />
                    <Star className="h-4 w-4" fill="url(#starGradient)" stroke="none" />
                    <Star className="h-4 w-4" fill="url(#starGradient)" stroke="none" />
                    <Star className="h-4 w-4" fill="url(#starGradient)" stroke="none" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section id="contact" className="mt-24" {...sectionMotion}>
            <div className="grid gap-10 rounded-[32px] border border-foreground/5 bg-background/80 p-10 shadow-sm backdrop-blur md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">Stay Updated</p>
                <h2 className="mt-2 text-3xl font-semibold">Reserve smarter. Eat better.</h2>
                <p className="mt-4 max-w-xl text-sm text-muted-foreground">
                  Join thousands of food lovers receiving early access to new restaurant drops, chef collaborations, and exclusive tasting menus.
                </p>
                <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="h-12 w-full rounded-[8px] border border-foreground/10 bg-background px-5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <button className="h-12 rounded-[8px] bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl cursor-pointer">
                    Subscribe
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  No spam. Unsubscribe anytime.
                </p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/8 to-transparent/60 p-6 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Why join the list?</p>
                <ul className="mt-4 space-y-3">
                  <li>• 48-hour early booking windows.</li>
                  <li>• Chef-curated meal pairings every Friday.</li>
                  <li>• Insider events and tasting flights.</li>
                </ul>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-gray-800 bg-black">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                  <span className="text-gray-900 font-bold text-lg">D</span>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Dineezy</p>
                  <p className="text-lg font-semibold text-white">Book. Prep. Enjoy.</p>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                Elevating every dining moment with thoughtful reservations, prepped meals, and curated culinary experiences.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Navigate</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
                <li><Link href="/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Connect</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 text-gray-400" /> +916394575814, +916389055071
                </li>
                <li className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-gray-400" /> webifyit.in@gmail.com
                </li>
                <li className="flex items-center gap-2 hover:text-white transition-colors">
                  <MapPin className="h-4 w-4 text-gray-400" /> Saket Nagar, Kanpur, Uttar Pradesh, India
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Follow</h3>
              <div className="mt-4 flex gap-3">
                <button className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-600 text-gray-400 transition-all hover:border-white hover:text-white hover:bg-white/10 cursor-pointer">
                  <Instagram className="h-5 w-5" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-600 text-gray-400 transition-all hover:border-white hover:text-white hover:bg-white/10 cursor-pointer">
                  <Facebook className="h-5 w-5" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-gray-600 text-gray-400 transition-all hover:border-white hover:text-white hover:bg-white/10 cursor-pointer">
                  <Twitter className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-4 border-t border-gray-800 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Dineezy. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms-conditions" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/refund-policy" className="hover:text-white transition-colors">Refunds</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Notification */}
      {showCartNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 rounded-lg bg-green-500 text-white px-6 py-3 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Item added to cart!</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
