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
    X,
    Filter,
    MoreHorizontal,
    Search,
    ChevronLeft,
    ChevronRight,
    List,
    Table as TableIcon
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
        const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
        switch (status) {
            case 'confirmed':
                return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30`;
            case 'cancelled':
                return `${baseClasses} bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30`;
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#1a1d24] dark:text-gray-400 dark:border-gray-800`;
        }
    };

    const getStatusIcon = (status: string) => {
        const iconClass = "h-3.5 w-3.5 mr-1";
        switch (status) {
            case 'confirmed': return <CheckCircle className={iconClass} />;
            case 'pending': return <AlertCircle className={iconClass} />;
            case 'cancelled': return <XCircle className={iconClass} />;
            case 'completed': return <CheckCircle className={iconClass} />;
            default: return <AlertCircle className={iconClass} />;
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

    // Action handlers (keeping existing logic)
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
            const result = await updateReservationStatus(
                reservationToConfirm.id, 
                'confirmed', 
                confirmationInstructions || undefined
            );
            if (!result.success) { setError(result.error || 'Failed to confirm reservation'); return; }
            await updateOrdersByReservation(reservationToConfirm.id, 'confirmed');
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
            if (!result.success) setError(result.error || 'Failed to decline reservation');
        } catch (err) {
            console.error('Error declining reservation:', err);
            setError('Failed to decline reservation');
        }
    };

    const handleCancelReservation = async (reservationId: string) => {
        try {
            const result = await cancelReservation(reservationId, 'Cancelled by restaurant');
            if (!result.success) setError(result.error || 'Failed to cancel reservation');
        } catch (err) {
            console.error('Error cancelling reservation:', err);
            setError('Failed to cancel reservation');
        }
    };

    const handleAssignTable = async (tableNumber: string) => {
        if (!selectedReservation) return;
        try {
            const result = await updateReservation(selectedReservation.id, {
                reservationDetails: { ...selectedReservation.reservationDetails, tableNumber: tableNumber }
            });
            if (result.success) { setShowTableModal(false); setSelectedReservation(null); }
            else { setError(result.error || 'Failed to assign table'); }
        } catch (err) {
            console.error('Error assigning table:', err);
            setError('Failed to assign table');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground dark:text-gray-400">Loading reservations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] text-foreground dark:text-white font-sans">
             {/* Header with Glass Effect */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">Reservations</h1>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                    {formatDate(selectedDate)}
                                </span>
                                <span className="text-sm text-muted-foreground dark:text-gray-400">
                                    {stats.total} bookings today
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                             <div className="flex bg-gray-100 dark:bg-[#14161a] p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#1a1d24] shadow-sm text-foreground dark:text-white' : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#1a1d24] shadow-sm text-foreground dark:text-white' : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('tables')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'tables' ? 'bg-white dark:bg-[#1a1d24] shadow-sm text-foreground dark:text-white' : 'text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white'}`}
                                >
                                    <TableIcon className="h-4 w-4" />
                                </button>
                            </div>
                            
                            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#14161a] hover:bg-gray-50 dark:hover:bg-[#1a1d24] border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium transition-colors shadow-sm text-foreground dark:text-white">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="mt-6 flex flex-col xl:flex-row xl:flex-wrap gap-4 justify-between">
                         {/* Stats Grid - Inlined for consistent style */}
                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full xl:flex-1 min-w-0">
                            {[
                                { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', active: activeTab === 'all', key: 'all' },
                                { label: 'Pending', value: stats.pending, color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', active: activeTab === 'pending', key: 'pending' },
                                { label: 'Confirmed', value: stats.confirmed, color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400', active: activeTab === 'confirmed', key: 'confirmed' },
                                { label: 'Guests', value: stats.totalGuests, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400', active: false, key: null },
                            ].map((stat, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => stat.key && setActiveTab(stat.key)}
                                    className={`
                                        flex flex-col p-3 rounded-xl border transition-all cursor-pointer
                                        ${stat.active 
                                            ? 'bg-white dark:bg-[#14161a] border-primary ring-1 ring-primary shadow-sm' 
                                            : 'bg-white dark:bg-[#14161a] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                        }
                                    `}
                                >
                                    <span className="text-xs text-muted-foreground dark:text-gray-400 uppercase tracking-wider font-semibold">{stat.label}</span>
                                    <div className="flex items-end justify-between mt-1">
                                        <span className="text-2xl font-bold text-foreground dark:text-white">{stat.value}</span>
                                        <div className={`h-2 w-2 rounded-full ${stat.color.split(' ')[0].replace('/20', '')} ${stat.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                    </div>
                                </div>
                            ))}
                         </div>

                         {/* Date & Search */}
                         <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto items-start sm:items-end min-w-0">
                            <div className="relative w-full sm:w-auto min-w-0">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search guest or ID..."
                                    className="w-full sm:w-64 max-w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm text-foreground dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center bg-white dark:bg-[#14161a] border border-gray-200 dark:border-gray-800 rounded-xl p-1 shadow-sm w-full sm:w-auto">
                                <button 
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() - 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a1d24] rounded-lg text-muted-foreground dark:text-gray-400 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <div className="relative px-2">
                                     <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-32 bg-transparent border-none text-sm font-medium text-center focus:ring-0 cursor-pointer text-foreground dark:text-white"
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() + 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a1d24] rounded-lg text-muted-foreground dark:text-gray-400 transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Empty State */}
                {filteredReservations.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#14161a] rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1d24] rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-8 w-8 text-muted-foreground dark:text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-white mb-1">No reservations found</h3>
                        <p className="text-muted-foreground dark:text-gray-400 text-sm max-w-sm">
                            {searchTerm
                                ? 'Try adjusting your search criteria.'
                                : `No reservations scheduled for ${formatDate(selectedDate)}.`}
                        </p>
                    </div>
                )}

                {/* List View - Redesigned */}
                {viewMode === 'list' && filteredReservations.length > 0 && (
                    <div className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-[#0f1115]/50 border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground dark:text-gray-400">Guest</th>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground dark:text-gray-400">Details</th>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground dark:text-gray-400">Table</th>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground dark:text-gray-400">Status</th>
                                        <th className="px-6 py-4 font-semibold text-muted-foreground dark:text-gray-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredReservations.map((reservation) => (
                                        <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1d24]/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1a1d24] dark:to-[#20232a] flex items-center justify-center text-foreground dark:text-white font-semibold">
                                                        {reservation.customerInfo.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground dark:text-white">{reservation.customerInfo.name}</p>
                                                        <p className="text-xs text-muted-foreground dark:text-gray-400">#{reservation.reservationId.slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-foreground dark:text-white font-medium">
                                                        <Clock className="h-4 w-4 mr-2 text-muted-foreground dark:text-gray-400" />
                                                        {formatTime(reservation.reservationDetails.time)}
                                                    </div>
                                                    <div className="flex items-center text-muted-foreground dark:text-gray-400 text-xs">
                                                        <Users className="h-3.5 w-3.5 mr-2" />
                                                        {reservation.reservationDetails.guests} Guests
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {reservation.reservationDetails.tableNumber ? (
                                                    <div className="flex items-center text-foreground dark:text-white">
                                                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                                                        Table {reservation.reservationDetails.tableNumber}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground dark:text-gray-400 text-xs italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={getStatusBadge(reservation.status)}>
                                                    {getStatusIcon(reservation.status)}
                                                    <span className="capitalize">{reservation.status}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {reservation.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleConfirmReservation(reservation.id)}
                                                                className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                                title="Confirm"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeclineReservation(reservation.id)}
                                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                                title="Decline"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {reservation.status === 'confirmed' && !reservation.reservationDetails.tableNumber && (
                                                        <button 
                                                            onClick={() => { setSelectedReservation(reservation); setShowTableModal(true); }}
                                                            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                                        >
                                                            Assign Table
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => { setSelectedReservation(reservation); setShowDetailsModal(true); }}
                                                        className="p-2 text-gray-400 hover:text-foreground hover:bg-gray-100 dark:hover:bg-[#1a1d24] rounded-lg transition-colors"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {viewMode === 'grid' && filteredReservations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredReservations.map((reservation) => (
                            <div
                                key={reservation.id}
                                className="bg-white dark:bg-[#14161a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)] transition-all duration-300 p-5 group"
                            >
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1d24] flex items-center justify-center text-foreground dark:text-white font-bold text-lg">
                                            {reservation.customerInfo.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-foreground dark:text-white truncate max-w-[160px] sm:max-w-[220px]">
                                                {reservation.customerInfo.name}
                                            </h3>
                                            <span className={getStatusBadge(reservation.status)}>
                                                {reservation.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setSelectedReservation(reservation); setShowDetailsModal(true); }}
                                        className="text-gray-400 hover:text-foreground dark:hover:text-white transition-colors"
                                    >
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#0f1115]/50 rounded-lg">
                                        <div className="flex items-center text-sm text-foreground dark:text-white">
                                            <Clock className="h-4 w-4 mr-2 text-muted-foreground dark:text-gray-400" />
                                            {formatTime(reservation.reservationDetails.time)}
                                        </div>
                                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-800"></div>
                                        <div className="flex items-center text-sm text-foreground dark:text-white">
                                            <Users className="h-4 w-4 mr-2 text-muted-foreground dark:text-gray-400" />
                                            {reservation.reservationDetails.guests}
                                        </div>
                                    </div>
                                    
                                    {reservation.reservationDetails.tableNumber && (
                                        <div className="flex items-center text-sm text-primary font-medium px-2">
                                            <MapPin className="h-4 w-4 mr-2" />
                                            Table {reservation.reservationDetails.tableNumber}
                                        </div>
                                    )}

                                    {reservationOrders[reservation.id] && reservationOrders[reservation.id].length > 0 && (
                                        <div className="flex items-center text-xs text-muted-foreground px-2 bg-blue-50 dark:bg-blue-900/10 p-2 rounded text-blue-700 dark:text-blue-400">
                                            <ShoppingCart className="h-3 w-3 mr-2" />
                                            {reservationOrders[reservation.id].length} Pre-ordered items
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    {reservation.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleConfirmReservation(reservation.id)}
                                                className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => handleDeclineReservation(reservation.id)}
                                                className="px-3 py-2 bg-gray-100 dark:bg-[#1a1d24] text-foreground dark:text-white text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-[#20232a] transition-colors"
                                            >
                                                Decline
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => { setSelectedReservation(reservation); setShowDetailsModal(true); }}
                                            className="w-full py-2 bg-gray-50 dark:bg-[#1a1d24] text-foreground dark:text-white text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-[#20232a] transition-colors"
                                        >
                                            View Details
                                        </button>
                                    )}
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#14161a] rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-foreground dark:text-white">Confirm Reservation</h2>
                            <button onClick={() => setShowConfirmModal(false)} className="text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 dark:bg-[#0f1115] p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground dark:text-gray-400">Guest</span>
                                    <span className="font-medium text-foreground dark:text-white">{reservationToConfirm.customerInfo.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground dark:text-gray-400">Date & Time</span>
                                    <span className="font-medium text-foreground dark:text-white">
                                        {formatDate(reservationToConfirm.reservationDetails.date)} at {formatTime(reservationToConfirm.reservationDetails.time)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                                    Message to Customer (Optional)
                                </label>
                                <textarea
                                    value={confirmationInstructions}
                                    onChange={(e) => setConfirmationInstructions(e.target.value)}
                                    placeholder="Any special instructions..."
                                    className="w-full px-3 py-2 bg-white dark:bg-[#14161a] border border-gray-300 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-foreground dark:text-white"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-800 text-foreground dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1d24] transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmWithInstructions}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
