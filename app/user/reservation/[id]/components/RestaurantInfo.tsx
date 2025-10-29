'use client';

import { MapPin, CheckCircle, Utensils } from 'lucide-react';

interface RestaurantInfoProps {
  restaurantInfo: any;
}

export default function RestaurantInfo({ restaurantInfo }: RestaurantInfoProps) {
  return (
    <div className="bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-gray-800 p-4 sm:p-6 rounded-lg shadow-sm">
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        About the restaurant
      </h3>

      {/* Restaurant Details Grid */}
      <div className="space-y-4 sm:space-y-6">
        {/* Pricing */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-black dark:text-white font-bold text-lg">₹</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Pricing</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {restaurantInfo?.priceRange || restaurantInfo?.offer || 'Check menu for pricing'}
            </p>
          </div>
        </div>

        {/* Cuisine */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <Utensils className="w-5 h-5 text-black dark:text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Cuisine</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {restaurantInfo?.cuisine || 
               (restaurantInfo?.specialties && restaurantInfo.specialties.length > 0 
                 ? restaurantInfo.specialties.join(', ') 
                 : 'Various cuisines')}
            </p>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <MapPin className="w-5 h-5 text-black dark:text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Address</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {restaurantInfo?.address ? 
                `${restaurantInfo.address.street}, ${restaurantInfo.address.city}, ${restaurantInfo.address.state} ${restaurantInfo.address.postalCode}` :
                'Restaurant Address'
              }
            </p>
          </div>
        </div>

        {/* Facilities */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Facilities</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {(restaurantInfo?.amenities || [
              'Lunch',
              'Dinner', 
              'Full bar available',
              'DJ',
              'Indoor seating'
            ]).map((facility: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-4 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-black dark:text-white" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{facility}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}