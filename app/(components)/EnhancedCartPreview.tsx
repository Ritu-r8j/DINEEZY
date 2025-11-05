'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart, Trash, Check, Globe } from 'lucide-react';
import { CartManager, CartMenuItem } from '@/app/(utils)/cartUtils';
import { MenuItem } from '@/app/(utils)/firebaseOperations';
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
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

interface EnhancedCartPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    onViewCart: () => void;
    // New props for customization
    customizationMode?: boolean;
    menuItem?: MenuItem;
    restaurantId?: string;
    onCustomizationComplete?: () => void;
}

export default function EnhancedCartPreview({ 
    isOpen, 
    onClose, 
    onViewCart,
    customizationMode = false,
    menuItem,
    restaurantId,
    onCustomizationComplete
}: EnhancedCartPreviewProps) {
    const [cartItems, setCartItems] = useState<CartMenuItem[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const router = useRouter();

    // Customization state
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Auto-select first variant if available
    useEffect(() => {
        if (customizationMode && menuItem?.variants && Array.isArray(menuItem.variants) && menuItem.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(menuItem.variants[0]);
        }
    }, [customizationMode, menuItem?.variants, selectedVariant]);

    // Reset customization state when modal opens/closes
    useEffect(() => {
        if (customizationMode && isOpen && menuItem) {
            setQuantity(1);
            setSelectedAddons([]);
            if (menuItem.variants && Array.isArray(menuItem.variants) && menuItem.variants.length > 0) {
                setSelectedVariant(menuItem.variants[0]);
            } else {
                setSelectedVariant(null);
            }
        }
    }, [customizationMode, isOpen, menuItem]);

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
            CartManager.removeFromCart(cartItemId);
        } else {
            CartManager.updateCartItemQuantity(cartItemId, newQuantity);
        }
    };

    const removeItem = (cartItemId: string) => {
        CartManager.removeFromCart(cartItemId);
    };

    // Customization handlers
    const handleVariantSelect = (variant: any) => {
        setSelectedVariant(variant);
    };

    const handleAddonToggle = (addon: any) => {
        setSelectedAddons(prev => {
            const isSelected = prev.some(a => a.name === addon.name);
            if (isSelected) {
                return prev.filter(a => a.name !== addon.name);
            } else {
                return [...prev, addon];
            }
        });
    };

    const calculateTotalPrice = () => {
        if (!menuItem) return 0;
        let basePrice = selectedVariant ? selectedVariant.price : menuItem.price;
        const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        return basePrice + addonsPrice;
    };

    const handleAddToCart = async () => {
        if (!menuItem || !restaurantId) return;
        
        setIsAdding(true);
        try {
            CartManager.addToCart(menuItem, quantity, restaurantId, selectedVariant, selectedAddons);
            onCustomizationComplete?.();
            // Don't close the cart, just switch back to cart view
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAdding(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: customStyles }} />
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Enhanced Cart Preview */}
            <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-slide-up">
                <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    {customizationMode ? 'Customize Your Order' : 'Your Cart'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {customizationMode 
                                        ? 'Select your preferences' 
                                        : `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`
                                    }
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {customizationMode && menuItem ? (
                            /* Customization Content */
                            <div className="p-3 space-y-3">
                                {/* Product Overview */}
                                <div className="flex items-start gap-2">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                        <Image
                                            src={menuItem.image}
                                            alt={menuItem.name}
                                            fill
                                            className="object-cover"
                                            sizes="48px"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-foreground text-sm truncate">
                                            {menuItem.name}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {menuItem.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-lg font-bold text-foreground">
                                                ₹{calculateTotalPrice()}
                                            </span>
                                            {selectedAddons.length > 0 && (
                                                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                                    +₹{selectedAddons.reduce((sum, addon) => sum + addon.price, 0)} extras
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Variants Section */}
                                {menuItem.variants && Array.isArray(menuItem.variants) && menuItem.variants.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <h5 className="font-semibold text-foreground text-sm">Choose Size</h5>
                                        </div>
                                        <div className="space-y-2">
                                            {menuItem.variants.map((variant, index) => {
                                                const isSelected = selectedVariant?.name === variant.name;
                                                const priceDiff = variant.price - menuItem.price;
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleVariantSelect(variant)}
                                                        className={`w-full p-2 rounded-lg border transition-all text-left ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                                : 'border-border bg-muted/30 hover:border-blue-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium text-foreground text-sm">
                                                                    {variant.name}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ₹{variant.price}
                                                                    </span>
                                                                    {priceDiff !== 0 && (
                                                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                                                            priceDiff > 0 
                                                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                                        }`}>
                                                                            {priceDiff > 0 ? '+' : ''}₹{priceDiff}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'bg-blue-500 border-blue-500'
                                                                    : 'border-muted-foreground/30'
                                                            }`}>
                                                                {isSelected && (
                                                                    <Check className="w-3 h-3 text-white" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Add-ons Section */}
                                {menuItem.addons && Array.isArray(menuItem.addons) && menuItem.addons.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            <h5 className="font-semibold text-foreground text-sm">Add Extras</h5>
                                        </div>
                                        <div className="space-y-2">
                                            {menuItem.addons.map((addon, index) => {
                                                const isSelected = selectedAddons.some(a => a.name === addon.name);
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleAddonToggle(addon)}
                                                        className={`w-full p-2 rounded-lg border transition-all text-left ${
                                                            isSelected
                                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                                : 'border-border bg-muted/30 hover:border-green-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium text-foreground text-sm">
                                                                    {addon.name}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground">
                                                                    +₹{addon.price}
                                                                </span>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'bg-green-500 border-green-500'
                                                                    : 'border-muted-foreground/30'
                                                            }`}>
                                                                {isSelected && (
                                                                    <Check className="w-3 h-3 text-white" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Section */}
                                <div className="space-y-2">
                                    <h5 className="font-semibold text-foreground text-sm">Quantity</h5>
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center gap-1 bg-muted rounded-lg px-3 py-2">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                                className="w-8 h-8 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-all disabled:opacity-50"
                                            >
                                                <Minus className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <span className="text-lg font-bold text-foreground min-w-[2rem] text-center">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-8 h-8 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-all"
                                            >
                                                <Plus className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Regular Cart Items */
                            cartItems.map((item) => (
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
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 p-3 border-t border-border/30">
                        {customizationMode && menuItem ? (
                            /* Customization Footer */
                            <div className="space-y-3">
                                {/* Order Summary */}
                                {(selectedVariant || selectedAddons.length > 0) && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-xs">
                                        <div className="font-semibold text-foreground mb-2">Order Summary</div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    {selectedVariant ? selectedVariant.name : 'Regular'} × {quantity}
                                                </span>
                                                <span className="font-medium text-foreground">
                                                    ₹{(selectedVariant ? selectedVariant.price : menuItem.price) * quantity}
                                                </span>
                                            </div>
                                            {selectedAddons.map((addon, index) => (
                                                <div key={index} className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        {addon.name} × {quantity}
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                        +₹{addon.price * quantity}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="border-t border-border pt-1 flex justify-between font-bold">
                                                <span className="text-foreground">Total</span>
                                                <span className="text-foreground">₹{calculateTotalPrice() * quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isAdding || !(menuItem.isAvailable || menuItem.available)}
                                    className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAdding ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-4 h-4" />
                                            Add to Cart - ₹{calculateTotalPrice() * quantity}
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            /* Regular Cart Footer */
                            <>
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
                                        className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}