'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {
  getRestaurantSettings,
  getRestaurantRating,
  getRestaurantReviews,
  createRestaurantReview,
  updateRestaurantReview,
  deleteRestaurantReview,
  saveRestaurantMedia,
  getRestaurantMedia,
  fixUnresolvedTimestamps,
  createReservation,
  RestaurantReviewData,
  RestaurantMediaData,
  ReservationData
} from '@/app/(utils)/firebaseOperations';
import { uploadToCloudinary } from '@/app/(utils)/cloudinary';
import { sendNotification } from '@/app/(utils)/notification';
import { AlertCircle, Calendar, Clock, Users, Phone, Mail, User, CheckCircle, XCircle, Camera } from 'lucide-react';

// Import components
import RestaurantHero from './components/RestaurantHero';
import MediaGallery from './components/MediaGallery';
import RestaurantInfo from './components/RestaurantInfo';
import ReviewsSection from './components/ReviewsSection';
import MediaUploadModal from './components/MediaUploadModal';

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const restaurantId = params.id as string;

  // Basic states
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
  const [restaurantImages, setRestaurantImages] = useState<string[]>([]);
  const [restaurantRating, setRestaurantRating] = useState<{ averageRating: number, totalReviews: number }>({ averageRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState<RestaurantReviewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [editingReview, setEditingReview] = useState<RestaurantReviewData | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  });
  const [reviewMedia, setReviewMedia] = useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Media upload states
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [restaurantMedia, setRestaurantMedia] = useState<RestaurantMediaData[]>([]);

  // Reservation states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState<string | null>(null);
  const [reservationForm, setReservationForm] = useState({
    date: '',
    time: '',
    guests: 2,
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    specialRequests: ''
  });

  // Media gallery states
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all');

  // Media helper functions
  const getAllMedia = () => {
    const imageMedia = restaurantImages.map((url, index) => ({
      id: `image-${index}`,
      url,
      type: 'image' as const,
      caption: '',
      isFromGallery: true
    }));

    const videoMedia = restaurantMedia
      .filter(media => media.type === 'video')
      .map(media => ({
        id: media.id,
        url: media.url,
        type: 'video' as const,
        caption: '',
        isFromGallery: false
      }));

    return [...imageMedia, ...videoMedia];
  };

  const getFilteredMedia = () => {
    const allMedia = getAllMedia();
    switch (mediaFilter) {
      case 'images':
        return allMedia.filter(media => media.type === 'image');
      case 'videos':
        return allMedia.filter(media => media.type === 'video');
      default:
        return allMedia;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideoFile = (file: File) => file.type.startsWith('video/');
  const isImageFile = (file: File) => file.type.startsWith('image/');


  // Helper function to get time ago string
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // Helper function to check if restaurant is open
  const getRestaurantStatus = () => {
    if (!restaurantInfo?.hours) {
      return { isOpen: false, status: 'Hours not available', hours: 'Contact restaurant' };
    }

    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = restaurantInfo.hours[currentDay];

    // Check if restaurant is closed today
    if (!todayHours || !todayHours.open) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const currentDayIndex = days.indexOf(currentDay);

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = days[nextDayIndex];
        const nextDayHours = restaurantInfo.hours[nextDay];

        if (nextDayHours && nextDayHours.open && nextDayHours.from !== "00:00" && nextDayHours.to !== "00:00") {
          return {
            isOpen: false,
            status: 'Closed',
            hours: `Opens ${nextDay} at ${formatTime(nextDayHours.from)}`
          };
        }
      }

      return { isOpen: false, status: 'Closed', hours: 'Closed today' };
    }

    if (todayHours.from === "00:00" && todayHours.to === "00:00") {
      return {
        isOpen: true,
        status: 'Open 24 hours',
        hours: 'Open 24 hours'
      };
    }

    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const openTime = parseTime(todayHours.from);
    const closeTime = parseTime(todayHours.to);
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    let isOpen;
    if (closeTime < openTime) {
      isOpen = currentTimeMinutes >= openTime || currentTimeMinutes <= closeTime;
    } else {
      isOpen = currentTimeMinutes >= openTime && currentTimeMinutes <= closeTime;
    }

    return {
      isOpen,
      status: isOpen ? 'Open now' : 'Closed',
      hours: `${formatTime(todayHours.from)} - ${formatTime(todayHours.to)}`
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/user/login');
    }
  }, [user, authLoading, router]);

  // Load restaurant information
  useEffect(() => {
    const loadRestaurantInfo = async () => {
      if (!restaurantId) {
        setError('Restaurant ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const settingsResult = await getRestaurantSettings(restaurantId);
        if (settingsResult.success && settingsResult.data) {
          setRestaurantInfo(settingsResult.data);

          try {
            const mediaResult = await getRestaurantMedia(restaurantId, true);
            if (mediaResult.success && mediaResult.data) {
              setRestaurantMedia(mediaResult.data);
              const imageUrls = mediaResult.data
                .filter(media => media.type === 'image')
                .map(media => media.url);

              if (settingsResult.data.image) {
                setRestaurantImages([settingsResult.data.image, ...imageUrls]);
              } else {
                setRestaurantImages(imageUrls);
              }
            } else {
              if (settingsResult.data.image) {
                setRestaurantImages([settingsResult.data.image]);
              }
            }
          } catch (mediaErr) {
            console.warn('Could not load restaurant media:', mediaErr);
            if (settingsResult.data.image) {
              setRestaurantImages([settingsResult.data.image]);
            }
          }
        } else {
          setError('Restaurant not found');
        }

        try {
          const ratingResult = await getRestaurantRating(restaurantId);
          if (ratingResult.success && ratingResult.data) {
            setRestaurantRating({
              averageRating: ratingResult.data.averageRating,
              totalReviews: ratingResult.data.totalReviews
            });
          }
        } catch (ratingErr) {
          console.warn('Could not load restaurant rating:', ratingErr);
        }

        try {
          const reviewsResult = await getRestaurantReviews(restaurantId);

          if (reviewsResult.success && reviewsResult.data && reviewsResult.data.length > 0) {
            const hasUnresolvedTimestamps = reviewsResult.data.some(review => {
              const createdAtHasMethodName = review.createdAt && typeof review.createdAt === 'object' &&
                '_methodName' in review.createdAt && review.createdAt._methodName === 'serverTimestamp';
              const updatedAtHasMethodName = review.updatedAt && typeof review.updatedAt === 'object' &&
                'updatedAt' in review.updatedAt && review.updatedAt._methodName === 'serverTimestamp';
              return createdAtHasMethodName || updatedAtHasMethodName;
            });

            if (hasUnresolvedTimestamps) {
              try {
                await fixUnresolvedTimestamps(restaurantId);
                const updatedReviewsResult = await getRestaurantReviews(restaurantId);
                if (updatedReviewsResult.success && updatedReviewsResult.data) {
                  setReviews(updatedReviewsResult.data);
                } else {
                  setReviews(reviewsResult.data);
                }
              } catch (fixError) {
                console.error('Error fixing timestamps:', fixError);
                setReviews(reviewsResult.data);
              }
            } else {
              setReviews(reviewsResult.data);
            }
          } else {
            // Sample reviews for demonstration
            const sampleReviews: RestaurantReviewData[] = [
              ...(user ? [{
                id: 'current-user-sample',
                restaurantId: restaurantId,
                userId: user.uid,
                userName: (() => {
                  if (user.displayName) return user.displayName;
                  if (user.email) {
                    const emailName = user.email.split('@')[0];
                    return emailName.split('.').map(part =>
                      part.charAt(0).toUpperCase() + part.slice(1)
                    ).join(' ');
                  }
                  return 'You';
                })(),
                userEmail: user.email || '',
                userPhotoURL: user.photoURL || '',
                rating: 5,
                comment: 'Great experience! The food was amazing and the service was excellent. Highly recommend this place!',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
                isVerified: true,
                helpful: 5,
                notHelpful: 0,
                media: []
              }] : []),
              {
                id: 'sample-1',
                restaurantId: restaurantId,
                userId: 'sample-user-1',
                userName: 'Advik Gupta',
                userEmail: 'advik@example.com',
                userPhotoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                rating: 5,
                comment: 'Recently I visited molecule kanpur There I met Dhruv who was very cute and kind hearted, his service was amazing and the food was delicious. Will definitely be back!',
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(),
                isVerified: true,
                helpful: 12,
                notHelpful: 1,
                media: []
              }
            ];
            setReviews(sampleReviews);
          }
        } catch (reviewsErr) {
          console.warn('Could not load restaurant reviews:', reviewsErr);
        }

      } catch (err) {
        console.error('Error loading restaurant info:', err);
        setError('Failed to load restaurant information');
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurantInfo();
  }, [restaurantId]);

  // Update form with user data when user is available
  useEffect(() => {
    if (user) {
      setReservationForm(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);


  // Review handling functions (simplified versions)
  const handleReviewSubmit = async () => {
    // Implementation for review submission
  };

  const handleEditReview = (review: RestaurantReviewData) => {
    // Implementation for editing reviews
  };

  const handleDeleteReview = async (reviewId: string) => {
    // Implementation for deleting reviews
  };

  const handleNewReview = () => {
    setEditingReview(null);
    setReviewForm({ rating: 0, comment: '' });
    setReviewMedia([]);
    setShowReviewForm(true);
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only images and videos under 50MB are allowed.');
    }

    setReviewMedia(prev => [...prev, ...validFiles]);
  };

  const removeMedia = (index: number) => {
    setReviewMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleMediaUpload = async (files: File[]) => {
    if (!files.length) return;

    setIsUploadingMedia(true);
    setUploadingMedia(files);
    setError(null);

    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileId = `${Date.now()}-${index}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        try {
          const uploadResult = await uploadToCloudinary(file, (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          });

          if (uploadResult && uploadResult.secure_url) {
            const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
            const mediaData: Omit<RestaurantMediaData, 'id' | 'createdAt' | 'updatedAt'> = {
              restaurantId,
              url: uploadResult.secure_url,
              type: mediaType,
              isApproved: false,
              uploadedBy: user?.uid || '',
              filename: file.name,
              format: file.type,
              publicId: uploadResult.public_id || ''
            };

            const saveResult = await saveRestaurantMedia(mediaData);
            if (saveResult.success) {
              setRestaurantMedia(prev => [...prev, saveResult.data!]);
              if (mediaType === 'image') {
                setRestaurantImages(prev => [...prev, uploadResult.secure_url]);
              }
            }
          }
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          throw uploadError;
        } finally {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }
      });

      await Promise.all(uploadPromises);
    } catch (error: any) {
      setError(error.message || 'Failed to upload media');
    } finally {
      setIsUploadingMedia(false);
      setUploadingMedia([]);
      setUploadProgress({});
    }
  };

  const handleMediaFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only images and videos under 50MB are allowed.');
    }

    if (validFiles.length > 0) {
      handleMediaUpload(validFiles);
    }
  };

  // Generate reservation ID
  const generateReservationId = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RES${dateStr}${timeStr}${randomStr}`;
  };

  // Get available time slots
  const getAvailableTimeSlots = () => {
    if (!restaurantInfo?.hours) return [];

    const selectedDate = new Date(reservationForm.date);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const todayHours = restaurantInfo.hours[dayName];

    if (!todayHours || !todayHours.open) return [];

    const slots = [];
    const openTime = todayHours.from;
    const closeTime = todayHours.to;

    // Parse time strings
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    // If it's today, filter out past times
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Generate 30-minute slots
    let slotHour = openHour;
    let slotMin = openMin;

    while (slotHour < closeHour || (slotHour === closeHour && slotMin < closeMin)) {
      // Skip past times if it's today
      if (!isToday || slotHour > currentHour || (slotHour === currentHour && slotMin > currentMinute + 30)) {
        const timeStr = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }

      slotMin += 30;
      if (slotMin >= 60) {
        slotMin = 0;
        slotHour++;
      }
    }

    return slots;
  };

  // Check if restaurant is open on selected date
  const isRestaurantOpenOnDate = (date: string) => {
    if (!restaurantInfo?.hours || !date) return false;

    const selectedDate = new Date(date);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayHours = restaurantInfo.hours[dayName];

    return dayHours && dayHours.open;
  };

  // Handle reservation submission
  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please log in to make a reservation');
      return;
    }

    if (!reservationForm.date || !reservationForm.time || !reservationForm.name || !reservationForm.email || !reservationForm.phone) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmittingReservation(true);
    setError(null);

    try {
      const reservationId = generateReservationId();

      const reservationData: Omit<ReservationData, 'id' | 'createdAt' | 'updatedAt'> = {
        reservationId,
        restaurantId,
        userId: user.uid,
        isGuest: false,
        customerInfo: {
          name: reservationForm.name,
          email: reservationForm.email,
          phone: reservationForm.phone
        },
        reservationDetails: {
          date: reservationForm.date,
          time: reservationForm.time,
          guests: reservationForm.guests,
          specialRequests: reservationForm.specialRequests || undefined
        },
        status: 'pending'
      };

      const result = await createReservation(reservationData);

      if (result.success) {
        // Send WhatsApp notification to user (reservation submitted, pending confirmation)
        try {
          const notificationData = {
            name: reservationForm.name,
            restaurant: restaurantInfo?.name || 'Restaurant',
            date: new Date(reservationForm.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: new Date(`2000-01-01T${reservationForm.time}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            guests: reservationForm.guests,
            reservationId: reservationId,
            specialRequests: reservationForm.specialRequests
          };

          await sendNotification('RESERVATION_CONFIRMED', reservationForm.phone, notificationData);
          console.log('✅ Reservation submission notification sent via WhatsApp');
        } catch (notificationError) {
          console.error('❌ Failed to send WhatsApp notification:', notificationError);
          // Don't fail the reservation if notification fails
        }

        setReservationSuccess(reservationId);
        setShowReservationModal(false);
        setReservationForm({
          date: '',
          time: '',
          guests: 2,
          name: user?.displayName || '',
          email: user?.email || '',
          phone: '',
          specialRequests: ''
        });
      } else {
        setError(result.error || 'Failed to create reservation');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation');
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="w-12 h-12 mx-auto mb-4 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">You must be logged in to view restaurant details.</p>
            <button
              onClick={() => router.push('/user/login')}
              className="w-full px-4 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading restaurant information...</p>
        </div>
      </div>
    );
  }

  if (error && !restaurantInfo) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="w-12 h-12 mx-auto mb-4 text-red-400">
              <AlertCircle className="w-full h-full" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-[#0a0e1a] dark:to-[#0f1419] pb-20 lg:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Restaurant Hero Section */}
          <RestaurantHero
            restaurantInfo={restaurantInfo}
            restaurantImages={restaurantImages}
            restaurantRating={restaurantRating}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            onShowMediaUpload={() => setShowMediaUpload(true)}
            onShowMobileReservation={() => setShowReservationModal(true)}
            getRestaurantStatus={getRestaurantStatus}
          />

          {/* Photos Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Photos</h2>
                <button
                  onClick={() => setShowMediaUpload(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-all duration-200"
                >
                  <Camera className="w-4 h-4" />
                  Add Media
                </button>
              </div>
            </div>

            <div className="p-6">
              {getAllMedia().length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No photos yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Be the first to share photos and videos of this restaurant!</p>
                  <button
                    onClick={() => setShowMediaUpload(true)}
                    className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium transition-all duration-200"
                  >
                    Add photo
                  </button>
                </div>
              ) : (
                <>
                  {/* Media Grid - Masonry Layout */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {/* Large featured image */}
                    {getAllMedia().length > 0 && (
                      <div
                        className="col-span-2 relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
                        onClick={() => {
                          setSelectedMediaIndex(0);
                          setShowFullGallery(true);
                        }}
                      >
                        {getAllMedia()[0].type === 'image' ? (
                          <img
                            src={getAllMedia()[0].url}
                            alt="Restaurant photo"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video
                              src={getAllMedia()[0].url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                              <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}

                    {/* Grid of smaller images */}
                    {getAllMedia().slice(1, 5).map((media, index) => (
                      <div
                        key={media.id}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer group ${index === 0 ? 'aspect-square' :
                          index === 1 ? 'aspect-[4/3]' :
                            'aspect-square'
                          }`}
                        onClick={() => {
                          setSelectedMediaIndex(index + 1);
                          setShowFullGallery(true);
                        }}
                      >
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt="Restaurant photo"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video
                              src={media.url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Show count overlay on last visible image */}
                        {index === 3 && getAllMedia().length > 5 && (
                          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                            <span className="text-white font-semibold text-xl">+{getAllMedia().length - 5}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* View All Button */}
                  {getAllMedia().length > 5 && (
                    <div className="text-center">
                      <button
                        onClick={() => setShowFullGallery(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        View all {getAllMedia().length} photos
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Restaurant Info */}
          <RestaurantInfo restaurantInfo={restaurantInfo} />

          {/* Reviews Section */}
          <ReviewsSection
            reviews={reviews}
            user={user}
            showAllReviews={showAllReviews}
            showReviewForm={showReviewForm}
            editingReview={editingReview}
            reviewForm={reviewForm}
            reviewMedia={reviewMedia}
            isSubmittingReview={isSubmittingReview}
            error={error}
            onShowReviewForm={handleNewReview}
            onCloseReviewForm={() => {
              setShowReviewForm(false);
              setEditingReview(null);
              setReviewForm({ rating: 0, comment: '' });
              setReviewMedia([]);
            }}
            onReviewFormChange={setReviewForm}
            onMediaSelect={handleMediaSelect}
            onRemoveMedia={removeMedia}
            onSubmitReview={handleReviewSubmit}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            getTimeAgo={getTimeAgo}
          />
        </div>

        {/* Media Upload Modal */}
        {showMediaUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Photos & Videos</h3>
                  <button
                    onClick={() => {
                      setShowMediaUpload(false);
                      setUploadingMedia([]);
                      setUploadProgress({});
                      setError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-pink-200 dark:border-pink-800 rounded-2xl p-8 text-center hover:border-pink-300 dark:hover:border-pink-700 transition-colors bg-pink-50/30 dark:bg-pink-900/10">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaFileSelect}
                      className="hidden"
                      id="media-upload"
                      disabled={isUploadingMedia}
                    />
                    <label
                      htmlFor="media-upload"
                      className={`cursor-pointer ${isUploadingMedia ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {isUploadingMedia ? 'Uploading...' : 'Choose files to upload'}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Select photos and videos from your device
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        JPG, PNG, GIF, MP4, MOV • Max 50MB each
                      </p>
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploadingMedia.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Uploading Files</h4>
                      {uploadingMedia.map((file, index) => {
                        const fileId = `${Date.now()}-${index}`;
                        const progress = uploadProgress[fileId] || 0;
                        return (
                          <div key={fileId} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-xl flex items-center justify-center">
                                  {isVideoFile(file) ? (
                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">{file.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-pink-600 dark:text-pink-400">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-pink-600 dark:bg-pink-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Guidelines */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Guidelines</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Share authentic photos and videos of your experience</li>
                      <li>• Keep content appropriate and restaurant-related</li>
                      <li>• High-quality images get more visibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Modal */}
        {showReservationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Make a Reservation</h3>
                  <button
                    onClick={() => setShowReservationModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleReservationSubmit} className="space-y-4">
                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={getMinDate()}
                      max={getMaxDate()}
                      value={reservationForm.date}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, date: e.target.value, time: '' }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Time *
                    </label>
                    {reservationForm.date && !isRestaurantOpenOnDate(reservationForm.date) ? (
                      <div className="w-full px-4 py-3 border border-red-300 dark:border-red-600 rounded-xl bg-red-50 dark:bg-red-900/20">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Restaurant is closed on this date. Please select another date.
                        </p>
                      </div>
                    ) : (
                      <select
                        required
                        value={reservationForm.time}
                        onChange={(e) => setReservationForm(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={!reservationForm.date || !isRestaurantOpenOnDate(reservationForm.date)}
                      >
                        <option value="">
                          {!reservationForm.date ? 'Select date first' : 'Select time'}
                        </option>
                        {getAvailableTimeSlots().map((time) => (
                          <option key={time} value={time}>
                            {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </option>
                        ))}
                      </select>
                    )}
                    {reservationForm.date && isRestaurantOpenOnDate(reservationForm.date) && getAvailableTimeSlots().length === 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        No available time slots for this date. Please select another date.
                      </p>
                    )}
                  </div>

                  {/* Number of Guests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Number of Guests *
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setReservationForm(prev => ({ ...prev, guests: num }))}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${reservationForm.guests === num
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      For parties larger than 10, please call the restaurant directly.
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={reservationForm.name}
                        onChange={(e) => setReservationForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={reservationForm.email}
                        onChange={(e) => setReservationForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={reservationForm.phone}
                        onChange={(e) => setReservationForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter your phone number"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                        </svg>
                        You'll receive WhatsApp confirmation & updates
                      </p>
                    </div>
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Requests
                    </label>
                    <textarea
                      value={reservationForm.specialRequests}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="Any special requests or dietary requirements..."
                    />
                  </div>

                  {/* Reservation Summary */}
                  {reservationForm.date && reservationForm.time && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Reservation Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Restaurant:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{restaurantInfo?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Date:</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(reservationForm.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Time:</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(`2000-01-01T${reservationForm.time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Guests:</span>
                          <span className="text-gray-900 dark:text-white">
                            {reservationForm.guests} {reservationForm.guests === 1 ? 'Guest' : 'Guests'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowReservationModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReservation}
                      className="flex-1 px-4 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmittingReservation ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Booking...
                        </>
                      ) : (
                        'Book Table'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {reservationSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Reservation Confirmed!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your reservation has been successfully submitted. You'll receive a confirmation email shortly.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Reservation ID: {reservationSuccess}
                  </p>
                </div>
                <button
                  onClick={() => setReservationSuccess(null)}
                  className="w-full px-4 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Gallery Modal */}
        {showFullGallery && (
          <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
            <div className="w-full h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 bg-black bg-opacity-50">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-white">Media Gallery</h3>
                
                </div>
                <button
                  onClick={() => {
                    setShowFullGallery(false);
                    setMediaFilter('all');
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              {/* Media Display */}
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                {getFilteredMedia().length > 0 ? (
                  <div className="relative max-w-4xl max-h-full">
                    {/* Current Media */}
                    <div className="relative">
                      {getFilteredMedia()[selectedMediaIndex]?.type === 'image' ? (
                        <img
                          src={getFilteredMedia()[selectedMediaIndex]?.url}
                          alt="Gallery media"
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                        />
                      ) : (
                        <video
                          src={getFilteredMedia()[selectedMediaIndex]?.url}
                          controls
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                          autoPlay
                        />
                      )}
                    </div>

                    {/* Navigation Arrows */}
                    {getFilteredMedia().length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedMediaIndex(prev =>
                            prev === 0 ? getFilteredMedia().length - 1 : prev - 1
                          )}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all duration-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedMediaIndex(prev =>
                            prev === getFilteredMedia().length - 1 ? 0 : prev + 1
                          )}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all duration-200"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Media Counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-full">
                      <span className="text-white text-sm font-medium">
                        {selectedMediaIndex + 1} of {getFilteredMedia().length}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No {mediaFilter === 'all' ? 'media' : mediaFilter} found</h3>
                    <p className="text-gray-300">Try selecting a different filter or upload some media!</p>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {getFilteredMedia().length > 1 && (
                <div className="p-4 sm:p-6 bg-black bg-opacity-50">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {getFilteredMedia().map((media, index) => (
                      <button
                        key={media.id}
                        onClick={() => setSelectedMediaIndex(index)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${index === selectedMediaIndex
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-70 hover:opacity-100'
                          }`}
                      >
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Floating Reservation Button */}
        <div className="fixed bottom-4 right-4 lg:hidden z-40">
          <button
            onClick={() => setShowReservationModal(true)}
            className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <Calendar className="w-5 h-5" />
            Book Table
          </button>
        </div>
      </main>
    </div>
  );
}