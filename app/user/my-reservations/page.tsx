'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {
    getUserReservations,
    updateReservation,
    cancelReservation,
    subscribeToUserReservations,
    getRestaurantSettings,
    formatFirebaseTimestamp,
    ReservationData
} from '@/app/(utils)/firebaseOperations';

interface Reservation {
    id: string;
    date: string;
    time: string;
    guests: number;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show';
    specialRequests?: string;
    restaurantName: string;
    reservationId: string;
    tableNumber?: string;
    createdAt?: any;
    restaurantInfo?: any;
}

export default function MyReservationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [showModifyModal, setShowModifyModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [modifyForm, setModifyForm] = useState({
        date: '',
        time: '',
        guests: 2,
        specialRequests: ''
    });
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check authentication
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/user/login');
        }
    }, [user, authLoading, router]);

    // Load reservations from Firebase
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const loadReservations = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const result = await getUserReservations(user.uid);
                if (result.success && result.data) {
                    // Fetch restaurant information for each reservation
                    const reservationsWithRestaurantInfo = await Promise.all(
                        result.data.map(async (reservation: ReservationData) => {
                            try {
                                const restaurantResult = await getRestaurantSettings(reservation.restaurantId);
                                return {
                                    id: reservation.id,
                                    date: reservation.reservationDetails.date,
                                    time: reservation.reservationDetails.time,
                                    guests: reservation.reservationDetails.guests,
                                    status: reservation.status,
                                    specialRequests: reservation.reservationDetails.specialRequests,
                                    restaurantName: restaurantResult.success ? restaurantResult.data?.name || 'Unknown Restaurant' : 'Unknown Restaurant',
                                    reservationId: reservation.reservationId,
                                    tableNumber: reservation.reservationDetails.tableNumber,
                                    createdAt: reservation.createdAt,
                                    restaurantInfo: restaurantResult.success ? restaurantResult.data : null
                                };
                            } catch (err) {
                                console.error('Error fetching restaurant info:', err);
                                return {
                                    id: reservation.id,
                                    date: reservation.reservationDetails.date,
                                    time: reservation.reservationDetails.time,
                                    guests: reservation.reservationDetails.guests,
                                    status: reservation.status,
                                    specialRequests: reservation.reservationDetails.specialRequests,
                                    restaurantName: 'Unknown Restaurant',
                                    reservationId: reservation.reservationId,
                                    tableNumber: reservation.reservationDetails.tableNumber,
                                    createdAt: reservation.createdAt,
                                    restaurantInfo: null
                                };
                            }
                        })
                    );
                    
                    setReservations(reservationsWithRestaurantInfo);
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
        const unsubscribe = subscribeToUserReservations(user.uid, async (reservations) => {
            if (reservations.length > 0) {
                // Fetch restaurant information for each reservation
                const reservationsWithRestaurantInfo = await Promise.all(
                    reservations.map(async (reservation: ReservationData) => {
                        try {
                            const restaurantResult = await getRestaurantSettings(reservation.restaurantId);
                            return {
                                id: reservation.id,
                                date: reservation.reservationDetails.date,
                                time: reservation.reservationDetails.time,
                                guests: reservation.reservationDetails.guests,
                                status: reservation.status,
                                specialRequests: reservation.reservationDetails.specialRequests,
                                restaurantName: restaurantResult.success ? restaurantResult.data?.name || 'Unknown Restaurant' : 'Unknown Restaurant',
                                reservationId: reservation.reservationId,
                                tableNumber: reservation.reservationDetails.tableNumber,
                                createdAt: reservation.createdAt,
                                restaurantInfo: restaurantResult.success ? restaurantResult.data : null
                            };
                        } catch (err) {
                            console.error('Error fetching restaurant info:', err);
                            return {
                                id: reservation.id,
                                date: reservation.reservationDetails.date,
                                time: reservation.reservationDetails.time,
                                guests: reservation.reservationDetails.guests,
                                status: reservation.status,
                                specialRequests: reservation.reservationDetails.specialRequests,
                                restaurantName: 'Unknown Restaurant',
                                reservationId: reservation.reservationId,
                                tableNumber: reservation.reservationDetails.tableNumber,
                                createdAt: reservation.createdAt,
                                restaurantInfo: null
                            };
                        }
                    })
                );
                
                setReservations(reservationsWithRestaurantInfo);
            } else {
                setReservations([]);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const upcomingReservations = reservations.filter(r =>
        r.status === 'confirmed' || r.status === 'pending'
    );

    const pastReservations = reservations.filter(r =>
        r.status === 'completed' || r.status === 'cancelled'
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'completed':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'no-show':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'pending':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'cancelled':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'completed':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'no-show':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCreatedDate = (timestamp: any) => {
        return formatFirebaseTimestamp(timestamp);
    };

    const handleCancelReservation = async (reservationId: string) => {
        try {
            const result = await cancelReservation(reservationId, 'Cancelled by customer');
            if (!result.success) {
                setError(result.error || 'Failed to cancel reservation');
            }
        } catch (err) {
            console.error('Error cancelling reservation:', err);
            setError('Failed to cancel reservation');
        }
    };

    const handleModifyReservation = (reservationId: string) => {
        const reservation = reservations.find(r => r.id === reservationId);
        if (reservation) {
            setSelectedReservation(reservation);
            setModifyForm({
                date: reservation.date,
                time: reservation.time,
                guests: reservation.guests,
                specialRequests: reservation.specialRequests || ''
            });
            setShowModifyModal(true);
        }
    };

    const handleSaveModification = async () => {
        if (!selectedReservation) return;
        
        try {
            const updateData = {
                reservationDetails: {
                    date: modifyForm.date,
                    time: modifyForm.time,
                    guests: modifyForm.guests,
                    specialRequests: modifyForm.specialRequests || undefined,
                }
            };
            
            const result = await updateReservation(selectedReservation.id, updateData);
            if (result.success) {
        setShowModifyModal(false);
        setSelectedReservation(null);
            } else {
                setError(result.error || 'Failed to update reservation');
            }
        } catch (err) {
            console.error('Error updating reservation:', err);
            setError('Failed to update reservation');
        }
    };

    const timeSlots = [
        '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM',
        '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
        '9:00 PM', '9:30 PM'
    ];

    const currentReservations = activeTab === 'upcoming' ? upcomingReservations : pastReservations;

    // Show loading state while checking authentication
    if (authLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Authentication Required</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">You must be logged in to view your reservations.</p>
                    <button
                        onClick={() => router.push('/user/login')}
                        className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading your reservations...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                        My Reservations
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Manage your upcoming bookings and view your reservation history.
                    </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'upcoming'
                                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Upcoming ({upcomingReservations.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'past'
                                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Past Reservations ({pastReservations.length})
                        </button>
                    </div>
                </div>

                {/* Reservations List */}
                <div className="space-y-6">
                    {currentReservations.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {activeTab === 'upcoming' ? 'No upcoming reservations' : 'No past reservations'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {activeTab === 'upcoming'
                                    ? 'Ready to make your next reservation?'
                                    : 'Your completed reservations will appear here'
                                }
                            </p>
                            {activeTab === 'upcoming' && (
                                <button className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                                    Make a Reservation
                                </button>
                            )}
                        </div>
                    ) : (
                        currentReservations.map((reservation) => (
                            <div key={reservation.id} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                    {/* Reservation Details */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
                                                {getStatusIcon(reservation.status)}
                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                {reservation.reservationId}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {formatDate(reservation.date)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Time</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {reservation.time}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Guests</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Table Number Display */}
                                        {reservation.tableNumber && (
                                            <div className="mt-4">
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 rounded-xl text-sm font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Table {reservation.tableNumber}
                                                </div>
                                            </div>
                                        )}

                                        {/* Creation Date */}
                                        {reservation.createdAt && (
                                            <div className="mt-4">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Booked on {formatCreatedDate(reservation.createdAt)}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Restaurant</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {reservation.restaurantName}
                                            </p>
                                        </div>

                                        {reservation.specialRequests && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Special Requests</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {reservation.specialRequests}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-48">
                                        {reservation.status === 'confirmed' && (
                                            <>
                                                <button
                                                    onClick={() => handleModifyReservation(reservation.id)}
                                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                                                >
                                                    Modify
                                                </button>
                                                <button
                                                    onClick={() => handleCancelReservation(reservation.id)}
                                                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {reservation.status === 'pending' && (
                                            <>
                                                <button className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-xl font-medium cursor-not-allowed">
                                                    Awaiting Confirmation
                                                </button>
                                                <button
                                                    onClick={() => handleCancelReservation(reservation.id)}
                                                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {reservation.status === 'completed' && (
                                            <>
                                                <button className="px-4 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                                                    Book Again
                                                </button>
                                                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105">
                                                    Leave Review
                                                </button>
                                            </>
                                        )}

                                        {reservation.status === 'cancelled' && (
                                            <button className="px-4 py-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                                                Book Again
                                            </button>
                                        )}

                                        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick Actions */}
                {currentReservations.length > 0 && (
                    <div className="mt-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Ready for your next dining experience?</h3>
                                <p className="text-blue-100">
                                    Book your table now and enjoy our exceptional cuisine and service.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                                    Make New Reservation
                                </button>
                                <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                                    View Menu
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modify Reservation Modal */}
                {showModifyModal && selectedReservation && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Modify Reservation
                                    </h3>
                                    <button
                                        onClick={() => setShowModifyModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                    >
                                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-mono">
                                    Reservation ID: {selectedReservation.reservationId}
                                </p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Current Reservation Info */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Current Reservation</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Date:</span>
                                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                {formatDate(selectedReservation.date)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Time:</span>
                                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                {selectedReservation.time}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Guests:</span>
                                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                                {selectedReservation.guests}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReservation.status)}`}>
                                                {selectedReservation.status.charAt(0).toUpperCase() + selectedReservation.status.slice(1)}
                                            </span>
                                        </div>
                                        {selectedReservation.tableNumber && (
                                            <div className="col-span-2">
                                                <span className="text-gray-600 dark:text-gray-400">Table:</span>
                                                <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 rounded-full text-xs font-medium">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {selectedReservation.tableNumber}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Modification Form */}
                                <div className="space-y-6">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">Update Details</h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Date
                                            </label>
                                            <input
                                                type="date"
                                                value={modifyForm.date}
                                                onChange={(e) => setModifyForm({ ...modifyForm, date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Time
                                            </label>
                                            <select
                                                value={modifyForm.time}
                                                onChange={(e) => setModifyForm({ ...modifyForm, time: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200"
                                            >
                                                {timeSlots.map((time) => (
                                                    <option key={time} value={time}>{time}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Number of Guests
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setModifyForm({ ...modifyForm, guests: Math.max(1, modifyForm.guests - 1) })}
                                                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-105"
                                            >
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                </svg>
                                            </button>
                                            <span className="text-2xl font-bold text-gray-900 dark:text-white min-w-[3rem] text-center">
                                                {modifyForm.guests}
                                            </span>
                                            <button
                                                onClick={() => setModifyForm({ ...modifyForm, guests: Math.min(12, modifyForm.guests + 1) })}
                                                className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all duration-200 hover:scale-105"
                                            >
                                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                                                {modifyForm.guests === 1 ? 'guest' : 'guests'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Special Requests
                                        </label>
                                        <textarea
                                            value={modifyForm.specialRequests}
                                            onChange={(e) => setModifyForm({ ...modifyForm, specialRequests: e.target.value })}
                                            placeholder="Any special requests or dietary requirements..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Availability Check */}
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-800 dark:text-green-300">Available!</p>
                                            <p className="text-sm text-green-700 dark:text-green-400">
                                                We can accommodate your updated reservation request.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Policy Notice */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Modification Policy</p>
                                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                                Reservations can be modified up to 2 hours before your scheduled time.
                                                Changes are subject to availability and may require reconfirmation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowModifyModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveModification}
                                    className="flex-1 px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    </div>
    );
}