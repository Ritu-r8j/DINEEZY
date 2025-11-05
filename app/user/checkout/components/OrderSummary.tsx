'use client';

import Image from 'next/image';
import { Clock } from 'lucide-react';
import { CartMenuItem } from '@/app/(utils)/cartUtils';
import styles from '../checkout.module.css';

interface OrderType {
    id: string;
    name: string;
    description: string;
    icon: string;
    selected: boolean;
}

interface OrderSummaryProps {
    cartItems: CartMenuItem[];
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    total: number;
    estimatedTime: string;
    selectedOrderType: OrderType | undefined;
    error: string | null;
}

export default function OrderSummary({
    cartItems,
    subtotal,
    deliveryFee,
    tax,
    discount,
    total,
    estimatedTime,
    selectedOrderType,
    error
}: OrderSummaryProps) {
    return (
        <div className="hidden lg:block">
            <div className={`${styles.stepCard} p-3 lg:p-4 sticky top-4 ${styles.staggerIn}`}>
                <h2 className={`text-lg font-semibold text-gray-900 dark:text-white mb-4 ${styles.heading}`}>
                    Order Summary
                </h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-4">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <Image
                                src={item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-medium text-gray-900 dark:text-white truncate ${styles.subheading}`}>
                                    {item.name}
                                </h3>
                                <p className={`text-xs truncate ${styles.bodyText}`}>
                                    Qty: {item.quantity || 1}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className={`flex justify-between text-sm ${styles.bodyText}`}>
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {selectedOrderType?.id === 'delivery' && (
                        <div className={`flex justify-between text-sm ${styles.bodyText}`}>
                            <span>Delivery Fee</span>
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                    <div className={`flex justify-between text-sm ${styles.bodyText}`}>
                        <span>Tax (0%)</span>
                        <span>₹{tax.toFixed(2)}</span>
                    </div>
                    {discount < 0 && (
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>Discount</span>
                            <span>₹{discount.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-4">
                    <span className={`text-lg font-semibold text-gray-900 dark:text-white ${styles.heading}`}>
                        Total
                    </span>
                    <span className={`text-lg font-semibold text-gray-900 dark:text-white ${styles.heading}`}>
                        ₹{total.toFixed(2)}
                    </span>
                </div>

                {/* Order Info */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <div className="flex items-center gap-3 text-orange-800 dark:text-orange-300">
                        <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Estimated Time</p>
                            <p className={`text-sm ${styles.bodyText}`}>{estimatedTime}</p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="text-red-600 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}