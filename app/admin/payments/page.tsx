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
    Loader2
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
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all'); // New filter state
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

                // Get days based on filter
                const days = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 30;

                // Load transactions, analytics, day-wise data, and payout requests
                const [transactionsResult, analyticsResult, dayWiseResult, payoutsResult] = await Promise.all([
                    getRestaurantTransactions(user.uid, 100), // Get last 100 transactions
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
                } else {
                    console.error('Failed to load day-wise data:', dayWiseResult.error);
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

    // Filter transactions based on time period
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
            
            // Payment method filter
            const matchesPaymentMethod = paymentMethodFilter === 'all' || 
                (paymentMethodFilter === 'online' && (transaction.paymentMethod === 'online' || transaction.paymentMethod === 'card')) ||
                (paymentMethodFilter === 'cash' && (transaction.paymentMethod === 'cash' || transaction.paymentMethod === 'pay-later'));
            
            return matchesTimeFilter && matchesSearch && matchesPaymentMethod;
        });
    };

    const filteredTransactions = getFilteredTransactions();

    // Helper functions
    const getStatusBadge = (status: string) => {
        const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
            case 'failed':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
            case 'refunded':
                return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
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
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }),
            time: date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
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

    // Create payout request
    const handleCreatePayoutRequest = async () => {
        if (!user || !dayWiseData) return;

        setIsCreatingPayout(true);
        try {
            const days = timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 30;
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            
            const startDate = new Date();
            if (days === 1) {
                startDate.setHours(0, 0, 0, 0); // Start of today
            } else {
                startDate.setDate(startDate.getDate() - days + 1);
                startDate.setHours(0, 0, 0, 0);
            }

            // Get available transactions (not already in pending/approved payouts)
            const availableTransactions = dayWiseData.dayWiseData[0]?.transactions || [];
            
            const payoutAmount = dayWiseData.totals.totalPayoutAmount;
            
            if (payoutAmount <= 0 || availableTransactions.length === 0) {
                alert('No new transactions available for payout. All transactions may already be included in pending payout requests.');
                return;
            }

            // Get restaurant name from settings or use default
            let restaurantName = 'Restaurant Name';
            try {
                const { getRestaurantSettings } = await import('@/app/(utils)/firebaseOperations');
                const restaurantResult = await getRestaurantSettings(user.uid);
                if (restaurantResult.success && restaurantResult.data) {
                    restaurantName = restaurantResult.data.name;
                }
            } catch (error) {
                // Silently use default restaurant name
            }

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
                transactionIds: availableTransactions.map((t: Transaction) => t.id), // Only available transactions
                status: 'pending' as const
            };

            const result = await createPayoutRequest(payoutData);
            
            if (result.success) {
                alert('Payout request created successfully!');
                setShowPayoutModal(false);
                // Reload payout requests
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
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                    Payments & Settlements
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 font-light">
                    Manage your restaurant's financial transactions and payouts.
                </p>
            </div>

            {/* Time Filter */}
            <div className="mb-6 sm:mb-8">
                <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg transition-all duration-200 hover:shadow-md overflow-x-auto">
                    {['today', 'week', 'month'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setTimeFilter(period)}
                            className={`px-3 sm:px-4 lg:px-6 py-2 rounded text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${timeFilter === period
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            {period === 'today' ? 'Today' : period === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Available Revenue Card */}
                <div className="sm:col-span-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 sm:p-6 rounded-xl border border-green-200 dark:border-green-800/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 mb-3 sm:mb-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Available Revenue</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        {timeFilter === 'today' ? 'Today' : timeFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                                    </p>
                                </div>
                            </div>
                            <p className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200">
                                ₹{dayWiseData?.totals?.totalRevenue?.toLocaleString() || '0'}
                            </p>
                            {analytics?.totalRevenue && dayWiseData?.totals?.totalRevenue && 
                             analytics.totalRevenue !== dayWiseData.totals.totalRevenue && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    ₹{(analytics.totalRevenue - dayWiseData.totals.totalRevenue).toFixed(2)} in pending payouts
                                </p>
                            )}
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="flex items-center text-green-600 dark:text-green-400 mb-1">
                                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="text-xs sm:text-sm font-semibold">+12%</span>
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-400">vs last period</p>
                        </div>
                    </div>
                </div>

                {/* Pending Payouts Card */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 sm:p-6 rounded-xl border border-orange-200 dark:border-orange-800/30">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="p-1.5 sm:p-2 bg-orange-500 rounded-lg">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">Pending Payouts</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                {payoutRequests.filter(p => p.status === 'pending' || p.status === 'approved').length} requests
                            </p>
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-orange-800 dark:text-orange-200">
                        ₹{payoutRequests
                            .filter(p => p.status === 'pending' || p.status === 'approved')
                            .reduce((sum, p) => sum + p.amount, 0)
                            .toFixed(2)
                        }
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {payoutRequests.filter(p => p.status === 'pending').length > 0 
                            ? 'Awaiting approval'
                            : payoutRequests.filter(p => p.status === 'approved').length > 0
                            ? 'Approved, awaiting payment'
                            : 'No pending payouts'
                        }
                    </p>
                </div>

                {/* Available Payout Action Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Available Payout</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Online payments only</p>
                        </div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                        ₹{dayWiseData?.totals?.totalPayoutAmount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                        Cash payments excluded
                    </p>
                    <button
                        onClick={() => setShowPayoutModal(true)}
                        disabled={!dayWiseData?.totals?.totalPayoutAmount || 
                                 dayWiseData.totals.totalPayoutAmount <= 0}
                        className="w-full text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors font-medium"
                    >
                        Request Payout
                    </button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Total Transactions</p>
                            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">{analytics?.totalTransactions || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Average Transaction</p>
                            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">₹{analytics?.averageTransaction?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Processing Fees</p>
                            <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">₹{analytics?.totalProcessingFees?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <div className="flex space-x-0.5 sm:space-x-1">
                                <div className="w-1.5 sm:w-2 h-3 sm:h-4 bg-blue-500 rounded-sm"></div>
                                <div className="w-1.5 sm:w-2 h-3 sm:h-4 bg-green-500 rounded-sm"></div>
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Payment Split</p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                <span className="text-xs text-blue-600">{analytics?.paymentMethodBreakdown?.online || 0} online</span>
                                <span className="text-xs text-green-600">{analytics?.paymentMethodBreakdown?.cash || 0} cash</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day-wise Analytics */}
            {dayWiseData && (
                <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Day-wise Revenue</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Mobile Card View */}
                        <div className="block sm:hidden">
                            {dayWiseData.dayWiseData.map((day: any, index: number) => (
                                <div key={day.date} className={`p-4 ${index !== dayWiseData.dayWiseData.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {new Date(day.date).toLocaleDateString('en-US', { 
                                                    weekday: 'short', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{day.totalTransactions} transactions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900 dark:text-white">₹{day.totalRevenue.toFixed(2)}</p>
                                            <p className="text-sm text-green-600">₹{day.payoutAmount.toFixed(2)} payout</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Processing Fees</p>
                                            <p className="text-orange-600">₹{day.processingFees.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Net Revenue</p>
                                            <p className="text-green-600">₹{day.netRevenue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            {day.onlineTransactions} online
                                        </span>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                            {day.cashTransactions} cash
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-4">Date</th>
                                        <th className="px-4 lg:px-6 py-4">Transactions</th>
                                        <th className="px-4 lg:px-6 py-4">Revenue</th>
                                        <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">Processing Fees</th>
                                        <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">Net Revenue</th>
                                        <th className="px-4 lg:px-6 py-4">Payout Amount</th>
                                        <th className="px-4 lg:px-6 py-4 hidden md:table-cell">Online/Cash</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 dark:text-gray-200">
                                    {dayWiseData.dayWiseData.map((day: any, index: number) => (
                                        <tr key={day.date} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 ${index === dayWiseData.dayWiseData.length - 1 ? 'border-b-0' : ''}`}>
                                            <td className="px-4 lg:px-6 py-4 font-medium">
                                                {new Date(day.date).toLocaleDateString('en-US', { 
                                                    weekday: 'short', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                })}
                                            </td>
                                            <td className="px-4 lg:px-6 py-4">{day.totalTransactions}</td>
                                            <td className="px-4 lg:px-6 py-4 font-semibold">₹{day.totalRevenue.toFixed(2)}</td>
                                            <td className="px-4 lg:px-6 py-4 text-orange-600 hidden lg:table-cell">₹{day.processingFees.toFixed(2)}</td>
                                            <td className="px-4 lg:px-6 py-4 font-semibold text-green-600 hidden lg:table-cell">₹{day.netRevenue.toFixed(2)}</td>
                                            <td className="px-4 lg:px-6 py-4 font-bold text-blue-600">₹{day.payoutAmount.toFixed(2)}</td>
                                            <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                        {day.onlineTransactions} online
                                                    </span>
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                        {day.cashTransactions} cash
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

            {/* Payout Requests */}
            {payoutRequests.length > 0 && (
                <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Payout Requests</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Mobile Card View */}
                        <div className="block lg:hidden">
                            {payoutRequests.map((payout, index) => {
                                const requestDate = payout.requestedAt?.toDate ? payout.requestedAt.toDate() : new Date(payout.requestedAt);
                                const startDate = payout.period.startDate?.toDate ? payout.period.startDate.toDate() : new Date(payout.period.startDate);
                                const endDate = payout.period.endDate?.toDate ? payout.period.endDate.toDate() : new Date(payout.period.endDate);
                                const processedDate = payout.processedAt?.toDate ? payout.processedAt.toDate() : null;
                                
                                return (
                                    <div key={payout.id} className={`p-4 ${index !== payoutRequests.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    ₹{payout.amount.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {requestDate.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                payout.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                                payout.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                                payout.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                            }`}>
                                                {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-400">Period</p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                            {payout.status === 'paid' && payout.paymentDetails?.utrNumber && (
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400">UTR Number</p>
                                                    <p className="font-mono text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded">
                                                        {payout.paymentDetails.utrNumber}
                                                    </p>
                                                </div>
                                            )}
                                            {processedDate && (
                                                <div>
                                                    <p className="text-gray-600 dark:text-gray-400">Processed Date</p>
                                                    <p className="text-gray-900 dark:text-white">
                                                        {processedDate.toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4">Request Date</th>
                                        <th className="px-6 py-4">Period</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">UTR Number</th>
                                        <th className="px-6 py-4">Processed Date</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 dark:text-gray-200">
                                    {payoutRequests.map((payout, index) => {
                                        const requestDate = payout.requestedAt?.toDate ? payout.requestedAt.toDate() : new Date(payout.requestedAt);
                                        const startDate = payout.period.startDate?.toDate ? payout.period.startDate.toDate() : new Date(payout.period.startDate);
                                        const endDate = payout.period.endDate?.toDate ? payout.period.endDate.toDate() : new Date(payout.period.endDate);
                                        const processedDate = payout.processedAt?.toDate ? payout.processedAt.toDate() : null;
                                        
                                        return (
                                            <tr key={payout.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 ${index === payoutRequests.length - 1 ? 'border-b-0' : ''}`}>
                                                <td className="px-6 py-4">
                                                    {requestDate.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 font-semibold">₹{payout.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        payout.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                                        payout.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                                        payout.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                    }`}>
                                                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {payout.status === 'paid' && payout.paymentDetails?.utrNumber ? (
                                                        <div>
                                                            <span className="font-mono text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-2 py-1 rounded">
                                                                {payout.paymentDetails.utrNumber}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {processedDate ? processedDate.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    }) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Stats - REMOVED (moved above) */}

            {/* Transactions Table */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Completed Transactions</h3>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        {/* Payment Method Filter */}
                        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            {['all', 'online', 'cash'].map((method) => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethodFilter(method)}
                                    className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                                        paymentMethodFilter === method
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    {method === 'all' ? 'All' : method === 'online' ? 'Online' : 'Cash'}
                                </button>
                            ))}
                        </div>
                        
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            />
                        </div>

                        {/* Export Button */}
                        <button 
                            onClick={exportTransactions}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {filteredTransactions.length === 0 ? (
                        <div className="px-4 sm:px-6 py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">No transactions found</p>
                                <p className="text-sm">
                                    {searchTerm 
                                        ? 'Try adjusting your search terms or time filter.'
                                        : 'Transactions will appear here once customers make payments.'
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View */}
                            <div className="block lg:hidden">
                                {filteredTransactions.map((transaction, index) => {
                                    const { date, time } = formatDate(transaction.createdAt);
                                    const customerName = `${transaction.customerInfo.firstName} ${transaction.customerInfo.lastName}`.trim();
                                    
                                    return (
                                        <div key={transaction.id} className={`p-4 ${index !== filteredTransactions.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        ₹{transaction.amount.toFixed(2)}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {customerName || 'Guest'}
                                                    </p>
                                                </div>
                                                <span className={getStatusBadge(transaction.paymentStatus)}>
                                                    {transaction.paymentStatus.charAt(0).toUpperCase() + transaction.paymentStatus.slice(1)}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Order ID</span>
                                                    <span className="font-mono text-xs">{transaction.orderId}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Date & Time</span>
                                                    <div className="text-right">
                                                        <div>{date}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
                                                    <span>{formatPaymentMethod(transaction.paymentMethod)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Processing Fee</span>
                                                    <span>₹{(transaction.processingFee || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
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
                                        {filteredTransactions.map((transaction, index) => {
                                            const { date, time } = formatDate(transaction.createdAt);
                                            const customerName = `${transaction.customerInfo.firstName} ${transaction.customerInfo.lastName}`.trim();
                                            
                                            return (
                                                <tr key={transaction.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 ${index === filteredTransactions.length - 1 ? 'border-b-0' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium">{date}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{time}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs">{transaction.orderId}</td>
                                                    <td className="px-6 py-4">{customerName || 'Guest'}</td>
                                                    <td className="px-6 py-4 font-semibold">₹{transaction.amount.toFixed(2)}</td>
                                                    <td className="px-6 py-4">{formatPaymentMethod(transaction.paymentMethod)}</td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">₹{(transaction.processingFee || 0).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={getStatusBadge(transaction.paymentStatus)}>
                                                            {transaction.paymentStatus.charAt(0).toUpperCase() + transaction.paymentStatus.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Payout Request Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                    Request Payout
                                </h3>
                                <button
                                    onClick={() => setShowPayoutModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">Payout Summary</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Period</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {timeFilter === 'today' ? 'Today' : timeFilter === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                                            <span className="text-gray-900 dark:text-white">₹{dayWiseData?.totals?.totalRevenue?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Processing Fees</span>
                                            <span className="text-gray-900 dark:text-white">₹{dayWiseData?.totals?.totalProcessingFees?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                            <div className="flex justify-between font-semibold">
                                                <span className="text-gray-900 dark:text-white">Payout Amount</span>
                                                <span className="text-green-600 dark:text-green-400">₹{dayWiseData?.totals?.totalPayoutAmount?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Payout Process</p>
                                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                                Your payout request will be reviewed by the super-admin. Once approved, the amount will be transferred to your registered account within 2-3 business days.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                                    <button
                                        onClick={() => setShowPayoutModal(false)}
                                        disabled={isCreatingPayout}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreatePayoutRequest}
                                        disabled={isCreatingPayout || 
                                                 !dayWiseData?.totals?.totalPayoutAmount || 
                                                 dayWiseData.totals.totalPayoutAmount <= 0 ||
                                                 !dayWiseData?.totals?.hasAvailableTransactions}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm font-medium"
                                    >
                                        {isCreatingPayout && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <span>
                                            {isCreatingPayout ? 'Creating...' : 'Request Payout'}
                                        </span>
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