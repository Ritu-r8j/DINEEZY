'use client';

import { ShoppingCart } from 'lucide-react';

interface FloatingCartProps {
    cartCount: number;
    totalPrice: number;
    onViewCart: () => void;
}

export default function FloatingCart({ cartCount, totalPrice, onViewCart }: FloatingCartProps) {
    if (cartCount === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-100 rounded-lg flex items-center justify-center shadow-md">
                                <ShoppingCart className="w-5 h-5 text-white dark:text-gray-900" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                    {cartCount}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {cartCount} item{cartCount > 1 ? 's' : ''} in cart
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Tap to view details
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                ₹{totalPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Total
                            </p>
                        </div>
                        <button
                            onClick={onViewCart}
                            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-2.5 px-6 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-md hover:shadow-lg text-sm"
                        >
                            View Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
