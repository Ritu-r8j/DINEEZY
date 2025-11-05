'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    Clock,
    CreditCard,
    Download,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { getRestaurantOrders } from '@/app/(utils)/firebaseOperations';

export default function PaymentsPage() {
    const { user } = useAuth();
    const [timeFilter, setTimeFilter] = useState('today');
    const [searchTerm, setSearchTerm] = useState('');
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    // Calculate payment stats from real data
    const paymentStats = {
        dailyRevenue: orders.reduce((sum, order) => sum + order.total, 0),
        pendingPayouts: orders.filter(order => order.status === 'delivered').reduce((sum, order) => sum + order.total, 0),
        totalTransactions: orders.length,
        averageTransaction: orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0,
        revenueGrowth: 12.0, // This would be calculated from historical data
        transactionGrowth: 8.5 // This would be calculated from historical data
    };

    const transactions = [
        {
            id: 'ORD-20240714-001',
            date: 'July 14, 2024',
            time: '2:30 PM',
            customer: 'Sarah Thompson',
            amount: 125.50,
            status: 'completed',
            paymentMethod: 'Credit Card',
            transactionFee: 3.65
        },
        {
            id: 'ORD-20240714-002',
            date: 'July 14, 2024',
            time: '1:45 PM',
            customer: 'David Lee',
            amount: 89.75,
            status: 'completed',
            paymentMethod: 'Digital Wallet',
            transactionFee: 2.69
        },
        {
            id: 'ORD-20240713-003',
            date: 'July 13, 2024',
            time: '7:20 PM',
            customer: 'Michael Brown',
            amount: 150.00,
            status: 'completed',
            paymentMethod: 'Credit Card',
            transactionFee: 4.35
        },
        {
            id: 'ORD-20240713-004',
            date: 'July 13, 2024',
            time: '6:15 PM',
            customer: 'Jessica Garcia',
            amount: 75.20,
            status: 'pending',
            paymentMethod: 'Bank Transfer',
            transactionFee: 1.50
        },
        {
            id: 'ORD-20240712-005',
            date: 'July 12, 2024',
            time: '8:30 PM',
            customer: 'Robert Wilson',
            amount: 98.40,
            status: 'completed',
            paymentMethod: 'Credit Card',
            transactionFee: 2.95
        }
    ];

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
            case 'failed':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
        }
    };

    const filteredTransactions = transactions.filter(transaction =>
        transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
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
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Payments</h2>
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
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payments & Settlements</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 font-light">
                    Manage your restaurant's financial transactions and payouts.
                </p>
            </div>

            {/* Time Filter */}
            <div className="mb-8 animate-slide-in-from-left">
                <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg transition-all duration-200 hover:shadow-md">
                    {['today', 'week', 'month'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimeFilter(period)}
                            className={`px-6 py-2 rounded text-sm font-medium transition-all duration-200 hover:scale-105 ${timeFilter === period
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {period === 'today' ? 'Today' : period === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in-from-right">
                {/* Daily Revenue Card */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-base font-bold text-gray-900 dark:text-white">Daily Revenue</p>
                            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
                                ${paymentStats.dailyRevenue.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-light">Today</p>
                                <div className="flex items-center">
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    <p className="text-sm font-bold text-green-500">+{paymentStats.revenueGrowth}%</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                    </div>

                    {/* Revenue Chart Placeholder */}
                    <div className="mt-6 h-48 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue chart visualization</p>
                        </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">
                        <span>10AM</span>
                        <span>12PM</span>
                        <span>2PM</span>
                        <span>4PM</span>
                        <span>6PM</span>
                        <span>8PM</span>
                        <span>10PM</span>
                    </div>
                </div>

                {/* Pending Payouts Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg flex flex-col justify-between text-white transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div>
                        <p className="text-base font-bold text-white/80">Pending Payouts</p>
                        <p className="text-sm font-light text-white/60">Total amount pending</p>
                    </div>
                    <div className="mt-4">
                        <p className="text-4xl font-bold">₹{paymentStats.pendingPayouts.toLocaleString()}</p>
                        <div className="flex items-center mt-2">
                            <Clock className="h-4 w-4 text-white/60 mr-1" />
                            <span className="text-sm text-white/60">Next payout in 2 days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-in-from-bottom">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{paymentStats.totalTransactions}</p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full transition-transform duration-200 hover:scale-110">
                            <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600 dark:text-green-400">+{paymentStats.transactionGrowth}% from yesterday</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Transaction</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{paymentStats.averageTransaction}</p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full transition-transform duration-200 hover:scale-110">
                            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center">
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                        <span className="text-sm text-red-600 dark:text-red-400">-2.1% from yesterday</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing Fees</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹73.50</p>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full transition-transform duration-200 hover:scale-110">
                            <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">2.8% of total revenue</span>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="animate-slide-in-from-bottom" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Completed Transactions</h3>
                    <div className="flex items-center space-x-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:shadow-md focus:scale-[1.02]"
                            />
                        </div>

                        {/* Export Button */}
                        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Payment Method</th>
                                    <th className="px-6 py-4">Fee</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800 dark:text-gray-200 font-light">
                                {filteredTransactions.map((transaction, index) => (
                                    <tr key={transaction.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 hover:scale-[1.01] ${index === filteredTransactions.length - 1 ? 'border-b-0' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium">{transaction.date}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.time}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{transaction.id}</td>
                                        <td className="px-6 py-4">{transaction.customer}</td>
                                        <td className="px-6 py-4 font-semibold">₹{transaction.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4">{transaction.paymentMethod}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">₹{transaction.transactionFee.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={getStatusBadge(transaction.status)}>
                                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}