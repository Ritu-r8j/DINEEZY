'use client';

import { useState, useEffect } from 'react';
import { 
  Instagram, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Receipt,
  Gift,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/app/(utils)/firebase';

interface CashbackClaim {
  id: string;
  userId: string;
  billId: string;
  instagramHandle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  restaurantId: string;
}

interface Order {
  id: string;
  restaurantId: string;
  total: number;
  status: string;
  createdAt: any;
}

export default function UserCashbackPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<CashbackClaim[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile
  useEffect(() => {
    if (!user) return;

    const loadUserProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Load user's cashback claims and orders
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    // Listen to user's cashback claims
    const claimsRef = collection(db, 'cashback_claims');
    const claimsQuery = query(
      claimsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeClaims = onSnapshot(
      claimsQuery,
      (snapshot) => {
        const claimsData: CashbackClaim[] = [];
        snapshot.forEach((doc) => {
          claimsData.push({
            id: doc.id,
            ...doc.data()
          } as CashbackClaim);
        });
        setClaims(claimsData);
      },
      (err) => {
        console.error('Error loading cashback claims:', err);
        setError('Failed to load cashback claims');
      }
    );

    // Load user's delivered orders
    const loadOrders = async () => {
      try {
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(
          ordersRef,
          where('userId', '==', user.uid),
          where('status', '==', 'delivered'),
          orderBy('createdAt', 'desc')
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersData: Order[] = [];
        ordersSnapshot.forEach((doc) => {
          ordersData.push({
            id: doc.id,
            ...doc.data()
          } as Order);
        });
        setOrders(ordersData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Failed to load orders');
        setIsLoading(false);
      }
    };

    loadOrders();

    return () => unsubscribeClaims();
  }, [user]);

  // Handle claim submission
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedOrderId || !instagramHandle.trim()) {
      setSubmitError('Please fill in all fields');
      return;
    }

    // Check if claim already exists for this order
    const existingClaim = claims.find(claim => claim.billId === selectedOrderId);
    if (existingClaim) {
      setSubmitError('You have already submitted a claim for this order');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      const selectedOrder = orders.find(order => order.id === selectedOrderId);
      if (!selectedOrder) {
        setSubmitError('Selected order not found');
        return;
      }

      // Get user display name from profile
      const displayName = userProfile?.displayName || 
                         userProfile?.name || 
                         (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : '') ||
                         user.displayName || 
                         '';

      // Create cashback claim
      const claimsRef = collection(db, 'cashback_claims');
      await addDoc(claimsRef, {
        userId: user.uid,
        billId: selectedOrderId,
        instagramHandle: instagramHandle.trim(),
        status: 'pending',
        restaurantId: selectedOrder.restaurantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userName: displayName,
        userEmail: userProfile?.email || user.email || '',
        userPhone: userProfile?.phoneNumber || userProfile?.phone || user.phoneNumber || ''
      });

      // Reset form
      setSelectedOrderId('');
      setInstagramHandle('');
      setSubmitSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting claim:', err);
      setSubmitError('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status color
  const getStatusColor = (status: CashbackClaim['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    try {
      let date: Date;
      
      if (timestamp && typeof timestamp.toDate === 'function') {
        // Firebase Timestamp object
        date = timestamp.toDate();
      } else if (timestamp && timestamp.seconds) {
        // Firebase Timestamp-like object with seconds
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'string') {
        // String date
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
      } else {
        // Fallback to current date
        date = new Date();
      }

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Get eligible orders (delivered orders without claims)
  const eligibleOrders = orders.filter(order => 
    !claims.some(claim => claim.billId === order.id)
  );

  // Show login prompt for guest users
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Gift className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Please Login</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need to be logged in to submit cashback claims.
              </p>
              <a
                href="/user/phone-login"
                className="inline-block px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading cashback claims...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Claims</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">Cashback Claims</h1>
          <p className="text-base font-light text-gray-600 dark:text-gray-400">
            Tag us on Instagram and get cashback on your orders!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Submit Claim Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* How It Works */}
            <div className="rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">How It Works</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete your order and receive it
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Post a photo/story on Instagram and tag the restaurant
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Submit your claim with your Instagram handle and order ID
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Wait for restaurant approval and receive your cashback!
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Claim Form */}
            <div className="rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit New Claim</h2>
              </div>

              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Claim submitted successfully! We'll review it soon.
                    </p>
                  </div>
                </div>
              )}

              {eligibleOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Eligible Orders
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You need to have completed orders to submit cashback claims.
                  </p>
                  <a
                    href="/user/orders"
                    className="inline-block px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    View Orders
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmitClaim} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Order
                    </label>
                    <select
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose an order...</option>
                      {eligibleOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          Order #{order.id} - ₹{order.total.toFixed(2)} - {formatDate(order.createdAt)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instagram Handle
                    </label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="@yourusername"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter your Instagram handle (with or without @)
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          {submitError}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5" />
                        Submit Claim
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Claims History */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {claims.filter(c => c.status === 'pending').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {claims.filter(c => c.status === 'approved').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Claims</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {claims.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Claims */}
            <div className="rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Claims</h3>
              {claims.length === 0 ? (
                <div className="text-center py-6">
                  <Gift className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No claims yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {claims.slice(0, 5).map((claim) => (
                    <div
                      key={claim.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          #{claim.billId.substring(0, 8)}...
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Instagram className="h-3 w-3" />
                        <span>@{claim.instagramHandle.replace('@', '')}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(claim.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
