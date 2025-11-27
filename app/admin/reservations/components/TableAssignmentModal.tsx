import { XCircle } from 'lucide-react';
import { ReservationData } from '@/app/(utils)/firebaseOperations';
import { useState } from 'react';

interface TableAssignmentModalProps {
    reservation: ReservationData;
    onClose: () => void;
    onSubmit: (tableNumber: string) => void;
    formatTime: (time: string) => string;
    getStatusBadge: (status: string) => string;
}

export default function TableAssignmentModal({
    reservation,
    onClose,
    onSubmit,
    formatTime,
    getStatusBadge
}: TableAssignmentModalProps) {
    const [tableNumber, setTableNumber] = useState(reservation.reservationDetails.tableNumber || '');

    const handleSubmit = () => {
        if (tableNumber.trim()) {
            onSubmit(tableNumber.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-[#151d2f] rounded-lg sm:rounded-xl shadow-2xl max-w-md w-full border border-gray-800 max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6 border-b border-gray-800 sticky top-0 bg-[#151d2f] z-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-bold text-white">Assign Table</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {reservation.customerInfo.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-sm sm:text-base truncate">
                                    {reservation.customerInfo.name}
                                </p>
                                <p className="text-[10px] sm:text-xs text-gray-400 truncate">{reservation.reservationId}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div>
                                <p className="text-gray-400 text-[10px] sm:text-xs mb-1">Time</p>
                                <p className="text-white font-medium text-xs sm:text-sm">
                                    {formatTime(reservation.reservationDetails.time)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-[10px] sm:text-xs mb-1">Guests</p>
                                <p className="text-white font-medium text-xs sm:text-sm">
                                    {reservation.reservationDetails.guests}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-[10px] sm:text-xs mb-1">Status</p>
                                <span className={getStatusBadge(reservation.status)}>{reservation.status}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Table Number</label>
                        <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="e.g., T-12, A5, Table 8"
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            autoFocus
                        />
                    </div>

                    {reservation.reservationDetails.specialRequests && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 sm:p-3">
                            <p className="text-[10px] sm:text-xs font-medium text-amber-400 mb-1">Special Request</p>
                            <p className="text-xs sm:text-sm text-gray-300">
                                {reservation.reservationDetails.specialRequests}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-800 flex gap-2 sm:gap-3 sticky bottom-0 bg-[#151d2f]">
                    <button
                        onClick={onClose}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!tableNumber.trim()}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Assign Table
                    </button>
                </div>
            </div>
        </div>
    );
}
