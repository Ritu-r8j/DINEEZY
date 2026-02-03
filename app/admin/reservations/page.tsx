'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import {
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
    MapPin,
    Download,
    Clock,
    Eye,
    LayoutGrid,
    ShoppingCart,
    X
} from 'lucide-react';
import {
    getRestaurantReservations,
    updateReservationStatus,
    updateOrdersByReservation,
    cancelReservation,
    updateReservation,
    subscribeToRestaurantReservations,
    getRestaurantSettings,
    ReservationData,
    RestaurantSettings,
    getOrdersByReservation,
    OrderData
} from '@/app/(utils)/firebaseOperations';

// Import components
import StatsCard from './components/StatsCard';
import DateNavigation from './components/DateNavigation';
import ReservationCard from './components/ReservationCard';
import TableAssignmentModal from './components/TableAssignmentModal';
import DetailsModal from './components/DetailsModal';
import TableManagementView from './components/TableManagementView';

type ViewMode = 'list' | 'grid' | 'timeline' | 'tables';

export default function ReservationsPage() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [reservations, setReservations] = useState<ReservationData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTableModal, setShowTableModal] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<ReservationData | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null);
    const [reservationOrders, setReservationOrders] = useState<Record<string, OrderData[]>>({});
    
    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [reservationToConfirm, setReservationToConfirm] = useState<ReservationData | null>(null);
    const [confirmationInstructions, setConfirmationInstructions] = useState('');

    // Load reservations and restaurant settings
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Load reservations
                const reservationsResult = await getRestaurantReservations(user.uid);
                if (reservationsResult.success) {
                    const reservationsData = reservationsResult.data || [];
                    setReservations(reservationsData);
                    
                    // Load orders for each reservation
                    const ordersMap: Record<string, OrderData[]> = {};
                    await Promise.all(
                        reservationsData.map(async (reservation) => {
                            const ordersResult = await getOrdersByReservation(reservation.id);
                            if (ordersResult.success && ordersResult.data) {
                                ordersMap[reservation.id] = ordersResult.data;
                            }
                        })
                    );
                    setReservationOrders(ordersMap);
                } else {
                    setError(reservationsResult.error || 'Failed to load reservations');
                }

                // Load restaurant settings (for tables)
                const settingsResult = await getRestaurantSettings(user.uid);
                if (settingsResult.success && settingsResult.data) {
                    setRestaurantSettings(settingsResult.data);
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();

        const unsubscribe = subscribeToRestaurantReservations(user.uid, async (reservations) => {
            setReservations(reservations);
            
            // Load orders for updated reservations
            const ordersMap: Record<string, OrderData[]> = {};
            await Promise.all(
                reservations.map(async (reservation) => {
                    const ordersResult = await getOrdersByReservation(reservation.id);
                    if (ordersResult.success && ordersResult.data) {
                        ordersMap[reservation.id] = ordersResult.data;
                    }
                })
            );
            setReservationOrders(ordersMap);
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    // Filter reservations
    const filteredReservations = reservations.filter(reservation => {
        const matchesSearch = reservation.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.reservationId.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = activeTab === 'all' || reservation.status === activeTab;
        const matchesDate = reservation.reservationDetails.date === selectedDate;
        
        return matchesSearch && matchesStatus && matchesDate;
    });

    // Calculate statistics
    const stats = {
        total: filteredReservations.length,
        confirmed: filteredReservations.filter(r => r.status === 'confirmed').length,
        pending: filteredReservations.filter(r => r.status === 'pending').length,
        cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
        completed: filteredReservations.filter(r => r.status === 'completed').length,
        totalGuests: filteredReservations.reduce((sum, r) => sum + r.reservationDetails.guests, 0),
        tablesAssigned: filteredReservations.filter(r => r.reservationDetails.tableNumber).length
    };

    // Helper functions
    const getStatusBadge = (status: string) => {
        const baseClasses = "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold";
        switch (status) {
            case 'confirmed':
                return `${baseClasses} bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`;
            case 'pending':
                return `${baseClasses} bg-amber-500/10 text-amber-500 border border-amber-500/20`;
            case 'cancelled':
                return `${baseClasses} bg-red-500/10 text-red-500 border border-red-500/20`;
            case 'completed':
                return `${baseClasses} bg-blue-500/10 text-blue-500 border border-blue-500/20`;
            default:
                return `${baseClasses} bg-gray-500/10 text-gray-400 border border-gray-500/20`;
        }
    };

    const getStatusIcon = (status: string) => {
        const iconClass = "h-3.5 w-3.5";
        switch (status) {
            case 'confirmed':
                return <CheckCircle className={`${iconClass} text-white`} />;
            case 'pending':
                return <AlertCircle className={`${iconClass} text-white`} />;
            case 'cancelled':
                return <XCircle className={`${iconClass} text-white`} />;
            case 'completed':
                return <CheckCircle className={`${iconClass} text-white`} />;
            default:
                return <AlertCircle className={`${iconClass} text-white`} />;
        }
    };

    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch {
            return time;
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Action handlers
    const handleConfirmReservation = async (reservationId: string) => {
        const reservation = reservations.find(r => r.id === reservationId);
        if (reservation) {
            setReservationToConfirm(reservation);
            setConfirmationInstructions('');
            setShowConfirmModal(true);
        }
    };
    
    const handleConfirmWithInstructions = async () => {
        if (!reservationToConfirm) return;
        
        try {
            // First, confirm the reservation
            const result = await updateReservationStatus(
                reservationToConfirm.id, 
                'confirmed', 
                confirmationInstructions || undefined
            );
            
            if (!result.success) {
                setError(result.error || 'Failed to confirm reservation');
                return;
            }

            // Then, confirm any linked pre-orders
            const orderUpdateResult = await updateOrdersByReservation(
                reservationToConfirm.id, 
                'confirmed'
            );

            if (!orderUpdateResult.success) {
                console.error('Failed to update linked orders:', orderUpdateResult.error);
                // Don't fail the whole operation, just log the error
                // The reservation is still confirmed successfully
            } else if (orderUpdateResult.updatedCount > 0) {
                console.log(`Successfully confirmed ${orderUpdateResult.updatedCount} linked pre-order(s)`);
            }

            // Success - close modal and reset state
            setShowConfirmModal(false);
            setReservationToConfirm(null);
            setConfirmationInstructions('');
            
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

    const handleAssignTable = async (tableNumber: string) => {
        if (!selectedReservation) return;
        
        try {
            const result = await updateReservation(selectedReservation.id, {
                reservationDetails: {
                    ...selectedReservation.reservationDetails,
                    tableNumber: tableNumber
                }
            });
            if (result.success) {
                setShowTableModal(false);
                setSelectedReservation(null);
            } else {
                setError(result.error || 'Failed to assign table');
            }
        } catch (err) {
            console.error('Error assigning table:', err);
            setError('Failed to assign table');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading reservations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white">
            <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Reservations</h1>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                Manage your upcoming bookings with ease.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs sm:text-sm font-medium border border-gray-700 transition-all">
                                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                    <StatsCard
                        label="Total"
                        value={stats.total}
                        subtext="reservations"
                        icon={Calendar}
                        color="blue"
                        isActive={activeTab === 'all'}
                        onClick={() => setActiveTab('all')}
                    />
                    <StatsCard
                        label="Pending"
                        value={stats.pending}
                        subtext="need action"
                        icon={AlertCircle}
                        color="amber"
                        isActive={activeTab === 'pending'}
                        onClick={() => setActiveTab('pending')}
                    />
                    <StatsCard
                        label="Confirmed"
                        value={stats.confirmed}
                        subtext="confirmed"
                        icon={CheckCircle}
                        color="emerald"
                        isActive={activeTab === 'confirmed'}
                        onClick={() => setActiveTab('confirmed')}
                    />
                    <StatsCard
                        label="Completed"
                        value={stats.completed}
                        subtext="finished"
                        icon={CheckCircle}
                        color="blue"
                        isActive={activeTab === 'completed'}
                        onClick={() => setActiveTab('completed')}
                    />
                    <StatsCard
                        label="Cancelled"
                        value={stats.cancelled}
                        subtext="cancelled"
                        icon={XCircle}
                        color="red"
                        isActive={activeTab === 'cancelled'}
                        onClick={() => setActiveTab('cancelled')}
                    />
                    <StatsCard label="Guests" value={stats.totalGuests} subtext="total guests" icon={Users} color="purple" />
                    <StatsCard label="Tables" value={stats.tablesAssigned} subtext="assigned" icon={MapPin} color="pink" />
                </div>

                {/* Date Navigation */}
                <DateNavigation
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    formatDate={formatDate}
                    stats={stats}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                {/* Empty State */}
                {filteredReservations.length === 0 && (
                    <div className="bg-[#151d2f]  border border-gray-800 p-8 sm:p-12 text-center">
                        <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No reservations found</h3>
                        <p className="text-sm sm:text-base text-gray-400">
                            {searchTerm
                                ? 'Try adjusting your search criteria.'
                                : `No reservations for ${formatDate(selectedDate)}.`}
                        </p>
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && filteredReservations.length > 0 && (
                    <div className="space-y-2 sm:space-y-3">
                        {filteredReservations.map((reservation) => (
                            <ReservationCard
                                key={reservation.id}
                                reservation={reservation}
                                orders={reservationOrders[reservation.id] || []}
                                formatTime={formatTime}
                                getStatusBadge={getStatusBadge}
                                getStatusIcon={getStatusIcon}
                                onConfirm={handleConfirmReservation}
                                onDecline={handleDeclineReservation}
                                onAssignTable={(res) => {
                                    setSelectedReservation(res);
                                    setShowTableModal(true);
                                }}
                                onViewDetails={(res) => {
                                    setSelectedReservation(res);
                                    setShowDetailsModal(true);
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Grid View */}
                {viewMode === 'grid' && filteredReservations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {filteredReservations.map((reservation) => (
                            <div
                                key={reservation.id}
                                className="bg-[#151d2f] rounded-lg sm:rounded-xl border border-gray-800 hover:border-gray-700 transition-all p-4 sm:p-5"
                            >
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                                            {reservation.customerInfo.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                                                {reservation.customerInfo.name}
                                            </h3>
                                            <p className="text-[10px] sm:text-xs text-gray-400 font-mono truncate">
                                                {reservation.reservationId}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={getStatusBadge(reservation.status)}>
                                        {getStatusIcon(reservation.status)}
                                        <span className="ml-1 hidden sm:inline">{reservation.status}</span>
                                    </span>
                                </div>

                                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 flex-shrink-0" />
                                        <span>{formatTime(reservation.reservationDetails.time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 flex-shrink-0" />
                                        <span>{reservation.reservationDetails.guests} guests</span>
                                    </div>
                                    {reservation.reservationDetails.tableNumber && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                            <span>Table {reservation.reservationDetails.tableNumber}</span>
                                        </div>
                                    )}
                                    {reservationOrders[reservation.id] && reservationOrders[reservation.id].length > 0 && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 font-medium">
                                            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                            <span>{reservationOrders[reservation.id].length} Pre-order{reservationOrders[reservation.id].length !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </div>

                                {reservation.reservationDetails.specialRequests && (
                                    <div className="mb-3 sm:mb-4 text-[10px] sm:text-xs text-gray-400 bg-gray-800/50 rounded px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700/50">
                                        <span className="text-amber-400 font-medium">Note:</span>{' '}
                                        {reservation.reservationDetails.specialRequests}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {reservation.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleConfirmReservation(reservation.id)}
                                                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => handleDeclineReservation(reservation.id)}
                                                className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-red-500/20"
                                            >
                                                Decline
                                            </button>
                                        </>
                                    )}
                                    {reservation.status === 'confirmed' && !reservation.reservationDetails.tableNumber && (
                                        <button
                                            onClick={() => {
                                                setSelectedReservation(reservation);
                                                setShowTableModal(true);
                                            }}
                                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                                        >
                                            Assign Table
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSelectedReservation(reservation);
                                            setShowDetailsModal(true);
                                        }}
                                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs sm:text-sm font-medium rounded-lg transition-colors"
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table Management View */}
                {viewMode === 'tables' && (
                    <TableManagementView
                        reservations={filteredReservations}
                        selectedDate={selectedDate}
                        formatTime={formatTime}
                        restaurantTables={restaurantSettings?.tables}
                        onAssignTable={(res) => {
                            setSelectedReservation(res);
                            setShowTableModal(true);
                        }}
                        onViewDetails={(res) => {
                            setSelectedReservation(res);
                            setShowDetailsModal(true);
                        }}
                    />
                )}

                {/* Timeline View */}
                {viewMode === 'timeline' && filteredReservations.length > 0 && (
                    <div className="bg-[#151d2f] rounded-lg sm:rounded-xl border border-gray-800 overflow-hidden">
                        <div className="p-3 sm:p-4 border-b border-gray-800">
                            <h3 className="font-semibold text-white text-sm sm:text-base">Timeline View</h3>
                            <p className="text-xs sm:text-sm text-gray-400">Reservations organized by time</p>
                        </div>
                        <div className="divide-y divide-gray-800">
                            {Array.from(new Set(filteredReservations.map((r) => r.reservationDetails.time)))
                                .sort()
                                .map((time) => {
                                    const timeReservations = filteredReservations.filter(
                                        (r) => r.reservationDetails.time === time
                                    );
                                    return (
                                        <div key={time} className="p-3 sm:p-4 hover:bg-gray-800/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                                <div className="flex-shrink-0 text-center bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700 min-w-[70px] sm:min-w-[80px] self-start">
                                                    <div className="text-base sm:text-lg font-bold text-white">
                                                        {formatTime(time).split(' ')[0]}
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs text-gray-400">
                                                        {formatTime(time).split(' ')[1]}
                                                    </div>
                                                    <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
                                                        {timeReservations.length} booking{timeReservations.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-2 w-full">
                                                    {timeReservations.map((reservation) => (
                                                        <div
                                                            key={reservation.id}
                                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 sm:p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
                                                        >
                                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full sm:w-auto">
                                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                                    {reservation.customerInfo.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                                        <span className="font-medium text-white text-xs sm:text-sm truncate">
                                                                            {reservation.customerInfo.name}
                                                                        </span>
                                                                        <span className={getStatusBadge(reservation.status)}>
                                                                            {reservation.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                                                                        <span className="flex items-center gap-1">
                                                                            <Users className="h-3 w-3 text-gray-300" />
                                                                            {reservation.reservationDetails.guests}
                                                                        </span>
                                                                        {reservation.reservationDetails.tableNumber && (
                                                                            <span className="flex items-center gap-1 text-gray-300">
                                                                                <MapPin className="h-3 w-3" />
                                                                                {reservation.reservationDetails.tableNumber}
                                                                            </span>
                                                                        )}
                                                                        {reservationOrders[reservation.id] && reservationOrders[reservation.id].length > 0 && (
                                                                            <span className="flex items-center gap-1 text-gray-300 font-medium">
                                                                                <ShoppingCart className="h-3 w-3" />
                                                                                {reservationOrders[reservation.id].length}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                                                                {reservation.status === 'pending' && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleConfirmReservation(reservation.id)}
                                                                            className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs font-medium rounded transition-colors"
                                                                        >
                                                                            Confirm
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeclineReservation(reservation.id)}
                                                                            className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] sm:text-xs font-medium rounded transition-colors border border-red-500/20"
                                                                        >
                                                                            Decline
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {reservation.status === 'confirmed' &&
                                                                    !reservation.reservationDetails.tableNumber && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedReservation(reservation);
                                                                                setShowTableModal(true);
                                                                            }}
                                                                            className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-[10px] sm:text-xs font-medium rounded transition-colors"
                                                                        >
                                                                            Assign
                                                                        </button>
                                                                    )}
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedReservation(reservation);
                                                                        setShowDetailsModal(true);
                                                                    }}
                                                                    className="p-1 sm:p-1.5 hover:bg-gray-700 rounded transition-colors"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showTableModal && selectedReservation && (
                <TableAssignmentModal
                    reservation={selectedReservation}
                    onClose={() => {
                        setShowTableModal(false);
                        setSelectedReservation(null);
                    }}
                    onSubmit={handleAssignTable}
                    formatTime={formatTime}
                    getStatusBadge={getStatusBadge}
                />
            )}

            {showDetailsModal && selectedReservation && (
                <DetailsModal
                    reservation={selectedReservation}
                    orders={reservationOrders[selectedReservation.id] || []}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedReservation(null);
                    }}
                    onAssignTable={() => {
                        setShowDetailsModal(false);
                        setShowTableModal(true);
                    }}
                    onCancel={() => handleCancelReservation(selectedReservation.id)}
                    formatTime={formatTime}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    getStatusIcon={getStatusIcon}
                />
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && reservationToConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
                    <div className="bg-[#151d2f] rounded-lg sm:rounded-xl shadow-2xl max-w-md w-full border border-gray-800 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg sm:text-xl font-bold text-white">Confirm Reservation</h2>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setReservationToConfirm(null);
                                        setConfirmationInstructions('');
                                    }}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Reservation Details */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-white mb-2">Reservation Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Guest:</span>
                                        <span className="text-white">{reservationToConfirm.customerInfo.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Date:</span>
                                        <span className="text-white">{formatDate(reservationToConfirm.reservationDetails.date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Time:</span>
                                        <span className="text-white">{formatTime(reservationToConfirm.reservationDetails.time)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Guests:</span>
                                        <span className="text-white">{reservationToConfirm.reservationDetails.guests}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Instructions for Customer (Optional)
                                </label>
                                <textarea
                                    value={confirmationInstructions}
                                    onChange={(e) => setConfirmationInstructions(e.target.value)}
                                    placeholder="Add any special instructions or information for the customer..."
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                    rows={3}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    This message will be sent to the customer along with the confirmation.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setReservationToConfirm(null);
                                        setConfirmationInstructions('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmWithInstructions}
                                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Confirm Reservation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
