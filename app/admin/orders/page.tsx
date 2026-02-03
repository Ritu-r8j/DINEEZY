'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Eye, 
  Phone, 
  MapPin, 
  DollarSign, 
  Search, 
  RefreshCw, 
  X, 
  ChefHat, 
  Package, 
  Loader2, 
  CheckCircle, 
  Calendar, 
  ClipboardList, 
  UtensilsCrossed, 
  ShoppingBag, 
  Car, 
  Truck, 
  AlertCircle, 
  Droplets, 
  HelpCircle, 
  CircleDot,
  Filter,
  ArrowRight,
  Users
} from 'lucide-react';
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
  selectedVariant?: {name: string, price: number} | null;
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
  items: OrderItem[];
}

export default function OrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [activeOrderTypeFilter, setActiveOrderTypeFilter] = useState<'all' | 'pre-order' | 'dine-in' | 'takeaway' | 'delivery' | 'car-dine-in'>('all');
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
    // Using Theme Status Colors
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-[#1a1d24] dark:text-gray-300 dark:border-gray-800';
      case 'confirmed': return 'bg-white text-slate-900 border border-gray-300 dark:bg-[#14161a] dark:text-white dark:border-gray-800';
      case 'preparing': return 'bg-white text-slate-900 border border-gray-300 dark:bg-[#14161a] dark:text-white dark:border-gray-800';
      case 'ready': return 'bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-slate-900 border border-transparent font-bold';
      case 'delivered': return 'bg-black text-white dark:bg-white dark:text-black font-bold';
      case 'cancelled': return 'bg-gray-50 text-gray-400 line-through border border-gray-100 dark:bg-[#14161a] dark:text-gray-600 dark:border-gray-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-[#1a1d24] dark:text-gray-400';
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
      
      const order = orders.find(o => o.id === orderId);
      
      let result;
      let newScheduledTime = null;
      
      if (order && order.orderType === 'pre-order') {
        result = await updatePreOrderTime(orderId, estimatedTime);
        if (result.success && 'newTime' in result) {
          newScheduledTime = result.newTime;
        }
      } else {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Orders</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115]">
      {/* Header with Glass Effect */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Orders</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedDate === new Date().toISOString().split('T')[0]
                  ? "Today's orders and real-time updates"
                  : `Archive for ${getDateLabel(selectedDate)}`
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                 {orders.filter(o => o.status === 'pending').length > 0 && (
                  <div className="bg-gray-100 dark:bg-[#1a1d24] text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-sm border border-gray-200 dark:border-gray-800">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                    </span>
                    <span>{orders.filter(o => o.status === 'pending').length} New</span>
                  </div>
                )}
                
                {orders.filter(o => ['preparing', 'confirmed'].includes(o.status)).length > 0 && (
                  <div className="bg-gradient-to-r from-[#b8dcff]/30 to-[#e5c0ff]/30 text-slate-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-sm border border-[#b8dcff]/50">
                    <ChefHat className="h-3 w-3" />
                    <span>{orders.filter(o => ['preparing', 'confirmed'].includes(o.status)).length} Active</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-[#1a1d24] rounded-full transition-all duration-200"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Controls Row */}
          <div className="mt-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-[#14161a] rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
              {[
                { key: 'all', label: 'All', count: orders.length },
                { key: 'pending', label: 'New', count: orders.filter(o => o.status === 'pending').length },
                { key: 'active', label: 'Active', count: orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length },
                { key: 'completed', label: 'History', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-slate-900 shadow-sm font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-[#1a1d24]/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-xs ${
                    activeTab === tab.key ? 'bg-white/40 text-slate-900' : 'bg-gray-200 dark:bg-[#1a1d24] text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all shadow-sm outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all shadow-sm h-full outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-1">Filter:</span>
             {[
                { key: 'all', label: 'All Types', icon: ClipboardList },
                { key: 'pre-order', label: 'Pre-order', icon: Clock },
                { key: 'dine-in', label: 'Dine-in', icon: UtensilsCrossed },
                { key: 'takeaway', label: 'Pickup', icon: ShoppingBag },
                { key: 'car-dine-in', label: 'Car Service', icon: Car },
                { key: 'delivery', label: 'Delivery', icon: Truck }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveOrderTypeFilter(filter.key as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center space-x-1.5 border ${
                    activeOrderTypeFilter === filter.key
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                      : 'bg-white dark:bg-[#14161a] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >
                  <filter.icon className="h-3 w-3" />
                  <span>{filter.label}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="group bg-white dark:bg-[#14161a] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-[0_0_20px_rgba(184,220,255,0.4)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Gradient Border Line */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                ['confirmed', 'preparing', 'ready'].includes(order.status) 
                  ? 'bg-gradient-to-b from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff]' 
                  : order.status === 'delivered' ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-[#1a1d24]'
              }`}></div>

              {/* Card Header */}
              <div className="flex items-start justify-between mb-4 pl-3">
                <div className="flex items-center space-x-3">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border border-gray-100 dark:border-gray-800 ${
                     ['confirmed', 'preparing', 'ready'].includes(order.status) 
                        ? 'bg-gradient-to-br from-[#b8dcff] to-[#e5c0ff] text-slate-900' 
                        : 'bg-gray-100 dark:bg-[#1a1d24] text-gray-600 dark:text-gray-300'
                   }`}>
                    {order.customerName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{order.customerName}</h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5 space-x-2">
                       <span className="font-mono">#{order.id.slice(-6)}</span>
                       <span>•</span>
                       <span>{getTimeAgo(order.orderTime || new Date())}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="flex space-x-1">
                     <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-[#1a1d24]/50 dark:hover:text-white rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-[#1a1d24]/50 dark:hover:text-white rounded-lg transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                  </div>
                </div>
              </div>

              {/* Order Info Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 pl-3">
                <div className="bg-gray-50 dark:bg-[#1a1d24] p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> Time
                  </p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {order.orderType === 'pre-order' && order.preOrderTime ? order.preOrderTime : 'ASAP'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#1a1d24] p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                   <p className="text-xs text-gray-500 mb-1 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" /> Total
                  </p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                     ₹{order.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Items Preview */}
              <div className="pl-3 mb-4 space-y-2">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm group/item">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-5 h-5 rounded-md bg-gray-100 dark:bg-[#1a1d24] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                        {item.quantity}x
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 truncate group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-gray-500 pl-8 font-medium">
                    +{order.items.length - 2} more items
                  </p>
                )}
              </div>

              {/* Action Bar */}
              <div className="pl-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                      disabled={isUpdating === order.id}
                      className="flex-1 py-2.5 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] hover:opacity-90 text-slate-900 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center space-x-2"
                    >
                      {isUpdating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                      disabled={isUpdating === order.id}
                      className="px-4 py-2.5 bg-white dark:bg-[#14161a] hover:bg-gray-50 dark:hover:bg-[#1a1d24]/50 text-gray-600 dark:text-gray-400 rounded-lg font-medium text-sm transition-colors border border-gray-200 dark:border-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                    disabled={isUpdating === order.id}
                    className="w-full py-2.5 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] hover:opacity-90 text-slate-900 border border-transparent rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
                  >
                    {isUpdating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />}
                    <span>Start Preparing</span>
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                    disabled={isUpdating === order.id}
                    className="w-full py-2.5 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] hover:opacity-90 text-slate-900 border border-transparent rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
                  >
                     {isUpdating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    <span>Mark Ready</span>
                  </button>
                )}
                
                {order.status === 'ready' && (
                   <div className="space-y-2">
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                      disabled={isUpdating === order.id}
                      className="w-full py-2.5 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                    >
                      {isUpdating === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      <span>Complete Order</span>
                    </button>
                    {order.orderType === 'car-dine-in' && (order as any).serviceMode === 'EAT_IN_CAR' && (
                       <div className="grid grid-cols-2 gap-2 mt-2">
                          <button className="py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1d24] dark:hover:bg-[#1a1d24]/80 text-xs font-medium rounded text-gray-700 dark:text-gray-300">
                             Assist
                          </button>
                          <button className="py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1d24] dark:hover:bg-[#1a1d24]/80 text-xs font-medium rounded text-gray-700 dark:text-gray-300">
                             Water
                          </button>
                       </div>
                    )}
                   </div>
                )}
                
                {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                   <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Est. {order.adminEstimatedTime || 20}m
                      </span>
                      <button 
                        onClick={() => openTimeModal(order)}
                        className="text-gray-900 dark:text-white hover:underline font-bold"
                      >
                        Adjust
                      </button>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-[#1a1d24] rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-12 w-12 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              {searchTerm
                ? `No orders match "${searchTerm}". Try different keywords.`
                : activeTab === 'pending'
                  ? `You're all caught up! New orders will appear here automatically.`
                  : `No orders in this category for ${getDateLabel(selectedDate)}.`
              }
            </p>
             <button
                onClick={() => {
                   setSearchTerm('');
                   setActiveTab('all');
                   setActiveOrderTypeFilter('all');
                   setSelectedDate(new Date().toISOString().split('T')[0]);
                }}
                className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-bold transition-all hover:shadow-lg"
              >
                Clear Filters & Reset
              </button>
          </div>
        )}
      </div>

      {/* Order Details Modal - Using Glass Overlay */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrderDetails(false)}></div>
          <div className="relative bg-white dark:bg-[#14161a] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Details</h2>
                <div className="flex items-center space-x-2 mt-1">
                   <span className="text-sm text-gray-500">#{selectedOrder.id}</span>
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                   </span>
                </div>
              </div>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1d24]/50 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
               <div className="grid gap-6 md:grid-cols-2 mb-6">
                  {/* Customer Info Card */}
                  <div className="bg-gray-50 dark:bg-[#1a1d24] p-4 rounded-xl space-y-3">
                     <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                        <Users className="h-4 w-4 mr-2" /> Customer Info
                     </h3>
                     <div className="space-y-2 text-sm">
                        <p className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerName}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.customerPhone}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Address:</span> <span className="font-medium truncate max-w-[150px] text-gray-900 dark:text-white">{selectedOrder.customerAddress || 'N/A'}</span></p>
                     </div>
                  </div>
                  
                  {/* Order Info Card */}
                  <div className="bg-gray-50 dark:bg-[#1a1d24] p-4 rounded-xl space-y-3">
                     <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                        <ClipboardList className="h-4 w-4 mr-2" /> Order Info
                     </h3>
                     <div className="space-y-2 text-sm">
                        <p className="flex justify-between"><span className="text-gray-500">Type:</span> <span className="font-medium capitalize text-gray-900 dark:text-white">{selectedOrder.orderType}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Time:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.preOrderTime || 'Now'}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Payment:</span> <span className="font-medium capitalize text-gray-900 dark:text-white">{selectedOrder.paymentMethod}</span></p>
                     </div>
                  </div>
               </div>

               {/* Items List */}
               <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Order Items</h3>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                     {selectedOrder.items.map((item) => (
                        <div key={item.id} className="py-3 flex items-start gap-4">
                           <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200" />
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                                 <span>{item.quantity}x {item.name}</span>
                                 <span>₹{(((item as any).customPrice || item.price) * item.quantity).toFixed(2)}</span>
                              </p>
                              {(item as any).selectedVariant && (
                                 <p className="text-xs text-gray-500">Variant: {(item as any).selectedVariant.name}</p>
                              )}
                              {(item as any).selectedAddons?.length > 0 && (
                                 <p className="text-xs text-gray-500">+ {(item as any).selectedAddons.map((a:any) => a.name).join(', ')}</p>
                              )}
                              {item.specialInstructions && (
                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">"{item.specialInstructions}"</p>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Special Instructions */}
               {selectedOrder.specialNotes && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-xl">
                     <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-1">Special Note</h4>
                     <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.specialNotes}</p>
                  </div>
               )}
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1d24]/50">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-medium text-gray-500">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
               </div>
               
               {/* Contextual Actions in Modal */}
               {selectedOrder.status === 'pending' && (
                  <button 
                     onClick={() => { handleUpdateOrderStatus(selectedOrder.id, 'confirmed'); setShowOrderDetails(false); }}
                     className="w-full py-3 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-slate-900 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                     Accept Order
                  </button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Time Modal */}
      {showTimeModal && selectedOrderForTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTimeModal(false)}></div>
           <div className="relative bg-white dark:bg-[#14161a] rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Set Preparation Time</h3>
              <p className="text-sm text-gray-500 mb-6">
                 {selectedOrderForTime.orderType === 'pre-order' 
                   ? 'Adjust the scheduled time for this pre-order.' 
                   : 'How many minutes until this order is ready?'}
              </p>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                 {[15, 20, 25, 30, 45, 60].map((time) => (
                    <button
                       key={time}
                       onClick={() => setCustomEstimatedTime(time)}
                       className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          customEstimatedTime === time 
                          ? 'bg-black dark:bg-white text-white dark:text-black ring-2 ring-gray-200 dark:ring-gray-700' 
                          : 'bg-gray-100 dark:bg-[#1a1d24] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1a1d24]/80'
                       }`}
                    >
                       {time}m
                    </button>
                 ))}
              </div>
              
              <div className="relative mb-6">
                 <input 
                    type="number" 
                    value={customEstimatedTime}
                    onChange={(e) => setCustomEstimatedTime(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent outline-none"
                 />
                 <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">min</span>
              </div>
              
              <div className="flex gap-3">
                 <button 
                    onClick={() => setShowTimeModal(false)}
                    className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1d24] rounded-lg transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={() => handleSetEstimatedTime(selectedOrderForTime.id, customEstimatedTime)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-slate-900 text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
                 >
                    Update
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
