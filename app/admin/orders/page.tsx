'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, Eye, Phone, MapPin, DollarSign, Search, RefreshCw, X, ChefHat, Package, Loader2, CheckCircle, Calendar } from 'lucide-react';
import { getRestaurantOrders, updateOrderStatus, updateOrderEstimatedTime, updatePreOrderTime, OrderData, subscribeToRestaurantOrdersByDate } from '@/app/(utils)/firebaseOperations';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { sendNotification } from '@/app/(utils)/notification';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  customPrice?: number;
  image: string;
  specialInstructions?: string;
  selectedVariant?: {name: string, price: number};
  selectedAddons?: Array<{name: string, price: number}>;
}

interface Order extends Omit<OrderData, 'estimatedTime'> {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  totalAmount?: number;
  orderTime?: Date;
  estimatedTime?: number;
  adminEstimatedTime?: number;
  paymentMethod: string;
  orderType: string;
  specialNotes?: string;
  reservationId?: string; // Link to reservation for pre-orders
  preOrderTime?: string; // Selected time for pre-orders
  scheduledFor?: string; // Same as preOrderTime
}

export default function OrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [activeOrderTypeFilter, setActiveOrderTypeFilter] = useState<'all' | 'pre-order' | 'dine-in' | 'takeaway' | 'delivery'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedOrderForTime, setSelectedOrderForTime] = useState<Order | null>(null);
  const [customEstimatedTime, setCustomEstimatedTime] = useState<number>(20);

  // Date filtering state - default to today
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load orders with real-time listeners
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRealTimeListener = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const restaurantId = user.uid;

        unsubscribe = subscribeToRestaurantOrdersByDate(restaurantId, selectedDate, (orders) => {
          if (orders.length > 0) {
            const transformedOrders: Order[] = orders.map(order => ({
              ...order,
              customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
              customerPhone: order.customerInfo.phone,
              customerAddress: order.customerInfo.address,
              totalAmount: order.total,
              orderTime: order.createdAt?.toDate ? order.createdAt.toDate() : new Date(),
              estimatedTime: 20,
              adminEstimatedTime: order.adminEstimatedTime,
              paymentMethod: order.paymentMethod,
              orderType: order.orderType,
              specialNotes: order.specialInstructions,
              reservationId: order.reservationId,
              preOrderTime: order.preOrderTime,
              scheduledFor: order.scheduledFor
            }));

            // Filter out reservation pre-orders (orders with reservationId should only show in reservations page)
            const regularOrders = transformedOrders.filter(order => !order.reservationId);
            setOrders(regularOrders);
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

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, selectedDate]); // Re-fetch when date changes

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

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setIsUpdating(orderId);
      const result = await updateOrderStatus(orderId, newStatus);

      if (result.success) {
        const order = orders.find(o => o.id === orderId);
        setOrders(orders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, estimatedTime: newStatus === 'confirmed' ? 20 : order.estimatedTime }
            : order
        ));

        if (order && order.customerPhone) {
          try {
            switch (newStatus) {
              case 'confirmed':
                await sendNotification('ORDER_ACCEPTED', order.customerPhone, {
                  name: order.customerName || 'User',
                  orderId: orderId,
                  time: `${order.adminEstimatedTime || 20}`,
                  restaurant: 'Restaurant'
                });
                break;
              case 'preparing':
                await sendNotification('ORDER_PREPARING', order.customerPhone, {
                  name: order.customerName || 'User',
                  orderId: orderId,
                  time: `${order.adminEstimatedTime || 20}`
                });
                break;
              case 'ready':
                await sendNotification('ORDER_READY', order.customerPhone, {
                  name: order.customerName || 'User',
                  orderId: orderId
                });
                break;
              case 'delivered':
                await sendNotification('PAYMENT_SUCCESS', order.customerPhone, {
                  name: order.customerName || 'User',
                  orderId: orderId,
                  amount: order.totalAmount?.toFixed(2) || '0.00'
                });
                break;
              case 'cancelled':
                await sendNotification('ORDER_CANCELED', order.customerPhone, {
                  name: order.customerName || 'User',
                  orderId: orderId,
                  reason: 'Order cancelled by restaurant'
                });
                break;
            }
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        }
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
      
      // Find the order to check if it's a pre-order
      const order = orders.find(o => o.id === orderId);
      
      let result;
      let newScheduledTime = null;
      
      if (order && order.orderType === 'pre-order') {
        // For pre-orders, add the time to the original scheduled time
        result = await updatePreOrderTime(orderId, estimatedTime);
        if (result.success && 'newTime' in result) {
          newScheduledTime = result.newTime;
        }
      } else {
        // For regular orders, just update the estimated time
        result = await updateOrderEstimatedTime(orderId, estimatedTime);
      }

      if (result.success) {
        setOrders(orders.map(order =>
          order.id === orderId
            ? { 
                ...order, 
                adminEstimatedTime: estimatedTime,
                ...(newScheduledTime && {
                  preOrderTime: newScheduledTime,
                  scheduledFor: newScheduledTime
                })
              }
            : order
        ));

        if (order && order.customerInfo?.phone && ['confirmed', 'preparing'].includes(order.status)) {
          try {
            const notificationMessage = order.orderType === 'pre-order' && newScheduledTime
              ? `Your pre-order is now scheduled for ${newScheduledTime}`
              : `Your order will be ready in ${estimatedTime} minutes`;
              
            await sendNotification('ORDER_ACCEPTED', order.customerInfo.phone, {
              name: order.customerInfo.firstName || 'User',
              orderId: orderId,
              time: order.orderType === 'pre-order' && newScheduledTime ? newScheduledTime : `${estimatedTime}`,
              restaurant: 'Restaurant'
            });
          } catch (notificationError) {
            console.error('Error sending time update notification:', notificationError);
          }
        }

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

    const matchesOrderType = activeOrderTypeFilter === 'all' || order.orderType === activeOrderTypeFilter;

    const matchesStatus = (() => {
      switch (activeTab) {
        case 'pending': return order.status === 'pending';
        case 'active': return ['confirmed', 'preparing', 'ready'].includes(order.status);
        case 'completed': return ['delivered', 'cancelled'].includes(order.status);
        default: return true;
      }
    })();

    return matchesSearch && matchesOrderType && matchesStatus;
  });

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Helper function to get date labels
  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Quick date options
  const getQuickDateOptions = () => {
    const today = new Date();
    const options = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      options.push({
        value: dateString,
        label: getDateLabel(dateString),
        isToday: i === 0
      });
    }

    return options;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Clean Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {selectedDate === new Date().toISOString().split('T')[0]
                  ? "Today's orders and order management"
                  : `Orders for ${getDateLabel(selectedDate)}`
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notification Badges */}
              <div className="flex items-center space-x-2">
                {orders.filter(o => o.orderType === 'pre-order' && ['pending', 'confirmed', 'preparing'].includes(o.status)).length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{orders.filter(o => o.orderType === 'pre-order' && ['pending', 'confirmed', 'preparing'].includes(o.status)).length} pre-order{orders.filter(o => o.orderType === 'pre-order' && ['pending', 'confirmed', 'preparing'].includes(o.status)).length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {orders.filter(o => o.orderType === 'takeaway' && ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>{orders.filter(o => o.orderType === 'takeaway' && ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length} pickup{orders.filter(o => o.orderType === 'takeaway' && ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm font-medium">
                  {orders.filter(o => o.status === 'pending').length} new order{orders.filter(o => o.status === 'pending').length > 1 ? 's' : ''}
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Filters with Date Selection */}
        <div className="mb-6 space-y-4">
          {/* Date Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date:</span>
            </div>

            {/* Quick Date Options */}
            <div className="flex flex-wrap gap-2">
              {getQuickDateOptions().map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedDate(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedDate === option.value
                      ? option.isToday
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  {option.label}
                </button>
              ))}

              {/* Custom Date Picker */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Search and Status Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', count: orders.length },
                { key: 'pending', label: 'New', count: orders.filter(o => o.status === 'pending').length },
                { key: 'active', label: 'Active', count: orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length },
                { key: 'completed', label: 'Done', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Order Type Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Type:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Types', count: orders.length, icon: '📋' },
                { key: 'pre-order', label: 'Pre-order', count: orders.filter(o => o.orderType === 'pre-order').length, icon: '⏰' },
                { key: 'dine-in', label: 'Dine-in', count: orders.filter(o => o.orderType === 'dine-in').length, icon: '🍽️' },
                { key: 'takeaway', label: 'Pickup', count: orders.filter(o => o.orderType === 'takeaway').length, icon: '🥡' },
                { key: 'delivery', label: 'Delivery', count: orders.filter(o => o.orderType === 'delivery').length, icon: '🚚' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveOrderTypeFilter(filter.key as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${activeOrderTypeFilter === filter.key
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label} ({filter.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Date Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Showing orders for:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getDateLabel(selectedDate)}
                  {selectedDate !== new Date().toISOString().split('T')[0] && (
                    <span className="ml-2 text-xs">({new Date(selectedDate).toLocaleDateString()})</span>
                  )}
                </span>
              </div>
              {activeOrderTypeFilter !== 'all' && (
                <div className="flex items-center space-x-2">
                  <span>•</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 capitalize">
                    {activeOrderTypeFilter === 'takeaway' ? 'Pickup' : activeOrderTypeFilter} orders only
                  </span>
                </div>
              )}
            </div>
            {filteredOrders.length > 0 && (
              <span className="text-gray-500 dark:text-gray-400">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </div>

        {/* Compact Order Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-200">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${order.status === 'pending' ? 'bg-yellow-500' :
                    order.status === 'confirmed' ? 'bg-blue-500' :
                      order.status === 'preparing' ? 'bg-orange-500' :
                        order.status === 'ready' ? 'bg-green-500' :
                          order.status === 'delivered' ? 'bg-gray-500' :
                            'bg-red-500'
                    }`}>
                    {order.customerName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{order.customerName}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">#{order.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetails(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {order.customerPhone && (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                <div className="text-center">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Ordered</p>
                  <p className="font-medium text-gray-900 dark:text-white">{order.orderTime ? getTimeAgo(order.orderTime) : 'Unknown'}</p>
                </div>
                <div className="text-center">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{order.orderType}</p>
                  {order.orderType === 'pre-order' && order.preOrderTime && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">@ {order.preOrderTime}</p>
                  )}
                </div>
                <div className="text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">₹{order.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Items ({order.items.length})</p>
                <div className="space-y-2">
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <img src={item.image} alt={item.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 truncate">
                          {item.quantity}x {item.name}
                          {(item as any).selectedVariant && (
                            <span className="text-xs text-gray-500 ml-1">({(item as any).selectedVariant.name})</span>
                          )}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white ml-2">₹{(((item as any).customPrice || item.price) * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">+{order.items.length - 2} more items</p>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Order Progress</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((status, index) => {
                    const isActive = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].indexOf(order.status) >= index;
                    const isCurrent = order.status === status;
                    return (
                      <div key={status} className="flex items-center flex-1">
                        <div className={`h-2 rounded-full flex-1 ${isCurrent ? 'bg-blue-500' :
                          isActive ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                          }`}></div>
                        {index < 4 && <div className="w-1"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {order.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                      disabled={isUpdating === order.id}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                    >
                      {isUpdating === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                      disabled={isUpdating === order.id}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                    disabled={isUpdating === order.id}
                    className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isUpdating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />}
                    <span>Start Preparing</span>
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                    disabled={isUpdating === order.id}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isUpdating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    <span>Mark Ready</span>
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                    disabled={isUpdating === order.id}
                    className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isUpdating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span>Complete Order</span>
                  </button>
                )}

                {/* Time Update */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Prep Time: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">{order.adminEstimatedTime || 20} min</span>
                  </div>
                  <button
                    onClick={() => openTimeModal(order)}
                    className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    Update Time
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm
                ? `No orders match "${searchTerm}" for ${getDateLabel(selectedDate).toLowerCase()}${activeOrderTypeFilter !== 'all' ? ` in ${activeOrderTypeFilter === 'takeaway' ? 'pickup' : activeOrderTypeFilter} orders` : ''}.`
                : activeTab === 'pending'
                  ? `No new orders for ${getDateLabel(selectedDate).toLowerCase()}${activeOrderTypeFilter !== 'all' ? ` in ${activeOrderTypeFilter === 'takeaway' ? 'pickup' : activeOrderTypeFilter} orders` : ''}. New orders will appear here automatically.`
                  : `No ${activeTab !== 'all' ? activeTab + ' ' : ''}orders found for ${getDateLabel(selectedDate).toLowerCase()}${activeOrderTypeFilter !== 'all' ? ` in ${activeOrderTypeFilter === 'takeaway' ? 'pickup' : activeOrderTypeFilter} orders` : ''}.`
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
              {selectedDate !== new Date().toISOString().split('T')[0] && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  View Today's Orders
                </button>
              )}
              {(activeOrderTypeFilter !== 'all' || activeTab !== 'all') && (
                <button
                  onClick={() => {
                    setActiveOrderTypeFilter('all');
                    setActiveTab('all');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Order Details</h2>
                <p className="text-gray-500 dark:text-gray-400">#{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Order Type:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedOrder.orderType}</span>
                    </div>
                    {selectedOrder.orderType === 'pre-order' && selectedOrder.preOrderTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Scheduled For:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{selectedOrder.preOrderTime}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Items ({selectedOrder.items.length})</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                              {(item as any).selectedVariant && (
                                <span className="text-sm text-gray-500 ml-1">({(item as any).selectedVariant.name})</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                            {(item as any).selectedAddons && (item as any).selectedAddons.length > 0 && (
                              <p className="text-xs text-gray-500">
                                + {(item as any).selectedAddons.map((addon: any) => addon.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">₹{(((item as any).customPrice || item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Special Notes */}
                {selectedOrder.specialNotes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Special Instructions</h3>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300">{selectedOrder.specialNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Modal */}
      {showTimeModal && selectedOrderForTime && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedOrderForTime.orderType === 'pre-order' ? 'Adjust Pre-Order Time' : 'Set Preparation Time'}
              </h2>
              <button
                onClick={() => setShowTimeModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedOrderForTime.orderType === 'pre-order' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Current scheduled time:</strong> {selectedOrderForTime.preOrderTime}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Adding minutes will update the scheduled time accordingly.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {selectedOrderForTime.orderType === 'pre-order' 
                    ? 'Additional Time (minutes)' 
                    : 'Estimated Time (minutes)'
                  }
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={customEstimatedTime}
                  onChange={(e) => setCustomEstimatedTime(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {[15, 20, 25, 30, 45, 60].map((time) => (
                  <button
                    key={time}
                    onClick={() => setCustomEstimatedTime(time)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${customEstimatedTime === time
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {time}m
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSetEstimatedTime(selectedOrderForTime.id, customEstimatedTime)}
                  disabled={isUpdating === selectedOrderForTime.id}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isUpdating === selectedOrderForTime.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    selectedOrderForTime.orderType === 'pre-order' ? 'Update Time' : 'Set Time'
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