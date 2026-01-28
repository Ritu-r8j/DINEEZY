'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {
    getUserReservations,
    updateReservation,
    cancelReservation,
    subscribeToUserReservations,
    getRestaurantSettings,
    formatFirebaseTimestamp,
    ReservationData,
    getOrdersByReservation,
    OrderData
} from '@/app/(utils)/firebaseOperations';

interface Reservation {
    id: string;
    date: string;
    time: string;
    guests: number;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show';
    specialRequests?: string;
    notes?: string; // Admin instructions when confirming reservation
    restaurantName: string;
    reservationId: string;
    tableNumber?: string;
    createdAt?: any;
    restaurantInfo?: any;
    orders?: OrderData[]; // Pre-orders linked to this reservation
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
    const [expandedReservation, setExpandedReservation] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedReservationForDetails, setSelectedReservationForDetails] = useState<Reservation | null>(null);

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
                    // Fetch restaurant information and orders for each reservation
                    const reservationsWithRestaurantInfo = await Promise.all(
                        result.data.map(async (reservation: ReservationData) => {
                            try {
                                const [restaurantResult, ordersResult] = await Promise.all([
                                    getRestaurantSettings(reservation.restaurantId),
                                    getOrdersByReservation(reservation.id)
                                ]);
                                
                                return {
                                    id: reservation.id,
                                    date: reservation.reservationDetails.date,
                                    time: reservation.reservationDetails.time,
                                    guests: reservation.reservationDetails.guests,
                                    status: reservation.status,
                                    specialRequests: reservation.reservationDetails.specialRequests,
                                    notes: reservation.notes, // Admin instructions
                                    restaurantName: restaurantResult.success ? restaurantResult.data?.name || 'Unknown Restaurant' : 'Unknown Restaurant',
                                    reservationId: reservation.reservationId,
                                    tableNumber: reservation.reservationDetails.tableNumber,
                                    createdAt: reservation.createdAt,
                                    restaurantInfo: restaurantResult.success ? { ...restaurantResult.data, id: reservation.restaurantId } : { id: reservation.restaurantId },
                                    orders: ordersResult.success ? ordersResult.data : []
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
                                    notes: reservation.notes, // Admin instructions
                                    restaurantName: 'Unknown Restaurant',
                                    reservationId: reservation.reservationId,
                                    tableNumber: reservation.reservationDetails.tableNumber,
                                    createdAt: reservation.createdAt,
                                    restaurantInfo: { id: reservation.restaurantId },
                                    orders: []
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
                // Fetch restaurant information and orders for each reservation
                const reservationsWithRestaurantInfo = await Promise.all(
                    reservations.map(async (reservation: ReservationData) => {
                        try {
                            const [restaurantResult, ordersResult] = await Promise.all([
                                getRestaurantSettings(reservation.restaurantId),
                                getOrdersByReservation(reservation.id)
                            ]);
                            
                            return {
                                id: reservation.id,
                                date: reservation.reservationDetails.date,
                                time: reservation.reservationDetails.time,
                                guests: reservation.reservationDetails.guests,
                                status: reservation.status,
                                specialRequests: reservation.reservationDetails.specialRequests,
                                notes: reservation.notes, // Admin instructions
                                restaurantName: restaurantResult.success ? restaurantResult.data?.name || 'Unknown Restaurant' : 'Unknown Restaurant',
                                reservationId: reservation.reservationId,
                                tableNumber: reservation.reservationDetails.tableNumber,
                                createdAt: reservation.createdAt,
                                restaurantInfo: restaurantResult.success ? { ...restaurantResult.data, id: reservation.restaurantId } : { id: reservation.restaurantId },
                                orders: ordersResult.success ? ordersResult.data : []
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
                                notes: reservation.notes, // Admin instructions
                                restaurantName: 'Unknown Restaurant',
                                reservationId: reservation.reservationId,
                                tableNumber: reservation.reservationDetails.tableNumber,
                                createdAt: reservation.createdAt,
                                restaurantInfo: { id: reservation.restaurantId },
                                orders: []
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                My Reservations
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                Manage your upcoming bookings and view your reservation history.
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Link href="/user/reservation">
                                <button className="cursor-pointer px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2">
                                   
                                    Make New Reservation
                                </button>
                            </Link>
                        </div>
                    </div>
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
                                <button onClick={()=> router.push("/user/reservation")} className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 hover:scale-105">
                                    Make a Reservation
                                </button>
                            )}
                        </div>
                    ) : (
                        currentReservations.map((reservation) => (
                            <div key={reservation.id} className="rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-sm transition-all duration-300 hover:shadow-lg dark:hover:border-primary/20 overflow-hidden p-6">
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

                                        {/* Admin Instructions Display */}
                                        {reservation.notes && reservation.status === 'confirmed' && (
                                            <div className="mt-4">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                                                Message from Restaurant
                                                            </h4>
                                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                                {reservation.notes}
                                                            </p>
                                                        </div>
                                                    </div>
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
                                            <div className="bg-gray-50 dark:bg-gray-800/70 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Special Requests</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {reservation.specialRequests}
                                                </p>
                                            </div>
                                        )}

                                        {/* Pre-Orders Section */}
                                        {reservation.orders && reservation.orders.length > 0 && (
                                            <div className="mt-4">
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                                            Pre-Order Placed ({reservation.orders.length})
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {reservation.orders.map((order) => (
                                                            <div key={order.id} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-green-100 dark:border-green-800/50">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                                                        {order.orderId}
                                                                    </p>
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                        order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready'
                                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                            : order.status === 'pending'
                                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                            : order.status === 'delivered'
                                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                                    }`}>
                                                                        {order.status}
                                                                    </span>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {order.items.slice(0, 3).map((item, idx) => (
                                                                        <div key={idx} className="text-xs">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-gray-700 dark:text-gray-300">
                                                                                    {item.quantity}x {item.name}
                                                                                    {item.selectedVariant && (
                                                                                        <span className="text-gray-500 ml-1">({item.selectedVariant.name})</span>
                                                                                    )}
                                                                                </span>
                                                                                <span className="text-gray-600 dark:text-gray-400">
                                                                                    ₹{((item.customPrice || item.price) * item.quantity).toFixed(2)}
                                                                                </span>
                                                                            </div>
                                                                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                                                <div className="text-gray-500 ml-4 mt-0.5">
                                                                                    + {item.selectedAddons.map(addon => addon.name).join(', ')}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {order.items.length > 3 && (
                                                                        <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                                                            +{order.items.length - 3} more items
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t border-green-100 dark:border-green-800/50 flex items-center justify-between">
                                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</span>
                                                                    <span className="text-sm font-bold text-green-700 dark:text-green-400">
                                                                        ₹{order.total.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedReservation(expandedReservation === reservation.id ? null : reservation.id)}
                                                        className="mt-3 w-full text-xs text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium transition-colors"
                                                    >
                                                        {expandedReservation === reservation.id ? 'Show Less' : 'View All Orders'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className=" flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-48">
                                        {reservation.status === 'confirmed' && (
                                            <>
                                                {/* Only show Pre-Order button if no orders have been placed */}
                                                {(!reservation.orders || reservation.orders.length === 0) && (
                                                    <button
                                                        onClick={() => {
                                                            // Store reservation ID in localStorage for pre-order context
                                                            localStorage.setItem('preOrderReservationId', reservation.id);
                                                            localStorage.setItem('preOrderRestaurantId', reservation.restaurantInfo?.id || '');
                                                            router.push(`/user/menu/${reservation.restaurantInfo?.id || ''}`);
                                                        }}
                                                        className="cursor-pointer px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-xl font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        Pre-Order
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleModifyReservation(reservation.id)}
                                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                                                >
                                                    Modify
                                                </button>
                                                <button
                                                    onClick={() => handleCancelReservation(reservation.id)}
                                                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {reservation.status === 'pending' && (
                                            <>
                                                {/* Only show Pre-Order button if no orders have been placed */}
                                                {(!reservation.orders || reservation.orders.length === 0) && (
                                                    <button
                                                        onClick={() => {
                                                            localStorage.setItem('preOrderReservationId', reservation.id);
                                                            localStorage.setItem('preOrderRestaurantId', reservation.restaurantInfo?.id || '');
                                                            router.push(`/user/menu/${reservation.restaurantInfo?.id || ''}`);
                                                        }}
                                                        className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-xl font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        Pre-Order
                                                    </button>
                                                )}
                                                <button className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-xl font-medium cursor-not-allowed">
                                                    Awaiting Confirmation
                                                </button>
                                                <button
                                                    onClick={() => handleCancelReservation(reservation.id)}
                                                    className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105"
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

                                        <button 
                                            onClick={() => {
                                                setSelectedReservationForDetails(reservation);
                                                setShowDetailsModal(true);
                                            }}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                                        >
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
                    <div className="mt-12 bg-card border border-border rounded-2xl shadow-lg p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                                    Ready for your next dining experience?
                                </h3>
                                <p className="text-sm sm:text-base text-muted-foreground">
                                    Book your table now and enjoy our exceptional cuisine and service.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <button 
                                    onClick={() => router.push('/user/reservation')}
                                    className="cursor-pointer px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-sm"
                                >
                                    Make New Reservation
                                </button>
                                <button 
                                    onClick={() => router.push('/user/menu')}
                                    className="cursor-pointer px-5 py-2.5 bg-white dark:bg-card text-foreground rounded-lg font-semibold text-sm border-2 border-border hover:border-primary transition-all duration-200 hover:scale-105 shadow-sm"
                                >
                                    View Menu
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modify Reservation Modal */}
                {showModifyModal && selectedReservation && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="rounded-2xl border border-gray-200 dark:border-foreground/5 bg-white dark:bg-background/70 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                                <div className="bg-gray-50 dark:bg-gray-800/70 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
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
                                        {selectedReservation.notes && selectedReservation.status === 'confirmed' && (
                                            <div className="col-span-2">
                                                <span className="text-gray-600 dark:text-gray-400">Restaurant Message:</span>
                                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                                        {selectedReservation.notes}
                                                    </p>
                                                </div>
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
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Time
                                            </label>
                                            <select
                                                value={modifyForm.time}
                                                onChange={(e) => setModifyForm({ ...modifyForm, time: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200"
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
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all duration-200 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Availability Check */}
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
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

            {/* Reservation Details Modal */}
            {showDetailsModal && selectedReservationForDetails && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowDetailsModal(false)}
                    />
                    
                    {/* Modal */}
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-4xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-zinc-900 dark:to-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reservation Details</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">ID: {selectedReservationForDetails.reservationId}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedReservationForDetails.status)}`}>
                                            {getStatusIcon(selectedReservationForDetails.status)}
                                            {selectedReservationForDetails.status.charAt(0).toUpperCase() + selectedReservationForDetails.status.slice(1)}
                                        </span>
                                        <button
                                            onClick={() => setShowDetailsModal(false)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Main Content - Left Side */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Reservation Information */}
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Reservation Information
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {formatDate(selectedReservationForDetails.date)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {selectedReservationForDetails.time}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Number of Guests</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {selectedReservationForDetails.guests} {selectedReservationForDetails.guests === 1 ? 'guest' : 'guests'}
                                                    </p>
                                                </div>
                                                {selectedReservationForDetails.tableNumber && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Table Number</p>
                                                        <p className="font-semibold text-purple-600 dark:text-purple-400">
                                                            Table {selectedReservationForDetails.tableNumber}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {selectedReservationForDetails.createdAt && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Booked on {formatCreatedDate(selectedReservationForDetails.createdAt)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Restaurant Information */}
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                Restaurant Details
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Restaurant Name</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                                        {selectedReservationForDetails.restaurantName}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Special Requests */}
                                        {selectedReservationForDetails.specialRequests && (
                                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 p-5">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                    </svg>
                                                    Special Requests
                                                </h3>
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {selectedReservationForDetails.specialRequests}
                                                </p>
                                            </div>
                                        )}

                                        {/* Pre-Orders */}
                                        {selectedReservationForDetails.orders && selectedReservationForDetails.orders.length > 0 && (
                                            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5">
                                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Pre-Orders ({selectedReservationForDetails.orders.length})
                                                </h3>
                                                <div className="space-y-4">
                                                    {selectedReservationForDetails.orders.map((order) => (
                                                        <div key={order.id} className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-green-100 dark:border-green-800/50">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                                                                    {order.orderId}
                                                                </p>
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                    order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready'
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                        : order.status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                        : order.status === 'delivered'
                                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                                }`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex items-start gap-3">
                                                                        <img
                                                                            src={item.image || '/placeholder-food.jpg'}
                                                                            alt={item.name}
                                                                            className="w-12 h-12 rounded-lg object-cover"
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                                    {item.quantity}x {item.name}
                                                                                    {item.selectedVariant && (
                                                                                        <span className="text-xs text-gray-500 ml-1">({item.selectedVariant.name})</span>
                                                                                    )}
                                                                                </p>
                                                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                                                    ₹{((item.customPrice || item.price) * item.quantity).toFixed(2)}
                                                                                </p>
                                                                            </div>
                                                                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                                    + {item.selectedAddons.map(addon => addon.name).join(', ')}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800/50 flex items-center justify-between">
                                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Order Total</span>
                                                                <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                                                    ₹{order.total.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sidebar - Right Side */}
                                    <div className="space-y-6">
                                        {/* Quick Info Card */}
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-5">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Quick Info</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                            {new Date(selectedReservationForDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {selectedReservationForDetails.time}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Party Size</p>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                            {selectedReservationForDetails.guests} {selectedReservationForDetails.guests === 1 ? 'guest' : 'guests'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedReservationForDetails.tableNumber && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Table</p>
                                                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                                Table {selectedReservationForDetails.tableNumber}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {selectedReservationForDetails.status === 'confirmed' && (
                                            <div className="space-y-3">
                                                {(!selectedReservationForDetails.orders || selectedReservationForDetails.orders.length === 0) && (
                                                    <button
                                                        onClick={() => {
                                                            localStorage.setItem('preOrderReservationId', selectedReservationForDetails.id);
                                                            localStorage.setItem('preOrderRestaurantId', selectedReservationForDetails.restaurantInfo?.id || '');
                                                            router.push(`/user/menu/${selectedReservationForDetails.restaurantInfo?.id || ''}`);
                                                        }}
                                                        className="w-full px-4 py-3 bg-green-600 dark:bg-green-700 text-white rounded-xl font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        Pre-Order Food
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setShowDetailsModal(false);
                                                        handleModifyReservation(selectedReservationForDetails.id);
                                                    }}
                                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                                                >
                                                    Modify Reservation
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowDetailsModal(false);
                                                        handleCancelReservation(selectedReservationForDetails.id);
                                                    }}
                                                    className="w-full px-4 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105"
                                                >
                                                    Cancel Reservation
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
    </div>
    );
}