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
    Loader2,
    AlertTriangle,
    Wallet,
    Calendar,
    ChevronDown,
    Filter
} from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { 
    getRestaurantTransactions, 
    getTransactionAnalytics,
    getDayWiseTransactionAnalytics,
    createPayoutRequest,
    getRestaurantPayoutRequests,
    Transaction,
    PayoutRequest
} from '@/app/(utils)/firebaseOperations';

export default function PaymentsPage() {
    const { user } = useAuth();
    const [timeFilter, setTimeFilter] = useState('today');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [dayWiseData, setDayWiseData] = useState<any>(null);
    const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [isCreatingPayout, setIsCreatingPayout] = useState(false);

    // Load transactions and analytics data
    useEffect(() => {
        const loadPaymentData = async () => {
            if (!user) return;

            try {
                setIsLoading(true);
                setError(null);

                const days = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 30;

                const [transactionsResult, analyticsResult, dayWiseResult, payoutsResult] = await Promise.all([
                    getRestaurantTransactions(user.uid, 100),
                    getTransactionAnalytics(user.uid, days),
                    getDayWiseTransactionAnalytics(user.uid, days),
                    getRestaurantPayoutRequests(user.uid)
                ]);

                if (transactionsResult.success && transactionsResult.data) {
                    setTransactions(transactionsResult.data);
                } else {
                    setError(transactionsResult.error || 'Failed to load transactions');
                }

                if (analyticsResult.success && analyticsResult.data) {
                    setAnalytics(analyticsResult.data);
                }

                if (dayWiseResult.success && dayWiseResult.data) {
                    setDayWiseData(dayWiseResult.data);
                }

                if (payoutsResult.success && payoutsResult.data) {
                    setPayoutRequests(payoutsResult.data);
                }
            } catch (err) {
                console.error('Error loading payment data:', err);
                setError('Failed to load payment data');
            } finally {
                setIsLoading(false);
            }
        };

        loadPaymentData();
    }, [user, timeFilter]);

    // Filter transactions
    const getFilteredTransactions = () => {
        if (!transactions.length) return [];
        
        const now = new Date();
        const startDate = new Date();
        
        if (timeFilter === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate.setDate(now.getDate() - 30);
        }

        return transactions.filter(transaction => {
            const transactionDate = transaction.createdAt?.toDate ? 
                transaction.createdAt.toDate() : 
                new Date(transaction.createdAt);
            
            const matchesTimeFilter = transactionDate >= startDate;
            const matchesSearch = searchTerm === '' || 
                transaction.customerInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.customerInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesPaymentMethod = paymentMethodFilter === 'all' || 
                (paymentMethodFilter === 'online' && (transaction.paymentMethod === 'online' || transaction.paymentMethod === 'card')) ||
                (paymentMethodFilter === 'cash' && (transaction.paymentMethod === 'cash' || transaction.paymentMethod === 'pay-later'));
            
            return matchesTimeFilter && matchesSearch && matchesPaymentMethod;
        });
    };

    const filteredTransactions = getFilteredTransactions();

    // Helper functions
    const getStatusBadge = (status: string) => {
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide border";
        switch (status) {
            case 'completed':
                return `${baseClasses} bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white`;
            case 'pending':
                return `${baseClasses} bg-white text-gray-500 border-gray-300 dark:bg-[#14161a] dark:text-gray-400 dark:border-gray-700`;
            case 'failed':
                return `${baseClasses} bg-gray-100 text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700`;
            case 'refunded':
                return `${baseClasses} bg-gray-50 text-gray-500 border-gray-200 line-through dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800`;
            default:
                return `${baseClasses} bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800`;
        }
    };

    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'card': 
            case 'upi': 
            case 'online': 
                return 'Online Payment';
            case 'cash': 
                return 'Cash on Delivery';
            case 'bank_transfer': 
                return 'Online Payment';
            default: 
                return method === 'pay-later' ? 'Pay at Restaurant' : 'Online Payment';
        }
    };

    const formatDate = (timestamp: any) => {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return {
            date: date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }),
            time: date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            }),
            full: date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        };
    };

    const exportTransactions = () => {
        const csvContent = [
            ['Date', 'Time', 'Order ID', 'Customer', 'Amount', 'Payment Method', 'Fee', 'Status'].join(','),
            ...filteredTransactions.map(transaction => {
                const { date, time } = formatDate(transaction.createdAt);
                return [
                    date,
                    time,
                    transaction.orderId,
                    `${transaction.customerInfo.firstName} ${transaction.customerInfo.lastName}`.trim(),
                    transaction.amount,
                    formatPaymentMethod(transaction.paymentMethod),
                    transaction.processingFee || 0,
                    transaction.paymentStatus
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${timeFilter}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleCreatePayoutRequest = async () => {
        if (!user || !dayWiseData) return;

        setIsCreatingPayout(true);
        try {
            const days = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 30;
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            
            const startDate = new Date();
            if (days === 1) {
                startDate.setHours(0, 0, 0, 0);
            } else {
                startDate.setDate(startDate.getDate() - days + 1);
                startDate.setHours(0, 0, 0, 0);
            }

            const availableTransactions = dayWiseData.dayWiseData[0]?.transactions || [];
            const payoutAmount = dayWiseData.totals.totalPayoutAmount;
            
            if (payoutAmount <= 0 || availableTransactions.length === 0) {
                alert('No new transactions available for payout.');
                return;
            }

            // Get restaurant name
            let restaurantName = 'Restaurant Name';
            try {
                const { getRestaurantSettings } = await import('@/app/(utils)/firebaseOperations');
                const restaurantResult = await getRestaurantSettings(user.uid);
                if (restaurantResult.success && restaurantResult.data) {
                    restaurantName = restaurantResult.data.name;
                }
            } catch (error) {}

            const payoutData = {
                restaurantId: user.uid,
                restaurantName: restaurantName,
                adminId: user.uid,
                adminName: user.displayName || 'Admin',
                adminEmail: user.email || '',
                amount: payoutAmount,
                currency: 'INR',
                period: {
                    startDate: startDate,
                    endDate: endDate
                },
                transactionIds: availableTransactions.map((t: Transaction) => t.id),
                status: 'pending' as const
            };

            const result = await createPayoutRequest(payoutData);
            
            if (result.success) {
                alert('Payout request created successfully!');
                setShowPayoutModal(false);
                const payoutsResult = await getRestaurantPayoutRequests(user.uid);
                if (payoutsResult.success && payoutsResult.data) {
                    setPayoutRequests(payoutsResult.data);
                }
            } else {
                alert('Failed to create payout request: ' + result.error);
            }
        } catch (error: any) {
            alert('Error creating payout request: ' + error.message);
        } finally {
            setIsCreatingPayout(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0f1115]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0f1115] gap-4">
                <AlertTriangle className="h-12 w-12 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Error Loading Payments</h2>
                <p className="text-gray-500 dark:text-gray-400">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Payments & Settlements
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage your financial transactions and payouts.
                        </p>
                    </div>
                    
                    {/* Time Filter */}
                    <div className="inline-flex bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 p-1 rounded-lg shadow-sm">
                        {['today', 'week', 'month'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setTimeFilter(period)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                    timeFilter === period
                                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                {period === 'today' ? 'Today' : period === 'week' ? '7 Days' : '30 Days'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Revenue Card */}
                    <div className="bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <DollarSign className="h-6 w-6 text-gray-900 dark:text-white" />
                            </div>
                            <span className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +12.5%
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-[#b8dcff] dark:via-[#c9cbff] dark:to-[#e5c0ff]">
                                ₹{dayWiseData?.totals?.totalRevenue?.toLocaleString() || '0'}
                            </h3>
                            {analytics?.totalRevenue !== dayWiseData?.totals?.totalRevenue && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Pending: ₹{(analytics?.totalRevenue - (dayWiseData?.totals?.totalRevenue || 0)).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Pending Payouts Card */}
                    <div className="bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <Clock className="h-6 w-6 text-gray-900 dark:text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payouts</p>
                            <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-[#b8dcff] dark:via-[#c9cbff] dark:to-[#e5c0ff]">
                                ₹{payoutRequests
                                    .filter(p => p.status === 'pending' || p.status === 'approved')
                                    .reduce((sum, p) => sum + p.amount, 0)
                                    .toFixed(2)
                                }
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {payoutRequests.filter(p => p.status === 'pending').length} requests awaiting approval
                            </p>
                        </div>
                    </div>

                    {/* Available Payout Action Card */}
                    <div className="bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <Wallet className="h-6 w-6 text-gray-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available for Payout</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                ₹{dayWiseData?.totals?.totalPayoutAmount?.toFixed(2) || '0.00'}
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Online payments only (minus fees)</p>
                        </div>
                        <button
                            onClick={() => setShowPayoutModal(true)}
                            disabled={!dayWiseData?.totals?.totalPayoutAmount || dayWiseData.totals.totalPayoutAmount <= 0}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-black rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            Process Payout
                        </button>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { 
                            label: 'Total Transactions', 
                            value: analytics?.totalTransactions || 0,
                            icon: CreditCard
                        },
                        { 
                            label: 'Avg. Transaction', 
                            value: `₹${analytics?.averageTransaction?.toFixed(2) || '0.00'}`,
                            icon: TrendingUp
                        },
                        { 
                            label: 'Processing Fees', 
                            value: `₹${analytics?.totalProcessingFees?.toFixed(2) || '0.00'}`,
                            icon: DollarSign
                        },
                        { 
                            label: 'Online vs Cash', 
                            value: `${analytics?.paymentMethodBreakdown?.online || 0} / ${analytics?.paymentMethodBreakdown?.cash || 0}`,
                            icon: Wallet
                        },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#14161a] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Transactions Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#14161a] text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-gray-900 dark:focus:border-white w-full sm:w-64"
                                />
                            </div>
                            <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#14161a] p-1">
                                {['all', 'online', 'cash'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethodFilter(method)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                                            paymentMethodFilter === method 
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={exportTransactions}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                                        <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                No transactions found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((transaction) => {
                                            const { date, time } = formatDate(transaction.createdAt);
                                            const customerName = `${transaction.customerInfo.firstName} ${transaction.customerInfo.lastName}`.trim();
                                            
                                            return (
                                                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900 dark:text-white">{date}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{time}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-400">
                                                        {transaction.orderId}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                                                        {customerName || 'Guest'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                                                        ₹{transaction.amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                        {formatPaymentMethod(transaction.paymentMethod)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={getStatusBadge(transaction.paymentStatus)}>
                                                            {transaction.paymentStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Day-wise Table Section */}
                {dayWiseData && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Day-wise Breakdown</h2>
                        <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payout</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method Split</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {dayWiseData.dayWiseData.map((day: any) => (
                                            <tr key={day.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    {day.totalTransactions}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                                                    ₹{day.totalRevenue.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-700 dark:text-gray-300">
                                                    ₹{day.payoutAmount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                                            {day.onlineTransactions} Online
                                                        </span>
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                                            {day.cashTransactions} Cash
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#14161a] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Request Payout</h3>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-800">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Period</span>
                                        <span className="font-medium text-gray-900 dark:text-white capitalize">{timeFilter}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Total Revenue</span>
                                        <span className="font-medium text-gray-900 dark:text-white">₹{dayWiseData?.totals?.totalRevenue?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Fees</span>
                                        <span className="font-medium text-gray-500 dark:text-gray-400">-₹{dayWiseData?.totals?.totalProcessingFees?.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between items-center">
                                        <span className="font-semibold text-gray-900 dark:text-white">Payout Amount</span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">₹{dayWiseData?.totals?.totalPayoutAmount?.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-gray-400 shrink-0" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Payouts are processed within 2-3 business days. Only online payments are eligible for payout.
                                    </p>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowPayoutModal(false)}
                                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreatePayoutRequest}
                                        disabled={isCreatingPayout}
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#b8dcff] via-[#c9cbff] to-[#e5c0ff] text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isCreatingPayout ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payout'}
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
