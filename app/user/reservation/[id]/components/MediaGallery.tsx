

'use client';

import { RestaurantMediaData } from '@/app/(utils)/firebaseOperations';

interface MediaGalleryProps {
  restaurantImages: string[];
  restaurantMedia: RestaurantMediaData[];
  onShowMediaUpload: () => void;
}

export default function MediaGallery({
  restaurantImages,
  restaurantMedia,
  onShowMediaUpload
}: MediaGalleryProps) {
  const MediaPlaceholder = ({ type, size = 'normal' }: { type: 'image' | 'video'; size?: 'normal' | 'small' }) => (
    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center">
        {type === 'video' ? (
          <svg className={`${size === 'small' ? 'w-6 h-6' : 'w-12 h-12'} text-gray-400 dark:text-gray-500 mx-auto mb-${size === 'small' ? '1' : '2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className={`${size === 'small' ? 'w-6 h-6' : 'w-12 h-12'} text-gray-400 dark:text-gray-500 mx-auto mb-${size === 'small' ? '1' : '2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          {type === 'video' ? 'No videos' : 'No image'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0f1419] dark:border-gray-800 p-4 sm:p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Media</h3>
        <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">
          View all
        </button>
      </div>

      {/* Horizontal Scrollable Media Gallery */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
          {/* All Media Items */}
          {[...restaurantImages, ...restaurantMedia.filter(m => m.type === 'video').map(m => m.url)].map((media, index) => {
            const isVideo = index >= restaurantImages.length;
            const videoIndex = index - restaurantImages.length;
            
            return (
              <div key={index} className="relative group cursor-pointer">
                <div className="w-48 h-32 sm:w-56 sm:h-36 md:w-64 md:h-40 overflow-hidden rounded-lg flex-shrink-0">
                  {isVideo ? (
                    <>
                      <img
                        src={restaurantMedia.filter(m => m.type === 'video')[videoIndex]?.url}
                        alt="Restaurant video thumbnail"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                          <svg className="w-5 h-5 text-gray-900 dark:text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 text-white">
                        <div className="text-xs font-medium">Restaurant Video</div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={media}
                      alt={`Restaurant view ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Upload Media Item */}
          <div 
            className="relative group cursor-pointer"
            onClick={onShowMediaUpload}
          >
            <div className="w-48 h-32 sm:w-56 sm:h-36 md:w-64 md:h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center rounded-lg flex-shrink-0">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Upload media</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center mt-3 space-x-1">
        <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
}