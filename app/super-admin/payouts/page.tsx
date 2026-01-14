'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign,
    Check,
    X,
    Clock,
    Download,
    Search,
    Loader2,
    Eye
} from 'lucide-react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { 
    updatePayoutRequestStatus,
    PayoutRequest,
    getAllPaymentDetails,
    PaymentDetails
} from '@/app/(utils)/firebaseOperations';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/(utils)/firebase';

export default function SuperAdminPayoutsPage() {
    const { user } = useAuth();
    const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<PayoutRequest[]>([]);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');
    const [processingPayout, setProcessingPayout] = useState<string | null>(null);

    // Load payout requests in real-time
    useEffect(() => {
        if (!user) return;

        setIsLoading(true);
        const payoutsRef = collection(db, 'payoutRequests');
        const q = query(payoutsRef, orderBy('requestedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const payouts: PayoutRequest[] = [];
            querySnapshot.forEach((doc) => {
                payouts.push({ id: doc.id, ...doc.data() } as PayoutRequest);
            });
            setPayoutRequests(payouts);
            setIsLoading(false);
        }, (error) => {
            console.error('Error loading payout requests:', error);
            setError('Failed to load payout requests');
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Load payment details
    useEffect(() => {
        const loadPaymentDetails = async () => {
            try {
                const result = await getAllPaymentDetails();
                if (result.success && result.data) {
                    setPaymentDetails(result.data);
                }
            } catch (error) {
                console.error('Error loading payment details:', error);
            }
        };

        loadPaymentDetails();
    }, []);

    // Filter payout requests
    useEffect(() => {
        let filtered = payoutRequests;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(payout => payout.status === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(payout =>
                payout.restaurantName.toLowerCase().includes(searchLower) ||
                payout.adminName.toLowerCase().includes(searchLower) ||
                payout.adminEmail.toLowerCase().includes(searchLower) ||
                payout.id.toLowerCase().includes(searchLower)
            );
        }

        setFilteredRequests(filtered);
    }, [payoutRequests, statusFilter, searchTerm]);

    // Handle payout status update
    const handleStatusUpdate = async (
        payoutId: string, 
        status: PayoutRequest['status'], 
        notes?: string, 
        customPaymentDetails?: any
    ) => {
        if (!user) return;

        setProcessingPayout(payoutId);
        try {
            const paymentDetails = customPaymentDetails || (status === 'paid' ? {
                method: 'Bank Transfer',
                reference: `TXN${Date.now()}`,
                paidAt: new Date()
            } : undefined);

            const result = await updatePayoutRequestStatus(
                payoutId,
                status,
                user.uid,
                notes,
                paymentDetails
            );

            if (result.success) {
                alert(`Payout request ${status} successfully!`);
            } else {
                alert('Failed to update payout request: ' + result.error);
            }
        } catch (error: any) {
            alert('Error updating payout request: ' + error.message);
        } finally {
            setProcessingPayout(null);
        }
    };

    // Calculate statistics
    const stats = {
        total: payoutRequests.length,
        pending: payoutRequests.filter(p => p.status === 'pending').length,
        approved: payoutRequests.filter(p => p.status === 'approved').length,
        paid: payoutRequests.filter(p => p.status === 'paid').length,
        rejected: payoutRequests.filter(p => p.status === 'rejected').length,
        totalAmount: payoutRequests.reduce((sum, p) => sum + p.amount, 0),
        pendingAmount: payoutRequests.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'paid':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
            case 'approved':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
        }
    };

    const formatDate = (timestamp: any) => {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get payment details for a restaurant
    const getRestaurantPaymentDetails = (restaurantId: string) => {
        return paymentDetails.find(pd => pd.restaurantId === restaurantId);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">Loading payout requests...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Payout Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Manage restaurant payout requests and settlements.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalAmount.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Amount</p>
                            <p className="text-2xl font-bold text-orange-600">₹{stats.pendingAmount.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                            <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by restaurant, admin, or request ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'paid', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                statusFilter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payout Requests Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-4">Restaurant</th>
                                <th className="px-6 py-4">Admin</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Period</th>
                                <th className="px-6 py-4">Requested</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-800 dark:text-gray-200">
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="text-gray-500 dark:text-gray-400">
                                            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium mb-2">No payout requests found</p>
                                            <p className="text-sm">
                                                {searchTerm || statusFilter !== 'all'
                                                    ? 'Try adjusting your search or filter.'
                                                    : 'Payout requests will appear here when restaurants request payouts.'
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((payout, index) => {
                                    const requestDate = formatDate(payout.requestedAt);
                                    const startDate = payout.period.startDate?.toDate ? payout.period.startDate.toDate() : new Date(payout.period.startDate);
                                    const endDate = payout.period.endDate?.toDate ? payout.period.endDate.toDate() : new Date(payout.period.endDate);
                                    
                                    return (
                                        <tr key={payout.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all duration-200 ${index === filteredRequests.length - 1 ? 'border-b-0' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{payout.restaurantName}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{payout.restaurantId}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{payout.adminName}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{payout.adminEmail}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">₹{payout.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs">
                                                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{requestDate}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getStatusBadge(payout.status)}>
                                                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPayout(payout);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    
                                                    {payout.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(payout.id, 'approved')}
                                                                disabled={processingPayout === payout.id}
                                                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Approve"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(payout.id, 'rejected', 'Rejected by super admin')}
                                                                disabled={processingPayout === payout.id}
                                                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Reject"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {payout.status === 'approved' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPayout(payout);
                                                                setUtrNumber('');
                                                                setShowPaymentModal(true);
                                                            }}
                                                            disabled={processingPayout === payout.id}
                                                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedPayout && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Payout Request Details
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Restaurant</label>
                                        <p className="text-gray-900 dark:text-white font-medium">{selectedPayout.restaurantName}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin</label>
                                        <p className="text-gray-900 dark:text-white font-medium">{selectedPayout.adminName}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</label>
                                        <p className="text-gray-900 dark:text-white font-bold text-lg">₹{selectedPayout.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                                        <div className="mt-1">
                                            <span className={getStatusBadge(selectedPayout.status)}>
                                                {selectedPayout.status.charAt(0).toUpperCase() + selectedPayout.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Restaurant Payment Details */}
                                {(() => {
                                    const restaurantPaymentDetails = getRestaurantPaymentDetails(selectedPayout.restaurantId);
                                    return restaurantPaymentDetails ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-blue-800 dark:text-blue-200">Restaurant Payment Details</h4>
                                                {restaurantPaymentDetails.isVerified ? (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
                                                ) : (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Unverified</span>
                                                )}
                                            </div>
                                            
                                            {restaurantPaymentDetails.preferredMethod === 'bank' && restaurantPaymentDetails.bankDetails && (
                                                <div className="space-y-2 text-sm">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-blue-700 dark:text-blue-300">Account Holder:</span>
                                                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                                                {restaurantPaymentDetails.bankDetails.accountHolderName}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-700 dark:text-blue-300">Bank:</span>
                                                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                                                {restaurantPaymentDetails.bankDetails.bankName}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-700 dark:text-blue-300">Account Number:</span>
                                                            <p className="font-mono text-blue-900 dark:text-blue-100">
                                                                {restaurantPaymentDetails.bankDetails.accountNumber}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-700 dark:text-blue-300">IFSC Code:</span>
                                                            <p className="font-mono text-blue-900 dark:text-blue-100">
                                                                {restaurantPaymentDetails.bankDetails.ifscCode}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {restaurantPaymentDetails.preferredMethod === 'upi' && restaurantPaymentDetails.upiDetails && (
                                                <div className="space-y-2 text-sm">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-blue-700 dark:text-blue-300">UPI ID:</span>
                                                            <p className="font-mono text-blue-900 dark:text-blue-100">
                                                                {restaurantPaymentDetails.upiDetails.upiId}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-blue-700 dark:text-blue-300">Name:</span>
                                                            <p className="font-medium text-blue-900 dark:text-blue-100">
                                                                {restaurantPaymentDetails.upiDetails.upiName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ No Payment Details</h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                This restaurant hasn't configured their payment details yet. Ask them to add bank account or UPI details in their settings.
                                            </p>
                                        </div>
                                    );
                                })()}

                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction Count</label>
                                    <p className="text-gray-900 dark:text-white">{selectedPayout.transactionIds.length} transactions</p>
                                </div>

                                {selectedPayout.notes && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</label>
                                        <p className="text-gray-900 dark:text-white">{selectedPayout.notes}</p>
                                    </div>
                                )}

                                {selectedPayout.paymentDetails && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Payment Details</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-medium">Method:</span> {selectedPayout.paymentDetails.method}</p>
                                            <p><span className="font-medium">UTR Number:</span> {selectedPayout.paymentDetails.utrNumber || selectedPayout.paymentDetails.reference}</p>
                                            <p><span className="font-medium">Reference:</span> {selectedPayout.paymentDetails.reference}</p>
                                            <p><span className="font-medium">Paid At:</span> {formatDate(selectedPayout.paymentDetails.paidAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedPayout && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Mark Payout as Paid
                                </h3>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Payout Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Restaurant</span>
                                            <span className="text-gray-900 dark:text-white">{selectedPayout.restaurantName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Amount</span>
                                            <span className="text-gray-900 dark:text-white font-semibold">₹{selectedPayout.amount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        UTR/Transaction Number *
                                    </label>
                                    <input
                                        type="text"
                                        value={utrNumber}
                                        onChange={(e) => setUtrNumber(e.target.value)}
                                        placeholder="Enter UTR or transaction reference number"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        This will be shown to the restaurant admin as payment proof
                                    </p>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setShowPaymentModal(false)}
                                        disabled={processingPayout === selectedPayout.id}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!utrNumber.trim()) {
                                                alert('Please enter UTR/Transaction number');
                                                return;
                                            }
                                            
                                            const paymentDetails = {
                                                method: 'Bank Transfer',
                                                reference: utrNumber.trim(),
                                                utrNumber: utrNumber.trim(),
                                                paidAt: new Date()
                                            };
                                            
                                            await handleStatusUpdate(
                                                selectedPayout.id, 
                                                'paid', 
                                                `Paid via bank transfer. UTR: ${utrNumber.trim()}`,
                                                paymentDetails
                                            );
                                            setShowPaymentModal(false);
                                            setUtrNumber('');
                                        }}
                                        disabled={processingPayout === selectedPayout.id || !utrNumber.trim()}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                                    >
                                        {processingPayout === selectedPayout.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                        <span>
                                            {processingPayout === selectedPayout.id ? 'Processing...' : 'Mark as Paid'}
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