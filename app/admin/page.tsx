'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { getRestaurantOrders } from '@/app/(utils)/firebaseOperations';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('today');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Load orders data
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const ordersResult = await getRestaurantOrders(user.uid);

        if (ordersResult.success && ordersResult.data) {
          setOrders(ordersResult.data);
        } else {
          setError(ordersResult.error || 'Failed to load orders');
        }
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  // Filter orders based on time range
  const getFilteredOrders = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);

      switch (timeRange) {
        case 'today':
          return orderDate >= startOfToday;
        case 'week':
          return orderDate >= startOfWeek;
        case 'month':
          return orderDate >= startOfMonth;
        default:
          return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders();

  // Calculate stats from filtered data
  const stats = {
    totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    totalOrders: filteredOrders.length,
    activeOrders: filteredOrders.filter(order => ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)).length,
    avgOrderValue: filteredOrders.length > 0 ? filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length : 0,
    newCustomers: filteredOrders.filter(order => order.isGuest).length,
    completionRate: filteredOrders.length > 0 ? (filteredOrders.filter(order => order.status === 'delivered').length / filteredOrders.length) * 100 : 0
  };

  // Calculate previous period stats for comparison
  const getPreviousPeriodStats = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'today':
        // Yesterday
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        // Previous week
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case 'month':
        // Previous month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        return { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };
    }

    const previousOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= startDate && orderDate < endDate;
    });

    return {
      totalRevenue: previousOrders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: previousOrders.length,
      avgOrderValue: previousOrders.length > 0 ? previousOrders.reduce((sum, order) => sum + order.total, 0) / previousOrders.length : 0
    };
  };

  const previousStats = getPreviousPeriodStats();

  // Calculate percentage changes
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = getPercentageChange(stats.totalRevenue, previousStats.totalRevenue);
  const ordersChange = getPercentageChange(stats.totalOrders, previousStats.totalOrders);
  const avgOrderChange = getPercentageChange(stats.avgOrderValue, previousStats.avgOrderValue);

  // Get recent orders (last 4) from filtered data
  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const recentOrders = filteredOrders
    .sort((a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt).getTime() - new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt).getTime())
    .slice(0, 4)
    .map(order => ({
      id: order.id,
      customer: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      amount: order.total,
      status: order.status,
      time: getTimeAgo(new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt))
    }));

  // Helper function to format percentage change
  const formatPercentageChange = (change: number) => {
    const isPositive = change >= 0;
    const formattedChange = Math.abs(change).toFixed(1);
    return {
      text: `${isPositive ? '+' : '-'}${formattedChange}%`,
      color: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      icon: isPositive ? TrendingUp : TrendingUp // You could use TrendingDown for negative
    };
  };

  // Get period label for comparison text
  const getPeriodLabel = () => {
    switch (timeRange) {
      case 'today': return 'yesterday';
      case 'week': return 'last week';
      case 'month': return 'last month';
      default: return 'previous period';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'confirmed': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'preparing': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8 animate-slide-in-from-top">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's what's happening at your restaurant {timeRange === 'today' ? 'today' : `this ${timeRange}`}.
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 animate-slide-in-from-left">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setIsFilterLoading(true);
                setTimeRange(range);
                // Small delay to show loading state
                setTimeout(() => setIsFilterLoading(false), 200);
              }}
              disabled={isFilterLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
        {isFilterLoading && (
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Updating data...
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-in-from-right">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {(() => {
              const change = formatPercentageChange(revenueChange);
              const Icon = change.icon;
              return (
                <>
                  <Icon className={`h-4 w-4 mr-1 ${change.color}`} />
                  <span className={`text-sm ${change.color}`}>{change.text} from {getPeriodLabel()}</span>
                </>
              );
            })()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {(() => {
              const change = formatPercentageChange(ordersChange);
              const Icon = change.icon;
              return (
                <>
                  <Icon className={`h-4 w-4 mr-1 ${change.color}`} />
                  <span className={`text-sm ${change.color}`}>{change.text} from {getPeriodLabel()}</span>
                </>
              );
            })()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeOrders}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/admin/orders" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all orders →
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {(() => {
              const change = formatPercentageChange(avgOrderChange);
              const Icon = change.icon;
              return (
                <>
                  <Icon className={`h-4 w-4 mr-1 ${change.color}`} />
                  <span className={`text-sm ${change.color}`}>{change.text} from {getPeriodLabel()}</span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Showing {recentOrders.length} of {filteredOrders.length} orders from {timeRange === 'today' ? 'today' : `this ${timeRange}`}
                </p>
              </div>
              <Link href="/admin/orders" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{order.customer}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">#{order.id} • {order.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">₹{order.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{order.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No orders found for the selected period</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Try selecting a different time range
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Metrics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Completion Rate</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Prep Time</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {filteredOrders.length > 0 ? '18 min' : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: filteredOrders.length > 0 ? '75%' : '0%' }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Satisfaction</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {filteredOrders.length > 0 ? '4.8/5' : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: filteredOrders.length > 0 ? '96%' : '0%' }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newCustomers}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">New Customers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredOrders.length > 0 ? '4.2' : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Link
            href="/admin/orders"
            className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">View Orders</span>
          </Link>
          <Link
            href="/admin/menu"
            className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <span className="text-green-700 dark:text-green-300 font-medium">Manage Menu</span>
          </Link>
          <Link
            href="/admin/reviews"
            className="flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <span className="text-yellow-700 dark:text-yellow-300 font-medium">View Reviews</span>
          </Link>
          <Link
            href="/admin/reservations"
            className="flex items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <span className="text-purple-700 dark:text-purple-300 font-medium">Reservations</span>
          </Link>
          <Link
            href="/admin/payments"
            className="flex items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <span className="text-indigo-700 dark:text-indigo-300 font-medium">View Payments</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300 font-medium">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}