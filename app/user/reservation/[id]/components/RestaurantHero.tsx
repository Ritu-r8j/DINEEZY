'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  CheckCircle2Icon,
  Calendar,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface RestaurantHeroProps {
  restaurantInfo: any;
  restaurantImages: string[];
  restaurantRating: { averageRating: number; totalReviews: number };
  currentImageIndex: number;
  setCurrentImageIndex: (index: number) => void;
  onShowMediaUpload: () => void;
  onShowMobileReservation?: () => void;
  getRestaurantStatus: () => { isOpen: boolean; status: string; hours: string };
}

export default function RestaurantHero({
  restaurantInfo,
  restaurantImages,
  restaurantRating,
  currentImageIndex,
  setCurrentImageIndex,
  onShowMediaUpload,
  onShowMobileReservation = () => {},
  getRestaurantStatus
}: RestaurantHeroProps) {
  const nextImage = () => {
    if (restaurantImages.length > 0) {
      setCurrentImageIndex((currentImageIndex + 1) % restaurantImages.length);
    }
  };

  const prevImage = () => {
    if (restaurantImages.length > 0) {
      setCurrentImageIndex((currentImageIndex - 1 + restaurantImages.length) % restaurantImages.length);
    }
  };

  const ImagePlaceholder = ({ size = 'large' }: { size?: 'large' | 'small' }) => (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <svg 
          className={`${size === 'large' ? 'w-20 h-20' : 'w-16 h-16'} text-gray-500 dark:text-gray-400 mx-auto mb-4`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-300">No images available</p>
        {size === 'large' && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Upload photos to showcase this restaurant</p>
        )}
      </div>
    </div>
  );
 const RatingBadge = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`${
      isMobile 
        ? 'absolute bottom-3 right-2 bg-black text-white px-3 py-2 rounded-xl shadow-lg border border-white' 
        : 'bg-black/80 backdrop-blur-md text-white px-3 xl:px-4 py-2 xl:py-2.5 rounded-xl shadow-xl border border-white/20 flex-shrink-0'
    }`}>
      <div className="text-center">
        {restaurantRating.totalReviews > 0 ? (
          <>
            <div className={`${isMobile ? 'text-xl' : 'text-lg xl:text-xl'} font-bold`}>
              {restaurantRating.averageRating.toFixed(1)}★
            </div>
            <div className="text-xs opacity-90 whitespace-nowrap">
              {restaurantRating.totalReviews} Reviews
            </div>
          </>
        ) : (
          <>
            <div className={`${isMobile ? 'text-sm' : 'text-sm xl:text-base'} font-bold`}>
              {isMobile ? 'No reviews yet' : 'No reviews'}
            </div>
            <div className="text-xs opacity-90 whitespace-nowrap">Be the first!</div>
          </>
        )}
      </div>
    </div>
  );


  return (
    <>
      {/* Mobile Hero Section */}
      <div className="lg:hidden">
        <div className="relative h-[400px] -mx-4 sm:-mx-6">
          {/* Background Image */}
          {restaurantImages.length > 0 ? (
            <img
              src={restaurantImages[currentImageIndex]}
              alt="Restaurant interior"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlaceholder size="small" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

          {/* Top Bar - Back, Upload, Bookmark, Share */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <button className="w-10 h-10 bg-gray-900/70 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex gap-3">
              <button 
                onClick={onShowMediaUpload}
                className="w-10 h-10 bg-gray-900/70 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer"
                title="Upload photos/videos"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button className="w-10 h-10 bg-gray-900/70 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer">
                <Heart className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 bg-gray-900/70 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Restaurant Name & Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {restaurantInfo?.name || 'Restaurant'}
              </h1>
              <p className="text-white/90 text-sm mb-2 leading-relaxed">
                {restaurantInfo?.address ? 
                  `${restaurantInfo.address.street}, ${restaurantInfo.address.city}, ${restaurantInfo.address.state}` :
                  'Restaurant Address'
                }
              </p>
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <span>{restaurantInfo?.location ? 'Nearby' : 'Location'}</span>
                <span>•</span>
                <span>{restaurantInfo?.priceRange || restaurantInfo?.offer || 'Check menu for pricing'}</span>
              </div>
            </div>

        {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              getRestaurantStatus().isOpen 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              <CheckCircle2Icon className="w-5 h-5" fill={getRestaurantStatus().isOpen ? 'white' : 'white'} stroke='black'/>
              <span>{getRestaurantStatus().status} | {getRestaurantStatus().hours}</span>
            </div>


            {/* Rating Badge */}
            <RatingBadge isMobile={true} />
          </div>
        </div>

        {/* Action Buttons Below Image - Mobile Only */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onShowMobileReservation}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-gray-900 dark:text-white" />
            <span>Book a table</span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <MapPin className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
          <button className="flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <Phone className="w-5 h-5 text-gray-900 dark:text-white" />
          </button>
        </div>
      </div>

      {/* Desktop Header & Image Section */}
      <div className="hidden lg:block">
        {/* Image Gallery with Overlay */}
        <div className="relative group">
          <div className="relative h-[450px] xl:h-[500px] overflow-hidden rounded-2xl">
            {/* Main Image */}
            {restaurantImages.length > 0 ? (
              <img
                src={restaurantImages[currentImageIndex]}
                alt="Restaurant interior"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <ImagePlaceholder />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Navigation Arrows */}
            {restaurantImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 xl:left-4 top-1/2 -translate-y-1/2 p-2.5 xl:p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110 cursor-pointer"
                >
                  <ChevronLeft className="w-4 xl:w-5 h-4 xl:h-5 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 xl:right-4 top-1/2 -translate-y-1/2 p-2.5 xl:p-3 bg-white/20 backdrop-blur-md rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110 cursor-pointer"
                >
                  <ChevronRight className="w-4 xl:w-5 h-4 xl:h-5 text-white" />
                </button>
              </>
            )}

            {/* Image Counter */}
            {restaurantImages.length > 0 && (
              <div className="absolute top-3 xl:top-4 right-3 xl:right-4 px-2.5 xl:px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-xs xl:text-sm font-medium shadow-lg">
                {currentImageIndex + 1} / {restaurantImages.length}
              </div>
            )}

            {/* Top Right Actions */}
            <div className="absolute top-3 xl:top-4 right-16 xl:right-20 flex gap-2 xl:gap-3">
              <button 
                onClick={onShowMediaUpload}
                className="p-2 xl:p-2.5 bg-white/20 backdrop-blur-md rounded-full shadow-lg hover:bg-white/30 transition-all duration-200 hover:scale-110 cursor-pointer"
                title="Upload photos/videos"
              >
                <svg className="w-4 xl:w-5 h-4 xl:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button className="p-2 xl:p-2.5 bg-white/20 backdrop-blur-md rounded-full shadow-lg hover:bg-white/30 transition-all duration-200 hover:scale-110 cursor-pointer">
                <Heart className="w-4 xl:w-5 h-4 xl:h-5 text-white" />
              </button>
              <button className="p-2 xl:p-2.5 bg-white/20 backdrop-blur-md rounded-full shadow-lg hover:bg-white/30 transition-all duration-200 hover:scale-110 cursor-pointer">
                <Share2 className="w-4 xl:w-5 h-4 xl:h-5 text-white" />
              </button>
            </div>

            {/* Bottom Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 xl:p-6">
              {/* Restaurant Info */}
              <div className="space-y-3 xl:space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2 drop-shadow-lg truncate">
                      {restaurantInfo?.name || 'Restaurant'}
                    </h2>
                    <div className="flex items-center text-white/90 mb-1.5">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-white" />
                      <p className="text-xs xl:text-sm truncate">
                        {restaurantInfo?.address ?
                          `${restaurantInfo.address.street}, ${restaurantInfo.address.city}, ${restaurantInfo.address.state}` :
                          'Restaurant Address'
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs xl:text-sm text-white/90">
                      <span>{restaurantInfo?.location ? 'Nearby' : 'Location'}</span>
                      <span>•</span>
                      <span>{restaurantInfo?.priceRange || restaurantInfo?.offer || 'Check menu for pricing'}</span>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <RatingBadge />
                </div>

                {/* Status & Action Buttons Row */}
                 <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-2 backdrop-blur-md text-white px-3 xl:px-4 py-2 rounded-full text-xs xl:text-sm font-medium border border-white/20 shadow-lg whitespace-nowrap ${
                    getRestaurantStatus().isOpen 
                      ? 'bg-green-600/80' 
                      : 'bg-red-600/80'
                  }`}>
                    <CheckCircle2Icon className="w-4 xl:w-5 h-4 xl:h-5 flex-shrink-0" />
                    <span className="truncate">{getRestaurantStatus().status} | {getRestaurantStatus().hours}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 xl:gap-3">
                    <button
                      onClick={onShowMobileReservation}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white text-gray-900 px-4 xl:px-6 py-2.5 xl:py-3 rounded-xl font-semibold shadow-xl hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95 text-sm xl:text-base cursor-pointer"
                    >
                      <Calendar className="w-4 xl:w-5 h-4 xl:h-5 text-gray-900" />
                      <span>Book a Table</span>
                    </button>

                    <button className="p-2.5 xl:hidden bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 cursor-pointer">
                      <MapPin className="w-5 h-5 text-white" />
                    </button>

                    <button className="p-2.5 xl:hidden bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200 cursor-pointer">
                      <Phone className="w-5 h-5 text-white" />
                    </button>

                    <button className="hidden xl:flex items-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 px-4 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 hover:scale-105 text-sm cursor-pointer">
                      <MapPin className="w-5 h-5 text-white" />
                      <span>Directions</span>
                    </button>

                    <button className="hidden xl:flex items-center gap-2 bg-white/20 backdrop-blur-md text-white border border-white/30 px-4 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 hover:scale-105 text-sm cursor-pointer">
                      <Phone className="w-5 h-5 text-white" />
                      <span>Call</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Dots */}
          {restaurantImages.length > 1 && (
            <div className="flex justify-center gap-1.5 xl:gap-2 mt-3 xl:mt-4">
              {restaurantImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-1.5 xl:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentImageIndex === index
                      ? 'w-6 xl:w-8 bg-gray-900 dark:bg-white'
                      : 'w-1.5 xl:w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}