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
    RefreshCw,
    Download,
    Clock,
    Eye,
    LayoutGrid,
    ShoppingCart
} from 'lucide-react';
import {
    getRestaurantReservations,
    updateReservationStatus,
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
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null);
    const [reservationOrders, setReservationOrders] = useState<Record<string, OrderData[]>>({});

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

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh || !user) return;
        
        const interval = setInterval(() => {
            getRestaurantReservations(user.uid).then(result => {
                if (result.success) {
                    setReservations(result.data || []);
                }
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, user]);

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
                return <CheckCircle className={`${iconClass} text-emerald-500`} />;
            case 'pending':
                return <AlertCircle className={`${iconClass} text-amber-500`} />;
            case 'cancelled':
                return <XCircle className={`${iconClass} text-red-500`} />;
            case 'completed':
                return <CheckCircle className={`${iconClass} text-blue-500`} />;
            default:
                return <AlertCircle className={`${iconClass} text-gray-400`} />;
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
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                                    autoRefresh
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                                }`}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Auto-refresh</span>
                                <span className="sm:hidden">Auto</span>
                            </button>
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
                        <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
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
                                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                        <span>{formatTime(reservation.reservationDetails.time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                        <span>{reservation.reservationDetails.guests} guests</span>
                                    </div>
                                    {reservation.reservationDetails.tableNumber && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-400">
                                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                            <span>Table {reservation.reservationDetails.tableNumber}</span>
                                        </div>
                                    )}
                                    {reservationOrders[reservation.id] && reservationOrders[reservation.id].length > 0 && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 font-medium">
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
                                                                            <Users className="h-3 w-3" />
                                                                            {reservation.reservationDetails.guests}
                                                                        </span>
                                                                        {reservation.reservationDetails.tableNumber && (
                                                                            <span className="flex items-center gap-1 text-purple-400">
                                                                                <MapPin className="h-3 w-3" />
                                                                                {reservation.reservationDetails.tableNumber}
                                                                            </span>
                                                                        )}
                                                                        {reservationOrders[reservation.id] && reservationOrders[reservation.id].length > 0 && (
                                                                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
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
        </div>
    );
}
