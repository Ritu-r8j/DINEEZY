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
  Loader2,
  BarChart3,
  ArrowRight,
  Utensils
} from 'lucide-react';
import { Bar, BarChart, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from '@/app/(contexts)/AuthContext';
import { getRestaurantOrders } from '@/app/(utils)/firebaseOperations';
import { useBusinessType } from '@/app/(utils)/useFeatures';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { getBusinessType } = useBusinessType();
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
        case 'today': return orderDate >= startOfToday;
        case 'week': return orderDate >= startOfWeek;
        case 'month': return orderDate >= startOfMonth;
        default: return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders();

  // Calculate stats
  const stats = {
    totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    totalOrders: filteredOrders.length,
    activeOrders: filteredOrders.filter(order => ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)).length,
    avgOrderValue: filteredOrders.length > 0 ? filteredOrders.reduce((sum, order) => sum + order.total, 0) / filteredOrders.length : 0,
    newCustomers: filteredOrders.filter(order => order.isGuest).length,
    completionRate: filteredOrders.length > 0 ? (filteredOrders.filter(order => order.status === 'delivered').length / filteredOrders.length) * 100 : 0
  };

  // Previous stats for comparison (Simplified for demo)
  const previousStats = {
    totalRevenue: stats.totalRevenue * 0.9, // Mock previous data
    totalOrders: Math.max(0, stats.totalOrders - 2),
    avgOrderValue: stats.avgOrderValue * 0.95
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = getPercentageChange(stats.totalRevenue, previousStats.totalRevenue);
  const ordersChange = getPercentageChange(stats.totalOrders, previousStats.totalOrders);
  const avgOrderChange = getPercentageChange(stats.avgOrderValue, previousStats.avgOrderValue);

  // Generate chart data
  const getChartData = () => {
    const data = [];
    const now = new Date();
    
    if (timeRange === 'today') {
      for (let i = 0; i < 24; i += 4) {
        // Mock distribution for visualization
        const hourLabel = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
        data.push({ name: hourLabel, value: Math.floor(Math.random() * 10) + stats.totalOrders / 6 });
      }
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(day => {
        data.push({ name: day, value: Math.floor(Math.random() * 20) + 5 });
      });
    }
    return data;
  };

  const chartData = getChartData();

  // Recent Orders
  const recentOrders = filteredOrders
    .sort((a, b) => new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt).getTime() - new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt).getTime())
    .slice(0, 5)
    .map(order => ({
      id: order.id,
      customer: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      amount: order.total,
      status: order.status,
      items: order.items?.length || 0,
      time: new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      case 'confirmed': return 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600';
      case 'preparing': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600';
      case 'ready': return 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 border-gray-900 dark:border-gray-100'; // High contrast for ready
      case 'delivered': return 'bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-gray-900 border-none font-medium'; // Brand gradient
      case 'cancelled': return 'bg-gray-50 text-gray-500 dark:bg-gray-900/50 dark:text-gray-600 border-gray-100 dark:border-gray-800 line-through';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-gray-900 dark:text-white" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-900 dark:text-white" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 border border-transparent rounded-lg hover:opacity-90 transition-opacity shadow-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Overview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        
        {/* Time Filter */}
        <div className="flex bg-white dark:bg-[#14161a] p-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setIsFilterLoading(true);
                setTimeRange(range);
                setTimeout(() => setIsFilterLoading(false), 300);
              }}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 capitalize
                ${timeRange === range 
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {isFilterLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={`₹${stats.totalRevenue.toLocaleString()}`} 
              change={revenueChange} 
              icon={DollarSign} 
              isPrimary={true}
            />
            <StatCard 
              title="Total Orders" 
              value={stats.totalOrders} 
              change={ordersChange} 
              icon={ShoppingBag} 
            />
            <StatCard 
              title="Avg. Order Value" 
              value={`₹${stats.avgOrderValue.toFixed(0)}`} 
              change={avgOrderChange} 
              icon={TrendingUp} 
            />
            <StatCard 
              title="Active Orders" 
              value={stats.activeOrders} 
              icon={Clock} 
              subtext={`${stats.completionRate.toFixed(0)}% completion rate`}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-white dark:bg-[#14161a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Analytics</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Income vs Previous Period</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={32}>
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '12px', 
                        border: '1px solid #e5e7eb', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        color: '#1f2937'
                      }}
                    />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }} 
                      dy={10}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#brandGradient)" 
                      radius={[6, 6, 6, 6]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                    <defs>
                      <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#b8dcff" stopOpacity={0.9}/>
                        <stop offset="50%" stopColor="#c9cbff" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#e5c0ff" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Orders Side Panel */}
            <div className="bg-white dark:bg-[#14161a] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h3>
                <Link 
                  href="/admin/orders" 
                  className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline flex items-center gap-1 transition-colors"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="flex-1 space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.items} items • {order.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">₹{order.amount}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                    <ShoppingBag className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No recent orders</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

// Helper Component for Stats
function StatCard({ title, value, change, icon: Icon, isPrimary, subtext }: any) {
  const isPositive = change >= 0;
  
  // Primary card styling (Revenue)
  if (isPrimary) {
    return (
      <div className="relative overflow-hidden bg-white dark:bg-[#14161a] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none group hover:shadow-md transition-all duration-300">
        {/* Subtle gradient background accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] opacity-10 blur-2xl rounded-bl-full -mr-10 -mt-10 transition-opacity group-hover:opacity-20"></div>
        
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold mt-1 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
              {value}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-gray-900 shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        <div className="relative z-10 mt-4 flex items-center text-xs font-medium">
           {change !== undefined && (
            <>
              <span className={`flex items-center gap-1 ${isPositive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-2">vs last period</span>
            </>
           )}
        </div>
      </div>
    );
  }

  // Standard Grayscale Stats
  return (
    <div className="bg-white dark:bg-[#14161a] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center text-xs font-medium">
        {change !== undefined ? (
          <>
            <span className={`flex items-center gap-1 ${isPositive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-gray-400 ml-2">vs last period</span>
          </>
        ) : (
          <span className="text-gray-400">{subtext}</span>
        )}
      </div>
    </div>
  );
}
