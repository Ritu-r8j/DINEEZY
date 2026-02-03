import React from 'react';
import { Clock, Users, MapPin, Eye, MoreHorizontal, CheckCircle, XCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { ReservationData, OrderData } from '@/app/(utils)/firebaseOperations';

interface ReservationCardProps {
    reservation: ReservationData;
    orders?: OrderData[];
    formatTime: (time: string) => string;
    getStatusBadge: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactElement;
    onConfirm: (id: string) => void;
    onDecline: (id: string) => void;
    onAssignTable: (reservation: ReservationData) => void;
    onViewDetails: (reservation: ReservationData) => void;
}

export default function ReservationCard({
    reservation,
    orders = [],
    formatTime,
    getStatusBadge,
    getStatusIcon,
    onConfirm,
    onDecline,
    onAssignTable,
    onViewDetails
}: ReservationCardProps) {
    return (
        <div className="bg-[#151d2f] rounded-lg sm:rounded-xl border border-gray-800 hover:border-gray-700 transition-all overflow-hidden">
            <div className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    {/* Time Badge */}
                    <div className="flex-shrink-0 text-center bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700 self-start sm:self-auto">
                        <div className="text-base sm:text-lg font-bold text-white">
                            {formatTime(reservation.reservationDetails.time).split(' ')[0]}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-400">
                            {formatTime(reservation.reservationDetails.time).split(' ')[1]}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-start gap-2 sm:gap-3 mb-2">
                            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                {reservation.customerInfo.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                    <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                                        {reservation.customerInfo.name}
                                    </h3>
                                    <span className={getStatusBadge(reservation.status)}>
                                        {getStatusIcon(reservation.status)}
                                        <span className="ml-1">{reservation.status}</span>
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-gray-300" />
                                        {reservation.reservationDetails.guests} guests
                                    </span>
                                    {reservation.reservationDetails.tableNumber && (
                                        <span className="flex items-center gap-1 text-gray-300">
                                            <MapPin className="h-3 w-3" />
                                            Table {reservation.reservationDetails.tableNumber}
                                        </span>
                                    )}
                                    {orders && orders.length > 0 && (
                                        <span className="flex items-center gap-1 text-gray-300 font-medium">
                                            <ShoppingCart className="h-3 w-3" />
                                            {orders.length} Pre-order{orders.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <span className="font-mono hidden sm:inline">{reservation.reservationId}</span>
                                </div>
                            </div>
                        </div>
                        {reservation.reservationDetails.specialRequests && (
                            <div className="mt-2 text-[10px] sm:text-xs text-gray-400 bg-gray-800/50 rounded px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700/50">
                                <span className="text-amber-400 font-medium">Note:</span> {reservation.reservationDetails.specialRequests}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                        {reservation.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => onConfirm(reservation.id)}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                                >
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>Confirm</span>
                                </button>
                                <button
                                    onClick={() => onDecline(reservation.id)}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-red-500/20"
                                >
                                    Decline
                                </button>
                            </>
                        )}

                        {reservation.status === 'confirmed' && (
                            <>
                                {!reservation.reservationDetails.tableNumber && (
                                    <button
                                        onClick={() => onAssignTable(reservation)}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                                    >
                                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Assign Table</span>
                                        <span className="sm:hidden">Assign</span>
                                    </button>
                                )}
                                {reservation.reservationDetails.tableNumber && (
                                    <button
                                        onClick={() => onAssignTable(reservation)}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-purple-500/20"
                                    >
                                        <span className="hidden sm:inline">Change Table</span>
                                        <span className="sm:hidden">Change</span>
                                    </button>
                                )}
                            </>
                        )}

                        <button
                            onClick={() => onViewDetails(reservation)}
                            className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </button>
                        <button className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
