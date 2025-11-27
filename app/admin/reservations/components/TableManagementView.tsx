import { Clock, Users, CheckCircle, XCircle, MapPin, Plus, Settings as SettingsIcon } from 'lucide-react';
import { ReservationData } from '@/app/(utils)/firebaseOperations';
import { useState, useEffect } from 'react';

interface TableManagementViewProps {
    reservations: ReservationData[];
    selectedDate: string;
    formatTime: (time: string) => string;
    onAssignTable: (reservation: ReservationData) => void;
    onViewDetails: (reservation: ReservationData) => void;
    restaurantTables?: Array<{
        id: string;
        number: string;
        capacity: number;
        status?: 'active' | 'inactive';
    }>;
}

interface Table {
    id: string;
    number: string;
    capacity: number;
    status: 'available' | 'booked' | 'occupied';
    reservation?: ReservationData;
}

export default function TableManagementView({
    reservations,
    selectedDate,
    formatTime,
    onAssignTable,
    onViewDetails,
    restaurantTables
}: TableManagementViewProps) {
    // Generate time slots dynamically based on reservations
    // First, get all unique times from reservations
    const reservationTimes = Array.from(new Set(reservations.map(r => r.reservationDetails.time))).sort();
    
    // Generate standard hourly time slots (11 AM to 11 PM)
    const standardTimeSlots = Array.from({ length: 13 }, (_, i) => {
        const hour = i + 11;
        return `${hour.toString().padStart(2, '0')}:00`;
    });
    
    // Combine and deduplicate: use reservation times if they exist, otherwise use standard slots
    const timeSlots = reservationTimes.length > 0 
        ? Array.from(new Set([...reservationTimes, ...standardTimeSlots])).sort()
        : standardTimeSlots;

    // Default tables if none configured
    const defaultTables: Omit<Table, 'status' | 'reservation'>[] = [
        { id: 'T1', number: 'T-1', capacity: 2 },
        { id: 'T2', number: 'T-2', capacity: 2 },
        { id: 'T3', number: 'T-3', capacity: 4 },
        { id: 'T4', number: 'T-4', capacity: 4 },
        { id: 'T5', number: 'T-5', capacity: 4 },
        { id: 'T6', number: 'T-6', capacity: 6 },
        { id: 'T7', number: 'T-7', capacity: 6 },
        { id: 'T8', number: 'T-8', capacity: 8 },
        { id: 'T9', number: 'T-9', capacity: 2 },
        { id: 'T10', number: 'T-10', capacity: 4 }
    ];

    // Use restaurant tables if available, otherwise use defaults
    const totalTables: Omit<Table, 'status' | 'reservation'>[] = 
        restaurantTables && restaurantTables.length > 0
            ? restaurantTables.filter(t => t.status !== 'inactive').map(t => ({
                id: t.id,
                number: t.number,
                capacity: t.capacity
            }))
            : defaultTables;

    // Get table status for a specific time slot
    const getTablesForTimeSlot = (timeSlot: string): Table[] => {
        return totalTables.map((table) => {
            const reservation = reservations.find(
                (r) =>
                    r.reservationDetails.tableNumber === table.number &&
                    r.reservationDetails.time === timeSlot &&
                    (r.status === 'confirmed' || r.status === 'completed')
            );

            return {
                ...table,
                status: reservation ? 'booked' : 'available',
                reservation
            };
        });
    };

    // Get unassigned reservations for a time slot
    const getUnassignedReservations = (timeSlot: string) => {
        return reservations.filter(
            (r) =>
                r.reservationDetails.time === timeSlot &&
                !r.reservationDetails.tableNumber &&
                r.status === 'confirmed'
        );
    };

    // Calculate stats for a time slot
    const getTimeSlotStats = (timeSlot: string) => {
        const tables = getTablesForTimeSlot(timeSlot);
        const booked = tables.filter((t) => t.status === 'booked').length;
        const available = tables.filter((t) => t.status === 'available').length;
        const unassigned = getUnassignedReservations(timeSlot).length;
        const totalGuests = tables
            .filter((t) => t.reservation)
            .reduce((sum, t) => sum + (t.reservation?.reservationDetails.guests || 0), 0);

        return { booked, available, unassigned, totalGuests };
    };

    const getTableStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20';
            case 'booked':
                return 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20';
            case 'occupied':
                return 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20';
            default:
                return 'bg-gray-500/10 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-4">
            {/* Notice if using default tables */}
            {(!restaurantTables || restaurantTables.length === 0) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg sm:rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <SettingsIcon className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-amber-400 mb-1">Using Default Tables</h4>
                            <p className="text-xs text-gray-300 mb-2">
                                You haven't configured your restaurant tables yet. We're showing default tables (10 tables with various capacities).
                            </p>
                            <button className="text-xs font-medium text-amber-400 hover:text-amber-300 underline">
                                Configure Tables in Settings →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overview Stats */}
            <div className="bg-[#151d2f]  p-4 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Table Management Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">{totalTables.length}</div>
                        <div className="text-xs text-gray-400 mt-1">Total Tables</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                            {totalTables.reduce((sum, t) => sum + t.capacity, 0)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Total Capacity</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400">
                            {reservations.filter((r) => r.reservationDetails.tableNumber && r.status === 'confirmed').length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Assigned Today</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-400">
                            {reservations.filter((r) => !r.reservationDetails.tableNumber && r.status === 'confirmed').length}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Unassigned</div>
                    </div>
                </div>
            </div>

            {/* Time Slot Table Grid */}
            <div className="space-y-4">
                {timeSlots.map((timeSlot) => {
                    const tables = getTablesForTimeSlot(timeSlot);
                    const stats = getTimeSlotStats(timeSlot);
                    const unassignedReservations = getUnassignedReservations(timeSlot);
                    const hasActivity = stats.booked > 0 || stats.unassigned > 0;

                    // Skip time slots with no activity
                    if (!hasActivity) return null;

                    return (
                        <div
                            key={timeSlot}
                            className="bg-[#151d2f] rounded-lg sm:rounded-xl border border-gray-800 overflow-hidden"
                        >
                            {/* Time Slot Header */}
                            <div className="p-3 sm:p-4 border-b border-gray-800 bg-gray-800/30">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 flex-shrink-0" />
                                        <span className="text-base sm:text-lg font-bold text-white">{formatTime(timeSlot)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                            <span className="text-gray-400 text-xs sm:text-sm">
                                                <span className="hidden sm:inline">Available: </span>
                                                <span className="sm:hidden">Avail: </span>
                                                <span className="text-white font-medium">{stats.available}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-orange-500 flex-shrink-0"></div>
                                            <span className="text-gray-400 text-xs sm:text-sm">
                                                Booked: <span className="text-white font-medium">{stats.booked}</span>
                                            </span>
                                        </div>
                                        {stats.unassigned > 0 && (
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 flex-shrink-0"></div>
                                                <span className="text-gray-400 text-xs sm:text-sm">
                                                    <span className="hidden sm:inline">Unassigned: </span>
                                                    <span className="sm:hidden">Unass: </span>
                                                    <span className="text-white font-medium">{stats.unassigned}</span>
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-400 text-xs sm:text-sm">
                                                Guests: <span className="text-white font-medium">{stats.totalGuests}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tables Grid */}
                            <div className="p-3 sm:p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                                    {tables.map((table) => (
                                        <button
                                            key={table.id}
                                            onClick={() => table.reservation && onViewDetails(table.reservation)}
                                            className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all ${getTableStatusColor(
                                                table.status
                                            )} ${table.reservation ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            {/* Table Number */}
                                            <div className="text-center mb-2">
                                                <div className="text-base sm:text-lg font-bold text-white">{table.number}</div>
                                                <div className="text-[10px] sm:text-xs text-gray-400">
                                                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-0.5 sm:mr-1" />
                                                    {table.capacity} <span className="hidden sm:inline">seats</span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex items-center justify-center">
                                                {table.status === 'available' ? (
                                                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                                                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        <span className="hidden sm:inline">Available</span>
                                                        <span className="sm:hidden">Free</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold bg-orange-500/20 text-orange-400">
                                                        <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                        Booked
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reservation Info */}
                                            {table.reservation && (
                                                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700/50">
                                                    <div className="text-[10px] sm:text-xs text-gray-300 truncate font-medium">
                                                        {table.reservation.customerInfo.name}
                                                    </div>
                                                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                                                        {table.reservation.reservationDetails.guests} guests
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Unassigned Reservations */}
                                {unassignedReservations.length > 0 && (
                                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800">
                                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 flex-shrink-0" />
                                            <h4 className="text-xs sm:text-sm font-semibold text-white">
                                                Unassigned Reservations ({unassignedReservations.length})
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                                            {unassignedReservations.map((reservation) => (
                                                <div
                                                    key={reservation.id}
                                                    className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-white text-xs sm:text-sm truncate">
                                                                {reservation.customerInfo.name}
                                                            </div>
                                                            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                                                                <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-0.5 sm:mr-1" />
                                                                {reservation.reservationDetails.guests} guests
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => onAssignTable(reservation)}
                                                        className="w-full mt-1.5 sm:mt-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] sm:text-xs font-medium rounded transition-colors"
                                                    >
                                                        Assign Table
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="bg-[#151d2f] rounded-lg sm:rounded-xl p-4 border border-gray-800">
                <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500/20 border-2 border-emerald-500/30"></div>
                        <span className="text-xs text-gray-400">Available Table</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-500/20 border-2 border-orange-500/30"></div>
                        <span className="text-xs text-gray-400">Booked Table</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500/20 border-2 border-amber-500/30"></div>
                        <span className="text-xs text-gray-400">Needs Assignment</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
