'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart, Trash } from 'lucide-react';
import { CartManager, CartMenuItem } from '@/app/(utils)/cartUtils';
import { useRouter } from 'next/navigation';

// Custom styles for animations
const customStyles = `
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
`;

interface CartPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    onViewCart: () => void;
}

export default function CartPreview({ isOpen, onClose, onViewCart }: CartPreviewProps) {
    const [cartItems, setCartItems] = useState<CartMenuItem[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const router = useRouter();

    // Update cart data when component mounts or cart changes
    useEffect(() => {
        const updateCartData = () => {
            setCartItems(CartManager.getCartItems());
            setTotalPrice(CartManager.getTotalPrice());
        };

        // Initial load
        updateCartData();

        // Listen for cart updates
        const handleCartUpdate = () => {
            updateCartData();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    const updateQuantity = (cartItemId: string, change: number) => {
        const currentItem = cartItems.find(item => item.cartItemId === cartItemId);
        if (!currentItem) return;

        const newQuantity = (currentItem.quantity || 1) + change;
        
        if (newQuantity <= 0) {
            // Remove item from cart
            CartManager.removeFromCart(cartItemId);
        } else {
            // Update quantity
            CartManager.updateCartItemQuantity(cartItemId, newQuantity);
        }
    };

    const removeItem = (cartItemId: string) => {
        CartManager.removeFromCart(cartItemId);
    };

    if (!isOpen || cartItems.length === 0) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Cart Preview */}
            <div className="fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-slide-up">
                <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Your Cart</h3>
                                <p className="text-xs text-muted-foreground">
                                    {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="max-h-80 overflow-y-auto">
                        {cartItems.map((item) => (
                            <div key={item.cartItemId || item.id} className="flex items-center gap-3 p-4 border-b border-border/20 last:border-b-0">
                                {/* Item Image */}
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                    />
                                </div>

                                {/* Item Details */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground text-sm truncate">
                                        {item.name}
                                        {item.selectedVariant && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                                ({item.selectedVariant.name})
                                            </span>
                                        )}
                                    </h4>
                                    <div className="text-xs text-muted-foreground">
                                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                                            <div className="truncate">
                                                + {item.selectedAddons.map(addon => addon.name).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-sm font-semibold text-foreground">
                                            ₹{item.customPrice || item.price}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => updateQuantity(item.cartItemId || item.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
                                                >
                                                    <Minus className="w-3 h-3 text-muted-foreground" />
                                                </button>
                                                <span className="text-sm font-medium w-6 text-center">
                                                    {item.quantity || 1}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.cartItemId || item.id, 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
                                                >
                                                    <Plus className="w-3 h-3 text-muted-foreground" />
                                                </button>
                                            </div>
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removeItem(item.cartItemId || item.id)}
                                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash className="w-3 h-3 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border/30">
                        {/* Total */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-lg font-bold text-foreground">Total</span>
                            <span className="text-lg font-bold text-primary">₹{totalPrice.toFixed(2)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Continue Ordering
                            </button>
                            <button
                                onClick={onViewCart}
                                className="flex-1 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
