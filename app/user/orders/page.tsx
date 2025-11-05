'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getRestaurantSettings, getUserOrders, getRestaurantOrders, subscribeToUserOrders, subscribeToGuestOrders } from '@/app/(utils)/firebaseOperations';
import { useAuth } from '@/app/(contexts)/AuthContext';

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
    email: string;
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
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const activeOrders = orders.filter(order =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
  );

  const completedOrders = orders.filter(order =>
    ['delivered', 'cancelled'].includes(order.status)
  );

  const currentOrders = activeTab === 'active' ? activeOrders : completedOrders;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                        Est. {order.adminEstimatedTime || 20} min
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
                    <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      <span>Pending</span>
                      <span>Confirmed</span>
                      <span>Preparing</span>
                      <span>Ready</span>
                      <span>Delivered</span>
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
                    <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
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
                  <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
                    View Details
                  </button>
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">
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
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
  );
}