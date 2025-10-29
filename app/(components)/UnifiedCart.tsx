'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { CartManager } from '@/app/(utils)/cartUtils';
import CartPreview from './CartPreview';

export default function UnifiedCart() {
    const router = useRouter();
    const pathname = usePathname();
    const [cartCount, setCartCount] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [showCartPreview, setShowCartPreview] = useState(false);

    // Update cart count and total price when component mounts or cart changes
    useEffect(() => {
        const updateCartData = () => {
            setCartCount(CartManager.getCartCount());
            setTotalPrice(CartManager.getTotalPrice());
        };

        // Initial load
        updateCartData();

        // Listen for storage changes (cart updates from other tabs/components)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cart' || e.key === 'cartCount') {
                updateCartData();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also listen for custom cart update events
        const handleCartUpdate = () => {
            updateCartData();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    const handleViewCart = () => {
        router.push('/user/checkout');
    };

    const handleCartClick = () => {
        setShowCartPreview(!showCartPreview);
    };

    const handleCloseCartPreview = () => {
        setShowCartPreview(false);
    };

    // Don't show cart on checkout page or auth pages
    const authPrefixes = [
        '/user/login',
        '/user/register',
        '/user/forgot-password',
        '/user/reset-password',
    ];
    const isAuthPage = authPrefixes.some(route => pathname.startsWith(route));
    const isCheckoutPage = pathname.startsWith('/user/checkout');

    // Don't render if no items in cart or on checkout/auth pages
    if (cartCount === 0 || isAuthPage || isCheckoutPage) {
        return null;
    }

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
                <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-xl">
                    <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-3 xs:py-4">
                        <div className="flex items-center justify-between gap-3 xs:gap-4">
                            {/* Enhanced Cart Info */}
                            <div 
                                className="flex items-center gap-3 xs:gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={handleCartClick}
                            >
                                <div className="relative">
                                    <div className="w-10 xs:w-12 h-10 xs:h-12 bg-primary rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg">
                                        <ShoppingCart className="w-5 xs:w-6 h-5 xs:h-6 text-primary-foreground" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 xs:w-6 h-5 xs:h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                        <span className="text-white text-xs font-bold">{cartCount}</span>
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground text-sm xs:text-base truncate">
                                        {cartCount} item{cartCount > 1 ? 's' : ''} in cart
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        Tap to view details
                                    </p>
                                </div>
                            </div>

                            {/* Enhanced Action Button */}
                            <div className="flex items-center gap-3 xs:gap-4">
                                <div className="text-right">
                                    <p className="text-lg xs:text-xl font-bold text-foreground">
                                        ₹{totalPrice.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Total
                                    </p>
                                </div>
                                <button
                                    onClick={handleViewCart}
                                    className="cursor-pointer group relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold py-2.5 xs:py-3 px-4 xs:px-6 rounded-lg xs:rounded-xl hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm xs:text-base"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4" />
                                        View Cart
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cart Preview */}
            <CartPreview
                isOpen={showCartPreview}
                onClose={handleCloseCartPreview}
                onViewCart={handleViewCart}
            />
        </>
    );
}
