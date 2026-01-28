'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Clock, MapPin, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getAllRestaurants, getRestaurantRating, RestaurantSettings } from '@/app/(utils)/firebaseOperations';
import { fadeIn, stagger } from '@/lib/motion';

export function RestaurantListing() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantSettings[]>([]);
  const [restaurantRatings, setRestaurantRatings] = useState<Record<string, { averageRating: number; totalReviews: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurants on component mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const result = await getAllRestaurants();
        if (result.success && result.data) {
          // Limit to first 6 restaurants for home page
          const limitedRestaurants = result.data.slice(0, 6);
          setRestaurants(limitedRestaurants);
          
          // Fetch ratings for each restaurant
          const ratingsData: Record<string, { averageRating: number; totalReviews: number }> = {};
          for (const restaurant of limitedRestaurants) {
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
        console.error('Error fetching restaurants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // Helper functions
  const getRestaurantImage = (restaurant: RestaurantSettings) => {
    return restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
  };

  const getRating = (restaurant: RestaurantSettings) => {
    if (restaurant.id && restaurantRatings[restaurant.id]) {
      return restaurantRatings[restaurant.id].averageRating;
    }
    return restaurant.rating || 4.5;
  };

  const getTotalReviews = (restaurant: RestaurantSettings) => {
    if (restaurant.id && restaurantRatings[restaurant.id]) {
      return restaurantRatings[restaurant.id].totalReviews;
    }
    return 0;
  };

  const getDeliveryTime = (restaurant: RestaurantSettings) => {
    return restaurant.deliveryTime || '20-30 min';
  };

  const getRestaurantTypeBadge = (restaurant: RestaurantSettings) => {
    if (!restaurant.restaurantType) return null;
    
    const typeColors = {
      'Veg': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Non-Veg': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'Both': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[restaurant.restaurantType]}`}>
        {restaurant.restaurantType}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Featured Restaurants
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing restaurants in your area
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <section id="restaurants" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
          >
            Featured Restaurants
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Discover amazing restaurants in your area, each offering unique flavors and exceptional dining experiences.
          </motion.p>
        </div>

        {/* Restaurant Grid */}
        {restaurants.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No restaurants available</h3>
            <p className="text-gray-500 dark:text-gray-400">Check back later for new restaurants.</p>
          </div>
        ) : (
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {restaurants.map((restaurant, index) => (
              <motion.article
                key={restaurant.id || index}
                variants={fadeIn}
                className="group cursor-pointer bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-border overflow-hidden hover:scale-105"
                onClick={() => router.push(`/user/menu/${restaurant.id}`)}
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                    style={{backgroundImage: `url(${getRestaurantImage(restaurant)})`}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Delivery Time Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                      <Clock className="w-3 h-3" />
                      <span>{getDeliveryTime(restaurant)}</span>
                    </div>
                  </div>

                  {/* Restaurant Type Badge */}
                  {getRestaurantTypeBadge(restaurant) && (
                    <div className="absolute top-4 left-4">
                      {getRestaurantTypeBadge(restaurant)}
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
                      {restaurant.name}
                    </h3>
                    
                    {/* Rating and Reviews */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-black fill-current" />
                        <span className="font-medium text-foreground">{getRating(restaurant).toFixed(2)}</span>
                      </div>
                      <span>•</span>
                      <span>{getTotalReviews(restaurant)} reviews</span>
                      <span>•</span>
                      <span>{restaurant.cuisine || 'Restaurant'}</span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {restaurant.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {restaurant.description}
                    </p>
                  )}
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">
                      {restaurant.address?.city}, {restaurant.address?.state}
                    </span>
                  </div>

                  {/* Specialties */}
                  {restaurant.specialties && restaurant.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {restaurant.specialties.slice(0, 2).map((specialty, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          {specialty}
                        </span>
                      ))}
                      {restaurant.specialties.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{restaurant.specialties.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        {/* View All Button */}
        {restaurants.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={() => router.push('/user/menu')}
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <span>View All Restaurants</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
