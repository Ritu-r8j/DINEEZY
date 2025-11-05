'use client';

import Image from 'next/image';
import { Loader2, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { CartMenuItem } from '@/app/(utils)/cartUtils';
import styles from '../checkout.module.css';

interface OrderType {
    id: string;
    name: string;
    description: string;
    icon: string;
    selected: boolean;
}

interface MobileSummaryProps {
    cartItems: CartMenuItem[];
    total: number;
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    estimatedTime: string;
    selectedOrderType: OrderType | undefined;
    error: string | null;
    currentStep: number;
    isFormValid: () => boolean;
    isPlacingOrder: boolean;
    isSummaryExpanded: boolean;
    setIsSummaryExpanded: (expanded: boolean) => void;
    nextStep: () => void;
    placeOrder: () => void;
}

export default function MobileSummary({
    cartItems,
    total,
    subtotal,
    deliveryFee,
    tax,
    discount,
    estimatedTime,
    selectedOrderType,
    error,
    currentStep,
    isFormValid,
    isPlacingOrder,
    isSummaryExpanded,
    setIsSummaryExpanded,
    nextStep,
    placeOrder
}: MobileSummaryProps) {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 transition-all duration-300 safe-area-inset-bottom">
            {/* Summary Header */}
            <div
                className="flex items-center justify-between p-3 xs:p-4 sm:p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            >
                <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-gray-900 dark:bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-white dark:text-gray-900 text-xs xs:text-sm font-semibold">{cartItems.length}</span>
                    </div>
                    <div>
                        <p className={`text-xs xs:text-sm sm:text-base font-semibold text-gray-900 dark:text-white ${styles.subheading}`}>
                            Order Summary
                        </p>
                        <p className={`text-xs sm:text-sm ${styles.bodyText}`}>
                            ₹{total.toFixed(2)} • {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 xs:gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (currentStep < 3) {
                                nextStep();
                            } else {
                                placeOrder();
                            }
                        }}
                        disabled={!isFormValid() || isPlacingOrder}
                        className={`px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm font-medium transition-all ${styles.focusVisible} ${
                            isFormValid() && !isPlacingOrder ? styles.primaryButton : styles.secondaryButton
                        }`}
                    >
                        {isPlacingOrder ? (
                            <>
                                <Loader2 className="w-3 h-3 xs:w-4 xs:h-4 animate-spin mr-1 xs:mr-2 inline" />
                                <span className="hidden xs:inline">Processing...</span>
                                <span className="xs:hidden">...</span>
                            </>
                        ) : currentStep < 3 ? (
                            'Next'
                        ) : (
                            <>
                                <span className="hidden xs:inline">Pay ₹{total.toFixed(2)}</span>
                                <span className="xs:hidden">Pay</span>
                            </>
                        )}
                    </button>
                    <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        {isSummaryExpanded ? (
                            <ChevronDown className="w-4 h-4 xs:w-5 xs:h-5 text-gray-500" />
                        ) : (
                            <ChevronUp className="w-4 h-4 xs:w-5 xs:h-5 text-gray-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable Summary Content */}
            <div className={`transition-all duration-300 ease-out overflow-hidden ${
                isSummaryExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="px-3 xs:px-4 sm:px-5 pb-3 xs:pb-4 sm:pb-5 border-t border-gray-200 dark:border-gray-700">
                    {/* Cart Items */}
                    <div className="space-y-2 xs:space-y-3 mb-3 xs:mb-4 pt-3 xs:pt-4">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 xs:gap-3 p-1.5 xs:p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-xs xs:text-sm font-medium text-gray-900 dark:text-white truncate ${styles.subheading}`}>
                                        {item.name}
                                    </h3>
                                    <p className={`text-xs ${styles.bodyText}`}>
                                        Qty: {item.quantity || 1}
                                    </p>
                                </div>
                                <p className="text-xs xs:text-sm font-semibold text-gray-900 dark:text-white">
                                    ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-1.5 xs:space-y-2 mb-3 xs:mb-4 pb-3 xs:pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className={`flex justify-between text-xs xs:text-sm ${styles.bodyText}`}>
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {selectedOrderType?.id === 'delivery' && (
                            <div className={`flex justify-between text-xs xs:text-sm ${styles.bodyText}`}>
                                <span>Delivery Fee</span>
                                <span>₹{deliveryFee.toFixed(2)}</span>
                            </div>
                        )}
                        <div className={`flex justify-between text-xs xs:text-sm ${styles.bodyText}`}>
                            <span>Tax (0%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                        {discount < 0 && (
                            <div className="flex justify-between text-xs xs:text-sm text-gray-700 dark:text-gray-300">
                                <span>Discount</span>
                                <span>₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center mb-3 xs:mb-4">
                        <span className={`text-sm xs:text-base font-semibold text-gray-900 dark:text-white ${styles.heading}`}>
                            Total
                        </span>
                        <span className={`text-sm xs:text-base font-semibold text-gray-900 dark:text-white ${styles.heading}`}>
                            ₹{total.toFixed(2)}
                        </span>
                    </div>

                    {/* Order Info */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2.5 xs:p-3">
                        <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                            <Clock className="w-3 h-3 xs:w-4 xs:h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-medium">Estimated Time</p>
                                <p className={`text-xs ${styles.bodyText}`}>{estimatedTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-2.5 xs:mt-3 p-2.5 xs:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="text-red-600 dark:text-red-400 text-xs xs:text-sm font-medium">
                                {error}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}