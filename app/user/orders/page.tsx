'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2, X, MapPin, Clock, CreditCard, FileText, Package } from 'lucide-react';
import { getRestaurantSettings, subscribeToUserOrders, subscribeToGuestOrders, updateOrderStatus } from '@/app/(utils)/firebaseOperations';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { sendWaiterCallRequest } from '@/app/(utils)/notification';
import { toast, Toaster } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  selectedVariant?: any;
  selectedAddons?: any[];
  customPrice?: number;
}

interface Order {
  id: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
  };
  items: OrderItem[];
  orderType: string;
  deliveryOption?: any;
  paymentMethod: string;
  specialInstructions: string;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  estimatedTime: string;
  adminEstimatedTime?: number; // Admin-set estimated time
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: any; // Firebase timestamp or string
  restaurantId: string;
  reservationId?: string; // Link to reservation for pre-orders
  restaurant?: {
    name: string;
    address?: {
      city: string;
      state: string;
    };
  };
}


const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
};

const getProgressWidth = (status: string) => {
  switch (status) {
    case 'pending': return 'w-0';
    case 'confirmed': return 'w-1/4';
    case 'preparing': return 'w-2/4';
    case 'ready': return 'w-3/4';
    case 'delivered': return 'w-full';
    default: return 'w-0';
  }
};

// Helper function to format Firebase timestamp
const formatFirebaseTimestamp = (timestamp: any): Date => {
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

    // Check if date is valid, if not return current date
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp provided, using current date');
      return new Date();
    }

    return date;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return new Date(); // Fallback to current date
  }
};

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Memoized helper function to calculate remaining time
  const calculateRemainingTime = useCallback((order: Order): string => {
    try {
      // If order is still pending, show waiting message
      if (order.status === 'pending') {
        return 'Waiting for confirmation';
      }
      
      // If order is ready or delivered, show status
      if (order.status === 'ready') {
        return 'Ready now';
      }
      
      if (order.status === 'delivered') {
        return 'Completed';
      }
      
      // For confirmed/preparing orders, calculate time from order creation
      // In a real app, you'd want to track when the order was confirmed (confirmedAt timestamp)
      // For now, we'll use createdAt but the timer effectively starts when status changes from pending
      const orderDate = formatFirebaseTimestamp(order.createdAt);
      const estimatedMinutes = order.adminEstimatedTime || 20;
      const elapsedMinutes = Math.floor((currentTime.getTime() - orderDate.getTime()) / (60 * 1000));
      
      // Calculate remaining time based on elapsed time
      const remainingMinutes = estimatedMinutes - elapsedMinutes;
      
      // If time has passed but order is still in progress
      if (remainingMinutes <= 0) {
        return 'Ready soon';
      }
      
      // Show remaining time
      if (remainingMinutes < 1) {
        return 'Less than 1 min';
      } else if (remainingMinutes === 1) {
        return '1 min';
      } else {
        return `${remainingMinutes} min`;
      }
    } catch (error) {
      console.error('Error calculating remaining time:', error);
      return `${order.adminEstimatedTime || 20} min`;
    }
  }, [currentTime]); // Only recreate when currentTime changes

  // Auto-update order status based on time progression
  useEffect(() => {
    const autoProgressOrders = async () => {
      const now = new Date();

      for (const order of orders) {
        const orderDate = formatFirebaseTimestamp(order.createdAt);
        const minutesSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (60 * 1000));
        const estimatedTime = order.adminEstimatedTime || 20;

        try {
          // Auto-cancel pending orders older than 30 minutes
          if (order.status === 'pending' && minutesSinceOrder >= 30) {
            console.log(`Auto-cancelling expired order: ${order.id}`);
            const result = await updateOrderStatus(order.id, 'cancelled');
            
            if (result.success) {
              toast.error('Order automatically cancelled', {
                description: `Order ${order.id} was cancelled due to no restaurant confirmation within 30 minutes.`,
              });
            }
            continue;
          }

          // Auto-progress confirmed orders to preparing after 2 minutes
          if (order.status === 'confirmed' && minutesSinceOrder >= 2) {
            console.log(`Auto-progressing order ${order.id} to preparing`);
            await updateOrderStatus(order.id, 'preparing');
            toast.success('Order is now being prepared!', {
              description: 'Your food is being cooked.',
            });
            continue;
          }

          // Auto-progress preparing orders to ready based on estimated time (75% of estimated time)
          const preparingThreshold = Math.floor(estimatedTime * 0.75);
          if (order.status === 'preparing' && minutesSinceOrder >= preparingThreshold) {
            console.log(`Auto-progressing order ${order.id} to ready`);
            await updateOrderStatus(order.id, 'ready');
            toast.success('Order is ready!', {
              description: order.orderType === 'dine-in' 
                ? 'Your food is ready to be served.' 
                : 'Your order is ready for pickup.',
            });
            continue;
          }

          // Auto-progress ready orders to delivered after estimated time + 5 minutes
          if (order.status === 'ready' && minutesSinceOrder >= (estimatedTime + 5)) {
            console.log(`Auto-progressing order ${order.id} to delivered`);
            await updateOrderStatus(order.id, 'delivered');
            toast.success('Order completed!', {
              description: 'Thank you for your order.',
            });
            continue;
          }
        } catch (error) {
          console.error(`Error auto-progressing order ${order.id}:`, error);
        }
      }
    };

    // Check immediately and then every minute
    if (orders.length > 0) {
      autoProgressOrders();
      
      const interval = setInterval(autoProgressOrders, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [orders]);

  // Load orders with real-time listeners
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealTimeListener = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (user) {
          // Logged in user - listen to their orders
          unsubscribe = subscribeToUserOrders(user.uid, async (orders) => {
            if (orders.length > 0) {
              // Fetch restaurant information for each order
              const ordersWithRestaurantInfo = await Promise.all(
                orders.map(async (order) => {
                  try {
                    const restaurantResult = await getRestaurantSettings(order.restaurantId);
                    if (restaurantResult.success && restaurantResult.data) {
                      return {
                        ...order,
                        restaurant: {
                          name: restaurantResult.data.name,
                          address: restaurantResult.data.address
                        }
                      };
                    }
                    return order;
                  } catch (err) {
                    console.error('Error fetching restaurant info:', err);
                    return order;
                  }
                })
              );

              setOrders(ordersWithRestaurantInfo);

              // Also update localStorage for backup
              localStorage.setItem('orders', JSON.stringify(ordersWithRestaurantInfo));
            } else {
              setOrders([]);
            }
            setIsLoading(false);
          });
        } else {
          // Guest user - listen to guest orders for their restaurant
          const restaurantId = localStorage.getItem('restaurantId');
          const guestSessionId = localStorage.getItem('guestSessionId');
          if (restaurantId && guestSessionId) {
            unsubscribe = subscribeToGuestOrders(restaurantId, guestSessionId, async (orders) => {
              if (orders.length > 0) {
                // Fetch restaurant information for each order
                const ordersWithRestaurantInfo = await Promise.all(
                  orders.map(async (order) => {
                    try {
                      const restaurantResult = await getRestaurantSettings(order.restaurantId);
                      if (restaurantResult.success && restaurantResult.data) {
                        return {
                          ...order,
                          restaurant: {
                            name: restaurantResult.data.name,
                            address: restaurantResult.data.address
                          }
                        };
                      }
                      return order;
                    } catch (err) {
                      console.error('Error fetching restaurant info:', err);
                      return order;
                    }
                  })
                );

                setOrders(ordersWithRestaurantInfo);

                // Also update localStorage for backup
                localStorage.setItem('orders', JSON.stringify(ordersWithRestaurantInfo));
              } else {
                setOrders([]);
              }
              setIsLoading(false);
            });
          } else {
            // No restaurant ID, load from localStorage only
            const savedOrders = localStorage.getItem('orders');
            if (savedOrders) {
              const parsedOrders: Order[] = JSON.parse(savedOrders);
              setOrders(parsedOrders);
            }
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        setError('Failed to load orders');
        setIsLoading(false);
      }
    };

    setupRealTimeListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Memoize filtered orders to avoid recalculation on every render
  const { standaloneOrders, activeOrders, completedOrders } = useMemo(() => {
    // Filter out orders that are linked to reservations (pre-orders)
    const standalone = orders.filter(order => !order.reservationId);

    const active = standalone.filter(order =>
      ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
    );

    const completed = standalone.filter(order =>
      ['delivered', 'cancelled'].includes(order.status)
    );

    return { standaloneOrders: standalone, activeOrders: active, completedOrders: completed };
  }, [orders]);

  const currentOrders = activeTab === 'active' ? activeOrders : completedOrders;

  // Handle order cancellation - memoized to prevent recreation
  const handleCancelOrder = useCallback((order: Order) => {
    setOrderToCancel(order);
    setShowCancelConfirm(true);
  }, []);

  const confirmCancelOrder = useCallback(async () => {
    if (!orderToCancel) return;

    try {
      setCancellingOrderId(orderToCancel.id);
      const result = await updateOrderStatus(orderToCancel.id, 'cancelled');
      
      if (result.success) {
        setShowCancelConfirm(false);
        setOrderToCancel(null);
        toast.success('Order cancelled successfully', {
          description: 'Your order has been cancelled and will be processed accordingly.',
        });
      } else {
        toast.error('Failed to cancel order', {
          description: result.error || 'Please try again or contact support.',
        });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setCancellingOrderId(null);
    }
  }, [orderToCancel]);

  // Handle mark as received - memoized
  const handleMarkAsReceived = useCallback(async (orderId: string) => {
    try {
      const result = await updateOrderStatus(orderId, 'delivered');
      
      if (result.success) {
        toast.success('Order marked as received!', {
          description: 'Thank you for confirming your order delivery.',
        });
      } else {
        toast.error('Failed to update order status', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (error) {
      console.error('Error marking order as received:', error);
      toast.error('Failed to update order status', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  }, []);

  // Handle request bill - memoized
  const handleRequestBill = useCallback(async (order: Order) => {
    try {
      // Get restaurant owner phone number
      const restaurantResult = await getRestaurantSettings(order.restaurantId);
      
      if (restaurantResult.success && restaurantResult.data?.phone) {
        // Send notification to restaurant owner for bill request
        await sendWaiterCallRequest(
          restaurantResult.data.phone,
          `BILL-${order.id}`, // Prefix with BILL to indicate bill request
          `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
          order.customerInfo.phone,
          undefined // tableNumber - can be added if available
        );
        
        toast.success('Bill requested successfully!', {
          description: 'The restaurant has been notified and will bring your bill shortly.',
        });
      } else {
        toast.error('Unable to contact restaurant', {
          description: 'Please try again or ask the waiter directly.',
        });
      }
    } catch (error) {
      console.error('Error requesting bill:', error);
      toast.error('Failed to request bill', {
        description: 'An unexpected error occurred. Please try again.',
      });
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 dark:text-white mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Orders</h2>
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
      <Toaster position="bottom-right" closeButton />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">My Orders</h2>
        <p className="text-base font-light text-gray-600 dark:text-gray-400 mt-1">
          Track your orders and view order history
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'completed'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            Order History ({completedOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {currentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeTab === 'active' ? 'No active orders' : 'No order history'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'active'
                ? 'When you place an order, it will appear here'
                : 'Your completed orders will appear here'
              }
            </p>
          </div>
        ) : (
          currentOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg dark:hover:border-primary/20 overflow-hidden">
              {/* Order Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {order.id}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.restaurant?.name || 'Restaurant'} • {formatFirebaseTimestamp(order.createdAt).toLocaleDateString()} at {formatFirebaseTimestamp(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {order.customerInfo.address && order.orderType === 'delivery' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        📍 {order.customerInfo.address}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)} • {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{order.total.toFixed(2)}
                    </p>
                    {order.status === 'pending' && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                        Waiting for restaurant confirmation
                      </p>
                    )}
                    {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready') && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Est. {calculateRemainingTime(order)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <img
                        src={item.image || '/placeholder-food.jpg'}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.quantity}x {item.name}
                          {item.selectedVariant && (
                            <span className="text-sm text-gray-500 ml-1">({item.selectedVariant.name})</span>
                          )}
                        </h4>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <p className="text-xs text-gray-500">
                            + {item.selectedAddons.map(addon => addon.name).join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₹{(item.customPrice || item.price).toFixed(2)} each
                        </p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₹{((item.customPrice || item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Special Instructions:</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.specialInstructions}</p>
                  </div>
                )}

                {/* Progress Bar for Active Orders */}
                {activeTab === 'active' && order.status !== 'cancelled' && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-medium mb-2">
                      <span className={order.status === 'pending' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                        Pending
                      </span>
                      <span className={order.status === 'confirmed' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                        Confirmed
                      </span>
                      <span className={order.status === 'preparing' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                        Preparing
                      </span>
                      <span className={order.status === 'ready' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                        Ready
                      </span>
                      <span className={order.status === 'delivered' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                        Delivered
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className={`absolute top-0 left-0 h-2 bg-gray-900 dark:bg-white rounded-full transition-all duration-500 ${getProgressWidth(order.status)}`}></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {order.status === 'ready' && (
                    <button 
                      onClick={() => handleMarkAsReceived(order.id)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark as Received
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => {
                        // Store current order items in cart for reorder
                        const reorderItems = order.items.map(item => ({
                          ...item,
                          quantity: item.quantity
                        }));
                        localStorage.setItem('cartItems', JSON.stringify(reorderItems));
                        localStorage.setItem('cartCount', order.items.reduce((sum, item) => sum + item.quantity, 0).toString());
                        localStorage.setItem('restaurantId', order.restaurantId);
                        window.location.href = `/user/menu/${order.restaurantId}`;
                      }}
                      className="px-6 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                      Reorder
                    </button>
                  )}
                  {activeTab === 'active' && order.status === 'pending' && (
                    <button
                      onClick={() => handleCancelOrder(order)}
                      disabled={cancellingOrderId === order.id}
                      className="cursor-pointer px-6 py-2 border border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {cancellingOrderId === order.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Cancel Order
                        </>
                      )}
                    </button>
                  )}
                  {activeTab === 'active' && order.orderType === 'dine-in' && (order.status === 'ready' || order.status === 'confirmed' || order.status === 'preparing') && (
                    <button
                      onClick={() => handleRequestBill(order)}
                      className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Request Bill
                    </button>
                  )}
                  {activeTab === 'active' && (
                    <button
                      onClick={async () => {
                        try {
                          // Get restaurant owner phone number
                          const restaurantResult = await getRestaurantSettings(order.restaurantId);
                          
                          if (restaurantResult.success && restaurantResult.data?.phone) {
                            // Send notification to restaurant owner
                            await sendWaiterCallRequest(
                              restaurantResult.data.phone,
                              order.id,
                              `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
                              order.customerInfo.phone,
                              undefined // tableNumber - can be added if available
                            );
                            
                            toast.success('Waiter called successfully!', {
                              description: 'The restaurant has been notified and will assist you shortly.',
                            });
                          } else {
                            toast.error('Unable to contact restaurant', {
                              description: 'Please try again or call the restaurant directly.',
                            });
                          }
                        } catch (error) {
                          console.error('Error calling waiter:', error);
                          toast.error('Failed to call waiter', {
                            description: 'An unexpected error occurred. Please try again.',
                          });
                        }
                      }}
                      className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21L6.16 11.37a11.045 11.045 0 005.516 5.516l1.983-4.064a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Waiter
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowModal(true);
                    }}
                    className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <button className="cursor-pointer px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                      Leave Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {currentOrders.length > 0 && (
        <div className="mt-12 rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg dark:hover:border-primary/20 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => {
                const lastOrder = orders[0]; // Get the most recent order
                if (lastOrder?.restaurantId) {
                  window.location.href = `/user/menu/${lastOrder.restaurantId}`;
                }
              }}
              className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900 dark:text-white">Browse Menu</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Discover new dishes</p>
            </button>
            <button className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <h4 className="font-medium text-gray-900 dark:text-white">Track Order</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Real-time updates</p>
            </button>
          </div>
        </div>
      )}
    </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-zinc-900 dark:to-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Order ID: {selectedOrder.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[selectedOrder.status]}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content - Left Side */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Progress Bar */}
                    {selectedOrder.status !== 'cancelled' && (
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Order Status
                        </h3>
                        <div className="flex items-center justify-between text-xs font-medium mb-2">
                          <span className={selectedOrder.status === 'pending' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                            Pending
                          </span>
                          <span className={selectedOrder.status === 'confirmed' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                            Confirmed
                          </span>
                          <span className={selectedOrder.status === 'preparing' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                            Preparing
                          </span>
                          <span className={selectedOrder.status === 'ready' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                            Ready
                          </span>
                          <span className={selectedOrder.status === 'delivered' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'}>
                            Delivered
                          </span>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className={`absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500 ${getProgressWidth(selectedOrder.status)}`}></div>
                        </div>
                        {selectedOrder.status !== 'delivered' && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Estimated time: {calculateRemainingTime(selectedOrder)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Order Items</h3>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                            <img
                              src={item.image || '/placeholder-food.jpg'}
                              alt={item.name}
                              className="w-20 h-20 rounded-lg object-cover shadow-md"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white mb-1 truncate">
                                {item.name}
                              </h4>
                              {item.selectedVariant && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  <span className="font-medium">Variant:</span> {item.selectedVariant.name}
                                </p>
                              )}
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  <span className="font-medium">Add-ons:</span> {item.selectedAddons.map(addon => addon.name).join(', ')}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                ₹{(item.customPrice || item.price).toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                              ₹{((item.customPrice || item.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {selectedOrder.specialInstructions && (
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Special Instructions
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{selectedOrder.specialInstructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar - Right Side */}
                  <div className="space-y-6">
                    {/* Restaurant Info */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Restaurant</h3>
                      <p className="font-medium text-gray-900 dark:text-white mb-2">{selectedOrder.restaurant?.name || 'Restaurant'}</p>
                      {selectedOrder.restaurant?.address && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedOrder.restaurant.address.city}, {selectedOrder.restaurant.address.state}
                        </p>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Customer Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white text-sm break-all">{selectedOrder.customerInfo.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerInfo.phone}</p>
                        </div>
                        {selectedOrder.customerInfo.address && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Delivery Address
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{selectedOrder.customerInfo.address}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Order Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order Time</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {formatFirebaseTimestamp(selectedOrder.createdAt).toLocaleDateString()} at {formatFirebaseTimestamp(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Method</p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {selectedOrder.paymentMethod.charAt(0).toUpperCase() + selectedOrder.paymentMethod.slice(1)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order Type</p>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {selectedOrder.orderType.charAt(0).toUpperCase() + selectedOrder.orderType.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Price Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Subtotal</span>
                          <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                        </div>
                        {selectedOrder.deliveryFee > 0 && (
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Delivery Fee</span>
                            <span>₹{selectedOrder.deliveryFee.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedOrder.tax > 0 && (
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Tax</span>
                            <span>₹{selectedOrder.tax.toFixed(2)}</span>
                          </div>
                        )}
                        {selectedOrder.discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                            <span>Discount</span>
                            <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
                          <div className="flex justify-between">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">₹{selectedOrder.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      {selectedOrder.status === 'pending' && (
                        <button
                          onClick={() => {
                            setShowModal(false);
                            handleCancelOrder(selectedOrder);
                          }}
                          disabled={cancellingOrderId === selectedOrder.id}
                          className="w-full px-6 py-3 border-2 border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {cancellingOrderId === selectedOrder.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Cancel Order
                            </>
                          )}
                        </button>
                      )}
                      {selectedOrder.status === 'delivered' && (
                        <button
                          onClick={() => {
                            const reorderItems = selectedOrder.items.map(item => ({
                              ...item,
                              quantity: item.quantity
                            }));
                            localStorage.setItem('cartItems', JSON.stringify(reorderItems));
                            localStorage.setItem('cartCount', selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0).toString());
                            localStorage.setItem('restaurantId', selectedOrder.restaurantId);
                            window.location.href = `/user/menu/${selectedOrder.restaurantId}`;
                          }}
                          className="w-full px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                        >
                          Reorder
                        </button>
                      )}
                      {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                        <button className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && orderToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowCancelConfirm(false);
              setOrderToCancel(null);
            }}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-sm bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-zinc-900 dark:to-slate-900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200 dark:border-red-800/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cancel Order?</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{orderToCancel.id}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure? This action cannot be undone.
                </p>
                
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">₹{orderToCancel.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Items</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{orderToCancel.items.length} items</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-3">
                  <div className="flex gap-2">
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      Refunds will be processed per our policy.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowCancelConfirm(false);
                      setOrderToCancel(null);
                    }}
                    disabled={cancellingOrderId === orderToCancel.id}
                    className="flex-1 px-4 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={confirmCancelOrder}
                    disabled={cancellingOrderId === orderToCancel.id}
                    className="flex-1 px-4 py-2.5 border-2 border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {cancellingOrderId === orderToCancel.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
  </div>
  );
}