'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {
    Calendar,
    Clock,
    Users,
    Phone,
    Mail,
    MapPin,
    Filter,
    Search,
    Download,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreHorizontal,
    Edit,
    Trash2,
    MessageSquare,
    Star
} from 'lucide-react';
import {
    getRestaurantReservations,
    updateReservationStatus,
    cancelReservation,
    updateReservation,
    subscribeToRestaurantReservations,
    formatFirebaseTimestamp,
    ReservationData
} from '@/app/(utils)/firebaseOperations';

export default function ReservationsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('list');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('today');
    const [reservations, setReservations] = useState<ReservationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTableModal, setShowTableModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<ReservationData | null>(null);
    const [tableNumber, setTableNumber] = useState('');

    // Load reservations
    useEffect(() => {
        if (!user) return;

        const loadReservations = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Use the admin's UID as the restaurant ID
                const result = await getRestaurantReservations(user.uid);
                if (result.success) {
                    setReservations(result.data || []);
                } else {
                    setError(result.error || 'Failed to load reservations');
                }
            } catch (err) {
                console.error('Error loading reservations:', err);
                setError('Failed to load reservations');
            } finally {
                setIsLoading(false);
            }
        };

        loadReservations();

        // Set up real-time listener
        const unsubscribe = subscribeToRestaurantReservations(user.uid, (reservations) => {
            setReservations(reservations);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    // Sample reservation data (fallback)
    const sampleReservations = [
        {
            id: 'RES-001',
            customerName: 'Sophia Clark',
            email: 'sophia.clark@email.com',
            phone: '+1 (555) 123-4567',
            date: '2024-07-15',
            time: '7:00 PM',
            guests: 2,
            status: 'confirmed',
            specialRequest: 'Window seat, if possible.',
            tableNumber: 'T-12',
            createdAt: '2024-07-14 10:30 AM',
            notes: 'Regular customer, prefers quiet area'
        },
        {
            id: 'RES-002',
            customerName: 'Ethan Bennett',
            email: 'ethan.bennett@email.com',
            phone: '+1 (555) 234-5678',
            date: '2024-07-15',
            time: '7:30 PM',
            guests: 4,
            status: 'confirmed',
            specialRequest: 'Celebrating a birthday.',
            tableNumber: 'T-08',
            createdAt: '2024-07-14 2:15 PM',
            notes: 'Birthday celebration - arrange cake'
        },
        {
            id: 'RES-003',
            customerName: 'Olivia Carter',
            email: 'olivia.carter@email.com',
            phone: '+1 (555) 345-6789',
            date: '2024-07-15',
            time: '8:00 PM',
            guests: 3,
            status: 'pending',
            specialRequest: 'Vegetarian menu options needed.',
            tableNumber: null,
            createdAt: '2024-07-14 4:45 PM',
            notes: 'First time customer'
        },
        {
            id: 'RES-004',
            customerName: 'Noah Davis',
            email: 'noah.davis@email.com',
            phone: '+1 (555) 456-7890',
            date: '2024-07-15',
            time: '8:30 PM',
            guests: 2,
            status: 'cancelled',
            specialRequest: 'None',
            tableNumber: null,
            createdAt: '2024-07-14 11:20 AM',
            notes: 'Cancelled due to emergency'
        },
        {
            id: 'RES-005',
            customerName: 'Emma Wilson',
            email: 'emma.wilson@email.com',
            phone: '+1 (555) 567-8901',
            date: '2024-07-15',
            time: '6:30 PM',
            guests: 6,
            status: 'confirmed',
            specialRequest: 'High chair needed for toddler.',
            tableNumber: 'T-15',
            createdAt: '2024-07-13 9:00 AM',
            notes: 'Family with young children'
        }
    ];

    const getStatusBadge = (status: string) => {
        const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
        switch (status) {
            case 'confirmed':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
            case 'cancelled':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
            case 'completed':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'pending':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-blue-500" />;
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    const handleConfirmReservation = async (reservationId: string) => {
        try {
            const result = await updateReservationStatus(reservationId, 'confirmed');
            if (!result.success) {
                setError(result.error || 'Failed to confirm reservation');
            }
        } catch (err) {
            console.error('Error confirming reservation:', err);
            setError('Failed to confirm reservation');
        }
    };

    const handleDeclineReservation = async (reservationId: string) => {
        try {
            const result = await updateReservationStatus(reservationId, 'cancelled', 'Declined by restaurant');
            if (!result.success) {
                setError(result.error || 'Failed to decline reservation');
            }
        } catch (err) {
            console.error('Error declining reservation:', err);
            setError('Failed to decline reservation');
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        try {
            const result = await cancelReservation(reservationId, 'Cancelled by restaurant');
            if (!result.success) {
                setError(result.error || 'Failed to cancel reservation');
            }
        } catch (err) {
            console.error('Error cancelling reservation:', err);
            setError('Failed to cancel reservation');
        }
    };

    const handleAssignTable = async (reservationId: string, tableNumber: string) => {
        try {
            const reservation = reservations.find(r => r.id === reservationId);
            if (!reservation) return;

            const result = await updateReservation(reservationId, {
                reservationDetails: {
                    ...reservation.reservationDetails,
                    tableNumber: tableNumber
                }
            });
            if (!result.success) {
                setError(result.error || 'Failed to assign table');
            }
        } catch (err) {
            console.error('Error assigning table:', err);
            setError('Failed to assign table');
        }
    };

    const openTableModal = (reservation: ReservationData) => {
        setSelectedReservation(reservation);
        setTableNumber(reservation.reservationDetails.tableNumber || '');
        setShowTableModal(true);
    };

    const closeTableModal = () => {
        setShowTableModal(false);
        setSelectedReservation(null);
        setTableNumber('');
    };

    const submitTableAssignment = async () => {
        if (!selectedReservation || !tableNumber.trim()) return;
        
        await handleAssignTable(selectedReservation.id, tableNumber.trim());
        closeTableModal();
    };

    const filteredReservations = reservations.filter(reservation => {
        const matchesSearch = reservation.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const reservationStats = {
        total: reservations.length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        pending: reservations.filter(r => r.status === 'pending').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
        totalGuests: reservations.reduce((sum, r) => sum + r.reservationDetails.guests, 0)
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading reservations...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Reservations</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 font-light">
                    Manage your upcoming bookings with ease.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <div className="bg-background/70 p-4 sm:p-6 rounded-xl shadow-sm border border-foreground/5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{reservationStats.total}</p>
                        </div>
                        <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-background/70 p-4 sm:p-6 rounded-xl shadow-sm border border-foreground/5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Confirmed</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{reservationStats.confirmed}</p>
                        </div>
                        <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-background/70 p-4 sm:p-6 rounded-xl shadow-sm border border-foreground/5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{reservationStats.pending}</p>
                        </div>
                        <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                            <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-background/70 p-4 sm:p-6 rounded-xl shadow-sm border border-foreground/5 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Guests</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{reservationStats.totalGuests}</p>
                        </div>
                        <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                            <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="mb-8">
                <div className="flex flex-col gap-4 mb-6">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700 flex items-center gap-8">
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`py-3 text-sm font-medium transition-all duration-200 border-b-2 ${activeTab === 'calendar'
                                ? 'text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400'
                                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                                }`}
                        >
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Calendar
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`py-3 text-sm font-medium transition-all duration-200 border-b-2 ${activeTab === 'list'
                                ? 'text-orange-600 dark:text-orange-400 border-orange-600 dark:border-orange-400'
                                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                                }`}
                        >
                            List
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search reservations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                        >
                            <option value="all">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Export Button */}
                        <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors duration-200">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Reservations List */}
            <div className="space-y-6 animate-slide-in-from-bottom">
                {filteredReservations.map((reservation, index) => (
                    <div
                        key={reservation.id}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex flex-col lg:flex-row items-start gap-6">
                            {/* Main Info */}
                            <div className="flex-grow">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={getStatusBadge(reservation.status)}>
                                                {getStatusIcon(reservation.status)}
                                                <span className="ml-1 capitalize">{reservation.status}</span>
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {reservation.id}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {reservation.customerInfo.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{reservation.reservationDetails.time}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{reservation.reservationDetails.guests} Guests</span>
                                            </div>
                                            {reservation.reservationDetails.tableNumber && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>Table {reservation.reservationDetails.tableNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="relative">
                                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Mail className="h-4 w-4" />
                                        <span>{reservation.customerInfo.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Phone className="h-4 w-4" />
                                        <span>{reservation.customerInfo.phone}</span>
                                    </div>
                                </div>

                                {/* Special Request */}
                                {reservation.reservationDetails.specialRequests && reservation.reservationDetails.specialRequests !== 'None' && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Special Request:</span> {reservation.reservationDetails.specialRequests}
                                        </p>
                                    </div>
                                )}

                                {/* Notes */}
                                {reservation.notes && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">Notes:</span> {reservation.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Created At */}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Booked on {formatFirebaseTimestamp(reservation.createdAt)}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch gap-3">
                                {reservation.status === 'pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleConfirmReservation(reservation.id)}
                                            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Confirm
                                        </button>
                                        <button 
                                            onClick={() => handleDeclineReservation(reservation.id)}
                                            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Decline
                                        </button>
                                    </>
                                )}

                                {reservation.status === 'confirmed' && (
                                    <>
                                        <button 
                                            onClick={() => openTableModal(reservation)}
                                            className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <MapPin className="h-4 w-4" />
                                            {reservation.reservationDetails.tableNumber ? 'Change Table' : 'Assign Table'}
                                        </button>
                                        <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Contact
                                        </button>
                                        <button 
                                            onClick={() => handleCancelReservation(reservation.id)}
                                            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Cancel
                                        </button>
                                    </>
                                )}

                                {reservation.status === 'cancelled' && (
                                    <button className="px-4 py-2 text-sm font-medium bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Cancelled
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredReservations.length === 0 && (
                <div className="text-center py-12 animate-fade-in">
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reservations found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'No reservations have been made yet.'}
                    </p>
                </div>
            )}

            {/* Table Assignment Modal */}
            {showTableModal && selectedReservation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Assign Table
                            </h3>
                            <button
                                onClick={closeTableModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Reservation Details:</p>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedReservation.customerInfo.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedReservation.reservationDetails.date} at {selectedReservation.reservationDetails.time}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedReservation.reservationDetails.guests} guests
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Table Number
                            </label>
                            <input
                                type="text"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                placeholder="e.g., T-12, Table 5, A-3"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeTableModal}
                                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitTableAssignment}
                                disabled={!tableNumber.trim()}
                                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                            >
                                Assign Table
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}