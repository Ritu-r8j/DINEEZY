'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart, Check, Globe } from 'lucide-react';
import { MenuItem } from '@/app/(utils)/firebaseOperations';
import { CartManager } from '@/app/(utils)/cartUtils';

interface EnhancedCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    menuItem: MenuItem;
    restaurantId: string;
    onSuccess?: () => void;
}

export default function EnhancedCartModal({ 
    isOpen, 
    onClose, 
    menuItem, 
    restaurantId,
    onSuccess 
}: EnhancedCartModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Auto-select first variant if available
    useEffect(() => {
        if (menuItem.variants && Array.isArray(menuItem.variants) && menuItem.variants.length > 0 && !selectedVariant) {
            setSelectedVariant(menuItem.variants[0]);
        }
    }, [menuItem.variants, selectedVariant]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setSelectedAddons([]);
            if (menuItem.variants && Array.isArray(menuItem.variants) && menuItem.variants.length > 0) {
                setSelectedVariant(menuItem.variants[0]);
            } else {
                setSelectedVariant(null);
            }
        }
    }, [isOpen, menuItem]);

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
        let basePrice = selectedVariant ? selectedVariant.price : menuItem.price;
        const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
        return basePrice + addonsPrice;
    };

    const handleAddToCart = async () => {
        setIsAdding(true);
        try {
            CartManager.addToCart(menuItem, quantity, restaurantId, selectedVariant, selectedAddons);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setIsAdding(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <style jsx>{`
                @keyframes modalFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .modal-animate {
                    animation: modalFadeIn 0.3s ease-out;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 w-full max-w-lg sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden modal-animate flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            Customize Your Order
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Select your preferences before adding to cart
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 min-h-0">
                    <div className="p-4 space-y-4">
                        {/* Product Overview */}
                        <div className="flex items-start gap-4">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                                {menuItem.video ? (
                                    <video
                                        src={menuItem.video}
                                        poster={menuItem.image}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLVideoElement;
                                            // Fallback to image if video fails
                                            const img = document.createElement('img');
                                            img.src = menuItem.image;
                                            img.alt = menuItem.name;
                                            img.className = "w-full h-full object-cover";
                                            target.parentNode?.replaceChild(img, target);
                                        }}
                                    />
                                ) : (
                                    <Image
                                        src={menuItem.image}
                                        alt={menuItem.name}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                                    {menuItem.name}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {menuItem.description}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        ₹{calculateTotalPrice()}
                                    </span>
                                    {selectedAddons.length > 0 && (
                                        <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                            +₹{selectedAddons.reduce((sum, addon) => sum + addon.price, 0)} extras
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Variants Section */}
                        {menuItem.variants && Array.isArray(menuItem.variants) && menuItem.variants.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center">
                                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Choose Size
                                    </h4>
                                    {selectedVariant && (
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                            {selectedVariant.name} selected
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {menuItem.variants.map((variant, index) => {
                                        const isSelected = selectedVariant?.name === variant.name;
                                        const priceDiff = variant.price - menuItem.price;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleVariantSelect(variant)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-blue-600'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-left">
                                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {variant.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm text-slate-600 dark:text-slate-400">
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
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? 'bg-blue-500 border-blue-500'
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                                                    }`}>
                                                        {isSelected && (
                                                            <Check className="w-4 h-4 text-white" />
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
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg flex items-center justify-center">
                                        <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Add Extras
                                    </h4>
                                    {selectedAddons.length > 0 && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                            {selectedAddons.length} selected
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {menuItem.addons.map((addon, index) => {
                                        const isSelected = selectedAddons.some(a => a.name === addon.name);
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleAddonToggle(addon)}
                                                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] ${
                                                    isSelected
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg'
                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-green-300 dark:hover:border-green-600'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="text-left flex-1">
                                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {addon.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                +₹{addon.price}
                                                            </span>
                                                            {isSelected && (
                                                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-medium">
                                                                    Added
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                                                    }`}>
                                                        {isSelected && (
                                                            <Check className="w-4 h-4 text-white" />
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
                        <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Quantity
                            </h4>
                            <div className="flex items-center justify-center">
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-2">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Minus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100 min-w-[2rem] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-500 transition-all"
                                    >
                                        <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with Order Summary and Add to Cart */}
                <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    {/* Order Summary */}
                    {(selectedVariant || selectedAddons.length > 0) && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 mb-4 border border-slate-200/50 dark:border-slate-700/50">
                            <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Order Summary</h5>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {selectedVariant ? selectedVariant.name : 'Regular'} × {quantity}
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        ₹{(selectedVariant ? selectedVariant.price : menuItem.price) * quantity}
                                    </span>
                                </div>
                                {selectedAddons.map((addon, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {addon.name} × {quantity}
                                        </span>
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            +₹{addon.price * quantity}
                                        </span>
                                    </div>
                                ))}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-bold">
                                    <span className="text-slate-900 dark:text-slate-100">Total</span>
                                    <span className="text-slate-900 dark:text-slate-100">₹{calculateTotalPrice() * quantity}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding || !(menuItem.isAvailable || menuItem.available)}
                            className="flex-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm"
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
                </div>
            </div>
        </div>
        </>
    );
}