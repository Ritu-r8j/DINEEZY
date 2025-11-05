'use client';

import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import { CartMenuItem } from '@/app/(utils)/cartUtils';
import styles from '../checkout.module.css';

interface OrderReviewProps {
    cartItems: CartMenuItem[];
    specialInstructions: string;
    setSpecialInstructions: (instructions: string) => void;
    updateQuantity: (id: string, change: number) => void;
}

export default function OrderReview({
    cartItems,
    specialInstructions,
    setSpecialInstructions,
    updateQuantity
}: OrderReviewProps) {
    return (
        <div className="space-y-8">
            <div>
                <h2 className={`text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-6 ${styles.heading}`}>
                    Review Your Order
                </h2>

                {/* Cart Review */}
                <div className="mb-8">
                    <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${styles.subheading}`}>
                        Order Items
                    </h3>
                    <div className="space-y-4">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={60}
                                    height={60}
                                    className="w-15 h-15 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-base font-medium text-gray-900 dark:text-white truncate ${styles.subheading}`}>
                                        {item.name}
                                    </h4>
                                    <p className={`text-sm truncate ${styles.bodyText}`}>
                                        {item.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className={`${styles.quantityButton} w-8 h-8 ${styles.focusVisible}`}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-medium w-8 text-center text-sm">
                                            {item.quantity || 1}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className={`${styles.quantityButton} w-8 h-8 ${styles.focusVisible}`}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white min-w-[80px] text-right">
                                        ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Special Instructions */}
                <div>
                    <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-4 ${styles.subheading}`}>
                        Special Instructions
                    </h3>
                    <textarea
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Any special requests for your order..."
                        className={`w-full p-4 resize-none ${styles.modernInput} ${styles.focusVisible}`}
                        rows={4}
                    />
                    <p className={`text-xs mt-2 ${styles.bodyText}`}>
                        Optional - Let us know if you have any dietary restrictions or preferences
                    </p>
                </div>
            </div>
        </div>
    );
}