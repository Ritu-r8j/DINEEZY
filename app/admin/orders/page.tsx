'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, Eye, Phone, MapPin, DollarSign, Search, RefreshCw, X, ChefHat, Package, Loader2 } from 'lucide-react';
import { getRestaurantOrders, updateOrderStatus, updateOrderEstimatedTime, OrderData, subscribeToRestaurantOrders } from '@/app/(utils)/firebaseOperations';
import { useAuth } from '@/app/(contexts)/AuthContext';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  specialInstructions?: string;
}

interface Order extends Omit<OrderData, 'estimatedTime'> {
  // Additional fields for display
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount?: number;
  orderTime?: Date;
  estimatedTime?: number; // Override as number for display
  adminEstimatedTime?: number; // Admin-set estimated time
  paymentMethod: string;
  orderType: string;
  specialNotes?: string;
}



export default function OrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedOrderForTime, setSelectedOrderForTime] = useState<Order | null>(null);
  const [customEstimatedTime, setCustomEstimatedTime] = useState<number>(20);

  // Load orders with real-time listeners
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealTimeListener = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const restaurantId = user.uid; // This should be the restaurant ID
        
        // Set up real-time listener for restaurant orders
        unsubscribe = subscribeToRestaurantOrders(restaurantId, (orders) => {
          if (orders.length > 0) {
            // Transform database orders to display format
            const transformedOrders: Order[] = orders.map(order => ({
              ...order,
              customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
              customerPhone: order.customerInfo.phone,
              customerAddress: order.customerInfo.address,
              totalAmount: order.total,
              orderTime: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(),
              estimatedTime: 20, // Default 20 minutes
              adminEstimatedTime: order.adminEstimatedTime,
              paymentMethod: order.paymentMethod,
              orderType: order.orderType,
              specialNotes: order.specialInstructions
            }));
            
            setOrders(transformedOrders);
          } else {
            setOrders([]);
          }
          setIsLoading(false);
        });
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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressWidth = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '0%';
      case 'confirmed': return '25%';
      case 'preparing': return '50%';
      case 'ready': return '75%';
      case 'delivered': return '100%';
      default: return '0%';
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setIsUpdating(orderId);
      
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        // Update local state
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, estimatedTime: newStatus === 'confirmed' ? 20 : order.estimatedTime }
            : order
        ));
      } else {
        setError(result.error || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSetEstimatedTime = async (orderId: string, estimatedTime: number) => {
    try {
      setIsUpdating(orderId);
      
      const result = await updateOrderEstimatedTime(orderId, estimatedTime);
      
      if (result.success) {
        // Update local state
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, adminEstimatedTime: estimatedTime }
            : order
        ));
        setShowTimeModal(false);
        setSelectedOrderForTime(null);
      } else {
        setError(result.error || 'Failed to update estimated time');
      }
    } catch (err) {
      console.error('Error updating estimated time:', err);
      setError('Failed to update estimated time');
    } finally {
      setIsUpdating(null);
    }
  };

  const openTimeModal = (order: Order) => {
    setSelectedOrderForTime(order);
    setCustomEstimatedTime(order.adminEstimatedTime || 20);
    setShowTimeModal(true);
  };


  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());

    switch (activeTab) {
      case 'pending': return matchesSearch && order.status === 'pending';
      case 'active': return matchesSearch && ['confirmed', 'preparing', 'ready'].includes(order.status);
      case 'completed': return matchesSearch && ['delivered', 'cancelled'].includes(order.status);
      default: return matchesSearch;
    }
  });

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-2 py-1 rounded-full animate-pulse">
                  {orders.filter(o => o.status === 'pending').length} New
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {/* Compact Search and Tabs */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex space-x-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 shadow-sm">
            {[
              { key: 'all', label: 'All', count: orders.length },
              { key: 'pending', label: 'New', count: orders.filter(o => o.status === 'pending').length },
              { key: 'active', label: 'Active', count: orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length },
              { key: 'completed', label: 'Done', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/70 dark:hover:bg-gray-700/70'
                  }`}
              >
                {tab.label} {tab.count > 0 && <span className="ml-1">({tab.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Compact Orders Grid */}
        <div className="grid gap-3 sm:gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Main Order Info */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{order.customerName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Order Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {order.orderTime ? getTimeAgo(order.orderTime) : 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.orderType}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                      <DollarSign className="h-3 w-3" />
                      ₹{order.totalAmount?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-gray-400">#{order.id}</span>
                  </div>

                  {/* Items Preview */}
                  <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1 whitespace-nowrap">
                        <img src={item.image} alt={item.name} className="w-6 h-6 rounded object-cover" />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {item.quantity}x {item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">+{order.items.length - 3} more</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>New</span>
                      <span>Cooking</span>
                      <span>Ready</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: getProgressWidth(order.status) }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 text-sm font-medium transition-all shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 text-sm font-medium transition-all shadow-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <ChefHat className="h-3 w-3" />
                        Start Cooking
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <Package className="h-3 w-3" />
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-lg hover:from-gray-600 hover:to-slate-600 text-sm font-medium transition-all shadow-sm"
                      >
                        Complete
                      </button>
                    )}
                    <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-all flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Call
                    </button>
                  </div>
                </div>

                {/* Timer Sidebar */}
                <div className="sm:w-20 bg-gradient-to-br max-h-fit from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {order.adminEstimatedTime || 20}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {order.adminEstimatedTime ? 'min (set)' : 'min (default)'}
                  </div>
                  <button
                    onClick={() => openTimeModal(order)}
                    className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Set Time
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">No orders found matching your criteria.</div>
          </div>
        )}
      </div>

      {/* Enhanced Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order #{selectedOrder.id}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.orderTime ? getTimeAgo(selectedOrder.orderTime) : 'Unknown'}</p>
              </div>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="p-4 space-y-4">
                {/* Customer Info Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Customer Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedOrder.orderType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedOrder.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Items ({selectedOrder.items.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white/70 dark:bg-gray-700/70 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="font-semibold text-green-600 dark:text-green-400">₹{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Special Notes */}
                {selectedOrder.specialNotes && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-700/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Special Instructions
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.specialNotes}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4" />
                    Call Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Estimated Time Modal */}
      {showTimeModal && selectedOrderForTime && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl max-w-md w-full shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Set Estimated Time</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Order #{selectedOrderForTime.id}</p>
              </div>
              <button
                onClick={() => setShowTimeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Current Time Display */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Current Time</h3>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedOrderForTime.adminEstimatedTime || 20} minutes
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedOrderForTime.adminEstimatedTime ? 'Admin set' : 'Default (20 min)'}
                </div>
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Set New Estimated Time (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={customEstimatedTime}
                    onChange={(e) => setCustomEstimatedTime(parseInt(e.target.value) || 20)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will override the default 20-minute preparation time.
                </p>
              </div>

              {/* Quick Time Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Set
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[15, 20, 25, 30, 45, 60].map((time) => (
                    <button
                      key={time}
                      onClick={() => setCustomEstimatedTime(time)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        customEstimatedTime === time
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {time}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSetEstimatedTime(selectedOrderForTime.id, customEstimatedTime)}
                  disabled={isUpdating === selectedOrderForTime.id}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-indigo-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating === selectedOrderForTime.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Set Time'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}