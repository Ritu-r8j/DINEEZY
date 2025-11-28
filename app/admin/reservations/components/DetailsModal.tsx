import { XCircle, Calendar, Clock, Users, MapPin, Mail, Phone, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { ReservationData, formatFirebaseTimestamp, OrderData } from '@/app/(utils)/firebaseOperations';

interface DetailsModalProps {
    reservation: ReservationData;
    orders: OrderData[];
    onClose: () => void;
    onAssignTable: () => void;
    onCancel: () => void;
    formatTime: (time: string) => string;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactElement;
}

export default function DetailsModal({
    reservation,
    orders,
    onClose,
    onAssignTable,
    onCancel,
    formatTime,
    formatDate,
    getStatusBadge,
    getStatusIcon
}: DetailsModalProps) {
    const getOrderStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'preparing':
            case 'ready':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'delivered':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'cancelled':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-[#151d2f] rounded-lg sm:rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
                <div className="sticky top-0 bg-[#151d2f] border-b border-gray-800 p-4 sm:p-6 flex items-center justify-between z-10">
                    <div className="min-w-0 flex-1 pr-2">
                        <h3 className="text-lg sm:text-2xl font-bold text-white truncate">Reservation Details</h3>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 font-mono truncate">
                            {reservation.reservationId}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Status */}
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2">Status</p>
                        <span className={getStatusBadge(reservation.status)}>
                            {getStatusIcon(reservation.status)}
                            <span className="ml-1 capitalize">{reservation.status}</span>
                        </span>
                    </div>

                    {/* Customer Information */}
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3">Customer Information</p>
                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-base sm:text-xl flex-shrink-0">
                                    {reservation.customerInfo.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-white text-base sm:text-lg truncate">
                                        {reservation.customerInfo.name}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-400">Customer</p>
                                </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-700">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-gray-300 truncate">
                                        {reservation.customerInfo.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-gray-300">{reservation.customerInfo.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reservation Details */}
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2 sm:mb-3">Reservation Details</p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                    <p className="text-[10px] sm:text-xs text-gray-400">Date</p>
                                </div>
                                <p className="font-semibold text-white text-xs sm:text-base">
                                    {formatDate(reservation.reservationDetails.date)}
                                </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                    <p className="text-[10px] sm:text-xs text-gray-400">Time</p>
                                </div>
                                <p className="font-semibold text-white text-xs sm:text-base">
                                    {formatTime(reservation.reservationDetails.time)}
                                </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                    <p className="text-[10px] sm:text-xs text-gray-400">Party Size</p>
                                </div>
                                <p className="font-semibold text-white text-xs sm:text-base">
                                    {reservation.reservationDetails.guests} guests
                                </p>
                            </div>
                            {reservation.reservationDetails.tableNumber && (
                                <div className="bg-purple-500/10 rounded-lg p-3 sm:p-4 border border-purple-500/20">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                                        <p className="text-[10px] sm:text-xs text-purple-400">Table</p>
                                    </div>
                                    <p className="font-semibold text-purple-300 text-xs sm:text-base">
                                        {reservation.reservationDetails.tableNumber}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Special Requests */}
                    {reservation.reservationDetails.specialRequests && (
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2">Special Requests</p>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-gray-300">
                                    {reservation.reservationDetails.specialRequests}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Pre-Orders Section */}
                    {orders && orders.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <ShoppingCart className="h-4 w-4 text-emerald-400" />
                                <p className="text-xs sm:text-sm font-medium text-gray-400">
                                    Pre-Orders ({orders.length})
                                </p>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                                            <p className="text-xs font-mono text-gray-400 truncate pr-2">
                                                {order.orderId}
                                            </p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${getOrderStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            {order.items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="text-xs">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-gray-300 truncate">
                                                            {item.quantity}x {item.name}
                                                            {item.selectedVariant && (
                                                                <span className="text-gray-500 ml-1">({item.selectedVariant.name})</span>
                                                            )}
                                                        </span>
                                                        <span className="text-gray-400 flex-shrink-0">
                                                            ₹{((item.customPrice || item.price) * item.quantity).toFixed(0)}
                                                        </span>
                                                    </div>
                                                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                        <div className="text-gray-500 ml-4 mt-0.5 text-[10px] sm:text-xs truncate">
                                                            + {item.selectedAddons.map(addon => addon.name).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <p className="text-xs text-gray-500 italic">
                                                    +{order.items.length - 3} more items
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-400">Total</span>
                                            <span className="text-sm sm:text-base font-bold text-emerald-400">
                                                ₹{order.total.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Booking Information */}
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-400 mb-2">Booking Information</p>
                        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700 space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-400">Booked on:</span>
                                <span className="font-medium text-white text-right">
                                    {formatFirebaseTimestamp(reservation.createdAt)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-gray-400">Reservation ID:</span>
                                <span className="font-mono text-white text-right truncate">{reservation.reservationId}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-[#0d1220] border-t border-gray-800 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors order-3 sm:order-1"
                        >
                            Close
                        </button>
                        {reservation.status === 'confirmed' && !reservation.reservationDetails.tableNumber && (
                            <button
                                onClick={onAssignTable}
                                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors order-1 sm:order-2"
                            >
                                Assign Table
                            </button>
                        )}
                        {reservation.status === 'confirmed' && (
                            <button
                                onClick={onCancel}
                                className="px-3 sm:px-4 py-2 sm:py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors border border-red-500/20 order-2 sm:order-3"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
