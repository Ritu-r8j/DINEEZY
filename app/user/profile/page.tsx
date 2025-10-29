'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  getUserOrders,
  getUserReservations,
  formatFirebaseTimestamp,
  storeOTPInFirestore,
  verifyOTPFromFirestore,
  checkPhoneNumberExists,
  OrderData,
  ReservationData
} from '@/app/(utils)/firebaseOperations';
import { sendNotification } from '@/app/(utils)/notification';
import { Loader2, Crown, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TierDefinition {
  name: string;
  minPoints: number;
}

interface TierStatus {
  current: TierDefinition;
  next: TierDefinition | null;
  progress: number;
  pointsToNext: number;
}

const TIER_DEFINITIONS: TierDefinition[] = [
  { name: 'Bronze', minPoints: 0 },
  { name: 'Silver', minPoints: 200 },
  { name: 'Gold', minPoints: 500 },
  { name: 'Platinum', minPoints: 1000 }
];

const TIER_STYLE_MAP: Record<string, { gradient: string; badgeBg: string; badgeText: string; pillBg: string; pillText: string; accentBorder: string; progressFill: string; }> = {
  Bronze: {
    gradient: 'from-[#3f2b1a] via-[#221b14] to-[#15100c]',
    badgeBg: 'bg-[#4c3827]/80',
    badgeText: 'text-[#f6d6a6]',
    pillBg: 'bg-[#5a422f]/80',
    pillText: 'text-[#f6d6a6]',
    accentBorder: 'border-[#f6d6a6]/20',
    progressFill: 'bg-[#f6d6a6]'
  },
  Silver: {
    gradient: 'from-[#3b3f47] via-[#21252d] to-[#141920]',
    badgeBg: 'bg-[#4b505c]/80',
    badgeText: 'text-[#e5ecff]',
    pillBg: 'bg-[#5c6270]/80',
    pillText: 'text-[#e5ecff]',
    accentBorder: 'border-[#e5ecff]/20',
    progressFill: 'bg-[#e5ecff]'
  },
  Gold: {
    gradient: 'from-[#4f3716] via-[#2a1f10] to-[#140d05]',
    badgeBg: 'bg-[#66451b]/80',
    badgeText: 'text-[#ffe9b0]',
    pillBg: 'bg-[#7b5722]/80',
    pillText: 'text-[#ffe9b0]',
    accentBorder: 'border-[#ffe9b0]/25',
    progressFill: 'bg-[#ffe9b0]'
  },
  Platinum: {
    gradient: 'from-[#3d3d47] via-[#1f1f28] to-[#101017]',
    badgeBg: 'bg-[#4f4f58]/80',
    badgeText: 'text-[#dde2ff]',
    pillBg: 'bg-[#616170]/80',
    pillText: 'text-[#dde2ff]',
    accentBorder: 'border-[#dde2ff]/25',
    progressFill: 'bg-[#dde2ff]'
  }
};

const calculateTierStatus = (points: number): TierStatus => {
  const sortedTiers = [...TIER_DEFINITIONS].sort((a, b) => a.minPoints - b.minPoints);
  let currentTier = sortedTiers[0];

  for (const tier of sortedTiers) {
    if (points >= tier.minPoints) {
      currentTier = tier;
    }
  }

  const currentIndex = sortedTiers.findIndex(tier => tier.name === currentTier.name);
  const nextTier = currentIndex < sortedTiers.length - 1 ? sortedTiers[currentIndex + 1] : null;

  if (!nextTier) {
    return {
      current: currentTier,
      next: null,
      progress: 1,
      pointsToNext: 0
    };
  }

  const range = Math.max(nextTier.minPoints - currentTier.minPoints, 1);
  const progress = Math.min(Math.max((points - currentTier.minPoints) / range, 0), 1);

  return {
    current: currentTier,
    next: nextTier,
    progress,
    pointsToNext: Math.max(nextTier.minPoints - points, 0)
  };
};

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading, signOut, setUser } = useAuth();
  const [vegetarianMode, setVegetarianMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [tierStatus, setTierStatus] = useState<TierStatus>(() => calculateTierStatus(0));
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    phoneNumber: '',
    email: ''
  });
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: '1',
      type: 'Home',
      address: '123 Maple Street, Kanpur, India',
      isDefault: true
    },
    {
      id: '2',
      type: 'Work',
      address: '456 Oak Avenue, Kanpur, India',
      isDefault: false
    }
  ]);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [recentReservations, setRecentReservations] = useState<ReservationData[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  // OTP Verification States
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');

  useEffect(() => {
    if (user) {
      setEditForm({
        displayName: userProfile?.displayName || user.displayName || '',
        phoneNumber: userProfile?.phoneNumber || user.phoneNumber || '',
        email: userProfile?.email || user.email || ''
      });
      setIsLoading(false);

      // Fetch user's orders and reservations
      fetchUserData();
    }
  }, [user, userProfile]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user orders
      setOrdersLoading(true);
      const ordersResult = await getUserOrders(user.uid);
      if (ordersResult.success && ordersResult.data) {
        setRecentOrders(ordersResult.data.slice(0, 6)); // Show last 6 orders
      }

      // Fetch user reservations
      setReservationsLoading(true);
      const reservationsResult = await getUserReservations(user.uid);
      if (reservationsResult.success && reservationsResult.data) {
        setRecentReservations(reservationsResult.data.slice(0, 3)); // Show last 3 reservations
      }

      // Calculate loyalty points and total spent from orders
      if (ordersResult.success && ordersResult.data) {
        const totalSpentAmount = ordersResult.data.reduce((sum, order) => sum + order.total, 0);
        const totalDiscountAmount = ordersResult.data.reduce((sum, order) => sum + (order.discount || 0), 0);
        const computedPoints = Math.floor(totalSpentAmount / 10);

        setTotalSpent(totalSpentAmount);
        setTotalSavings(totalDiscountAmount);
        setLoyaltyPoints(computedPoints);
        setTierStatus(calculateTierStatus(computedPoints));
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    } finally {
      setOrdersLoading(false);
      setReservationsLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Only update displayName if phone verification is not in progress
      const updateData: any = {
        displayName: editForm.displayName
      };

      // Only include phoneNumber if we're not in verification mode
      if (!isVerifyingPhone) {
        updateData.phoneNumber = editForm.phoneNumber;
      }

      const result = await updateUserProfile(user.uid, updateData);

      if (result.success) {
        setIsEditing(false);
        // Refresh user profile data
        window.location.reload();
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (name === 'phoneNumber' && otpError) {
      setOtpError('');
    }
  };

  // Generate a random 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send OTP to WhatsApp using the notification service
  const sendOTPToWhatsApp = async (phoneNumber: string, otp: string) => {
    try {
      const result = await sendNotification(
        'PHONE_VERIFICATION_OTP',
        phoneNumber,
        {
          name: userProfile?.displayName || 'User',
          otp: otp
        }
      );

      return result.status || result.success;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };

  // Handle phone number update with OTP verification
  const handlePhoneNumberUpdate = async () => {
    if (!user || !editForm.phoneNumber.trim()) return;

    try {
      setOtpLoading(true);
      setOtpError('');

      // Add 91 prefix if not present
      const formattedPhone = editForm.phoneNumber.startsWith('91')
        ? editForm.phoneNumber
        : `91${editForm.phoneNumber}`;

      // Check if phone number already exists in database
      const phoneCheckResult = await checkPhoneNumberExists(formattedPhone);

      if (!phoneCheckResult.success) {
        setOtpError('Error checking phone number. Please try again.');
        return;
      }

      if (phoneCheckResult.exists) {
        setOtpError('This phone number is already registered with another account.');
        return;
      }

      // Set the new phone number for verification
      setNewPhoneNumber(formattedPhone);

      // Generate OTP
      const otp = generateOTP();

      // Store OTP in Firestore
      const storeResult = await storeOTPInFirestore(formattedPhone, otp);

      if (!storeResult.success) {
        setOtpError('Failed to generate verification code. Please try again.');
        return;
      }

      // Send OTP via WhatsApp
      const sent = await sendOTPToWhatsApp(formattedPhone, otp);

      if (sent) {
        setOtpSent(true);
        setIsVerifyingPhone(true);
      } else {
        setOtpError('Failed to send verification code. Please check your phone number.');
      }
    } catch (error) {
      console.error('Error updating phone number:', error);
      setOtpError('An error occurred. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and complete phone number update
  const verifyOTPAndUpdatePhone = async () => {
    if (!user || !otpCode.trim()) return;

    try {
      setOtpLoading(true);
      setOtpError('');

      const verifyResult = await verifyOTPFromFirestore(newPhoneNumber, otpCode);
      if (verifyResult.success) {
        // Update user profile with new phone number
        const updateResult = await updateUserProfile(user.uid, {
          phoneNumber: newPhoneNumber
        });

        if (updateResult.success) {
          // Send welcome message after successful verification
          try {
            await sendNotification(
              'WELCOME_LOGIN',
              newPhoneNumber,
              {
                name: userProfile?.displayName || user.displayName || 'User'
              }
            );
          } catch (welcomeError) {
            console.error('Error sending welcome message:', welcomeError);
            // Continue even if welcome message fails
          }

          setIsVerifyingPhone(false);
          setOtpSent(false);
          setOtpCode('');
          setNewPhoneNumber('');
          setIsEditing(false);
          // Refresh user profile data
          setUser({ ...user, phoneNumber: newPhoneNumber });
          router.refresh();
        } else {
          setOtpError('Failed to update phone number. Please try again.');
        }
      } else {
        setOtpError(verifyResult.error || 'Invalid verification code.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setOtpError('An error occurred during verification. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Cancel phone verification
  const cancelPhoneVerification = () => {
    setIsVerifyingPhone(false);
    setOtpSent(false);
    setOtpCode('');
    setOtpError('');
    setNewPhoneNumber('');
    setEditForm(prev => ({
      ...prev,
      phoneNumber: userProfile?.phoneNumber || user?.phoneNumber || ''
    }));
  };

  const handleSignOut = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await signOut();
      // Redirect to login page
      window.location.href = '/user/login';
    } catch (error) {
      alert('Error signing out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show login prompt for guest users
  if (!user && !loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Please Login</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be logged in to view your profile and order history.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/user/login"
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Login
              </a>
              <a
                href="/user/register"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.displayName || user?.displayName || 'Guest';
  const userInitial = displayName.charAt(0).toUpperCase();
  const tierStyles = TIER_STYLE_MAP[tierStatus.current.name] || TIER_STYLE_MAP.Bronze;
  const progressWidth = `${Math.min(Math.max(tierStatus.progress, 0), 1) * 100}%`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">My Account</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Active Member</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{loyaltyPoints} Points</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Info</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</label>
                    <input
                      type="text"
                      name="displayName"
                      value={editForm.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</label>
                    {!isVerifyingPhone ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">91</span>
                          </div>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={editForm.phoneNumber}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter 10-digit phone number"
                          />
                        </div>
                        {otpError && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-red-800 dark:text-red-200">Error</span>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{otpError}</p>
                          </div>
                        )}
                        {editForm.phoneNumber !== (userProfile?.phoneNumber || user?.phoneNumber || '') && (
                          <button
                            onClick={handlePhoneNumberUpdate}
                            disabled={otpLoading || !editForm.phoneNumber.trim()}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            {otpLoading ? 'Sending OTP...' : 'Verify Phone Number'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Verification Code Sent</span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            We've sent a 6-digit verification code to <strong>{newPhoneNumber}</strong> via WhatsApp.
                          </p>
                        </div>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono tracking-widest"
                        />
                        {otpError && (
                          <p className="text-sm text-red-600 dark:text-red-400">{otpError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={verifyOTPAndUpdatePhone}
                            disabled={otpLoading || otpCode.length !== 6}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            {otpLoading ? 'Verifying...' : 'Verify & Update'}
                          </button>
                          <button
                            onClick={cancelPhoneVerification}
                            disabled={otpLoading}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleEditProfile}
                    disabled={isLoading || isVerifyingPhone}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      if (isVerifyingPhone) {
                        cancelPhoneVerification();
                      } else {
                        setIsEditing(false);
                      }
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {userProfile?.displayName}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {userProfile?.phoneNumber || user?.phoneNumber || 'Not set'}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {userProfile?.email || user?.email || 'Not set'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Saved Addresses Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saved Addresses</h2>
              <button className="px-4 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                Add New
              </button>
            </div>

            <div className="space-y-3">
              {savedAddresses.map((address) => (
                <div key={address.id} className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${address.type === 'Home'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                      <svg className={`w-5 h-5 ${address.type === 'Home'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-purple-600 dark:text-purple-400'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {address.type === 'Home' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{address.type}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{address.address}</p>
                      {address.isDefault && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order History Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                View All
              </button>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading orders...</span>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-xl mb-3 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                      <Image
                        src={order.items[0]?.image || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop&crop=center'}
                        alt={order.items[0]?.name || 'Order item'}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <div className="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <p className="text-xs font-semibold">Reorder</p>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            order.status === 'pending' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {order.items.length > 1 ? `${order.items[0].name} +${order.items.length - 1} more` : order.items[0].name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatFirebaseTimestamp(order.createdAt)}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      ₹{order.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Start ordering to see your order history here</p>
                <a
                  href="/user/menu"
                  className="inline-block px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Browse Menu
                </a>
              </div>
            )}
          </div>

          {/* Reservations Section */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Reservations</h2>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                View All
              </button>
            </div>

            {reservationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading reservations...</span>
              </div>
            ) : recentReservations.length > 0 ? (
              <div className="space-y-4">
                {recentReservations.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {reservation.reservationDetails.date} at {reservation.reservationDetails.time}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {reservation.reservationDetails.guests} guest{reservation.reservationDetails.guests !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Confirmation: {reservation.reservationId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          reservation.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                        {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatFirebaseTimestamp(reservation.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reservations Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Make a reservation to see your booking history here</p>
                <a
                  href="/user/reservation"
                  className="inline-block px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Make Reservation
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Loyalty & Rewards */}
          <div
            className={
              `relative overflow-hidden rounded-3xl border ${tierStyles.accentBorder} bg-gradient-to-br ${tierStyles.gradient} p-6 text-white shadow-lg transition hover:shadow-xl`
            }
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 12% 20%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 85% 0%, rgba(255,255,255,0.18), transparent 55%)'
              }}
            />
            <div className="relative z-10 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl font-semibold uppercase">
                    {userInitial}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold leading-tight">{displayName}</h3>
                    <button
                      type="button"
                      onClick={() => router.push('/user/orders')}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white"
                    >
                      View activity
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs font-semibold">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 uppercase tracking-wide ${tierStyles.badgeBg} ${tierStyles.badgeText}`}>
                    <Crown className="h-4 w-4" />
                    {tierStatus.current.name} member
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push('/user/orders')}
                    className={`group inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition ${tierStyles.pillBg} ${tierStyles.pillText}`}
                  >
                    saved ₹{Math.max(Math.round(totalSavings), 0)}
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[max-content_1fr] items-center gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Points</p>
                  <p className="text-4xl font-bold leading-tight">{loyaltyPoints}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-white/70">
                    <span>
                      {tierStatus.next ? `Next: ${tierStatus.next.name}` : 'Top tier achieved'}
                    </span>
                    <span>
                      {tierStatus.next ? `${tierStatus.pointsToNext} pts to unlock` : 'Enjoy premium rewards'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tierStyles.progressFill}`}
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-white/70">
                <span>Total saved: ₹{totalSavings.toFixed(2)}</span>
                <span>Total spent: ₹{totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-300 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-4 h-4 text-white dark:text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Apple Pay</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">UPI</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Cards</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Preferences</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Vegetarian</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vegetarianMode}
                    onChange={(e) => setVegetarianMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.828 2.828L5.828 12l2.828 2.828L6.828 17H2l4.828-4.828L2 7h4.828zM9 3h6l-3 3 3 3H9V3z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Allergies</span>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>

            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 group text-left">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">Favorites</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-600/50 transition-all duration-200 group text-left">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white text-sm">Help & Support</span>
              </button>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="cursor-pointer w-full flex items-center gap-3 p-3 bg-red-50/80 dark:bg-red-900/20 rounded-xl hover:bg-red-100/80 dark:hover:bg-red-900/30 transition-all duration-200 group text-left text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="font-medium text-sm">
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}