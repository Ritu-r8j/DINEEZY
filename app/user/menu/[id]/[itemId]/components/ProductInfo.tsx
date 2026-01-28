'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, ShoppingCart, Star, Clock, Flame, Sparkles, Heart, TrendingUp, Award } from 'lucide-react';
import { MenuItem } from '@/app/(utils)/firebaseOperations';

// Enhanced MenuItem interface
interface EnhancedMenuItem extends MenuItem {
    discountPrice?: number;
    currency?: string;
    isBestSeller?: boolean;
    isRecommended?: boolean;
    totalRatings?: number;
    totalOrders?: number;
    viewCount?: number;
    orderCount?: number;
}

interface ProductInfoProps {
    menuItem: EnhancedMenuItem;
    onAddToCart: (quantity: number) => void;
}

export default function ProductInfo({ menuItem, onAddToCart }: ProductInfoProps) {
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        if (quantity > 0) {
            onAddToCart(quantity);
        }
    };

    const handleQuantityChange = (newQuantity: number) => {
        const updatedQuantity = Math.max(1, newQuantity);
        setQuantity(updatedQuantity);
    };

    // Helper functions
    const hasDiscount = () => {
        return !!(menuItem.discountPrice && menuItem.discountPrice < menuItem.price);
    };

    const getDiscountPercentage = () => {
        if (!hasDiscount()) return 0;
        return Math.round(((menuItem.price - menuItem.discountPrice!) / menuItem.price) * 100);
    };

    const formatCurrency = (amount: number) => {
        const symbol = menuItem.currency === 'INR' ? '₹' : '$';
        return `${symbol}${amount.toFixed(2)}`;
    };

    const getCurrentPrice = () => {
        return hasDiscount() ? menuItem.discountPrice! : menuItem.price;
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-4 xs:gap-6 lg:gap-8 animate-fade-in">
                {/* Enhanced Product Image */}
                <div className="relative group space-y-4">
                    {/* Video Section - Moved to top if present */}
                    {menuItem.video && (
                        <div className="aspect-video rounded-2xl xs:rounded-3xl overflow-hidden shadow-xl bg-card relative">
                            <video
                                src={menuItem.video}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover rounded-2xl xs:rounded-3xl"
                                poster={menuItem.image}
                                preload="auto"
                            >
                                Your browser does not support the video tag.
                            </video>
                            {/* Video Badge */}
                            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                Video Preview
                            </div>
                        </div>
                    )}

                    {/* Main Image */}
                    <div className="aspect-square rounded-2xl xs:rounded-3xl overflow-hidden shadow-xl bg-card relative">
                        <Image
                            src={menuItem.image}
                            alt={menuItem.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500 rounded-2xl xs:rounded-3xl"
                            priority
                        />
                        {/* Enhanced Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl xs:rounded-3xl"></div>
                    </div>

                    {/* Enhanced Badges Container */}
                    <div className="absolute top-3 xs:top-4 right-3 xs:right-4 flex flex-col gap-2">
                        {/* Discount Badge */}
                        {hasDiscount() && (
                            <div className="bg-red-500 text-white px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-bold backdrop-blur-sm shadow-lg border border-white/20">
                                {getDiscountPercentage()}% OFF
                            </div>
                        )}
                        
                        {/* Best Seller Badge */}
                        {menuItem.isBestSeller && (
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg text-xs xs:text-sm font-semibold backdrop-blur-sm shadow-md border border-amber-400/30 flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                <span>Best Seller</span>
                            </div>
                        )}
                        
                        {/* Recommended Badge */}
                        {menuItem.isRecommended && (
                            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg text-xs xs:text-sm font-semibold backdrop-blur-sm shadow-md border border-emerald-400/30 flex items-center gap-1">
                                <Heart className="w-3 h-3 fill-current" />
                                <span>Recommended</span>
                            </div>
                        )}
                        
                        {/* Availability Badge */}
                        <div
                            className={`flex items-center gap-1.5 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-semibold backdrop-blur-sm shadow-lg border ${
                                menuItem.available
                                    ? 'bg-green-100/90 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200/50 dark:border-green-700/50'
                                    : 'bg-red-100/90 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200/50 dark:border-red-700/50'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                                menuItem.available ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            {menuItem.available ? 'Available Now' : 'Currently Unavailable'}
                        </div>
                    </div>
                </div>

                {/* Enhanced Product Info */}
                <div className="space-y-4 xs:space-y-6">
                    {/* Title and Description */}
                    <div className="space-y-3 xs:space-y-4">
                        <h1 className="text-2xl xs:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                            {menuItem.name}
                        </h1>
                        <p className="text-muted-foreground text-sm xs:text-base leading-relaxed">
                            {menuItem.description}
                        </p>
                    </div>

          
                    {/* Enhanced Price and Quantity */}
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 xs:gap-6 py-4 xs:py-6 border-y border-border/50">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-baseline gap-2">
                                {hasDiscount() ? (
                                    <>
                                        <span className="text-2xl xs:text-3xl font-bold text-green-600 dark:text-green-400">
                                            {formatCurrency(menuItem.discountPrice!)}
                                        </span>
                                        <span className="text-lg text-muted-foreground line-through">
                                            {formatCurrency(menuItem.price)}
                                        </span>
                                        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs font-semibold">
                                            Save {formatCurrency(menuItem.price - menuItem.discountPrice!)}
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-2xl xs:text-3xl font-bold text-foreground">
                                        {formatCurrency(menuItem.price)}
                                    </span>
                                )}
                            </div>
                            
                            {/* Total Orders Display */}
                            {(menuItem.totalOrders || 0) > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <TrendingUp className="w-3 h-3" />
                                    <span>{menuItem.totalOrders} orders placed</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1.5 shadow-inner border border-border/50">
                            <button
                                onClick={() => handleQuantityChange(quantity - 1)}
                                disabled={quantity <= 1}
                                className="w-7 xs:w-8 h-7 xs:h-8 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Minus className="w-3 xs:w-4 h-3 xs:h-4 text-muted-foreground" />
                            </button>
                            <span className="text-base xs:text-lg font-bold text-foreground min-w-[1.5rem] xs:min-w-[2rem] text-center">
                                {quantity}
                            </span>
                            <button
                                onClick={() => handleQuantityChange(quantity + 1)}
                                className="w-7 xs:w-8 h-7 xs:h-8 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-all shadow-sm"
                            >
                                <Plus className="w-3 xs:w-4 h-3 xs:h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Enhanced Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={!menuItem.available}
                        className={`w-full py-3 xs:py-4 px-4 xs:px-6 rounded-xl font-bold text-sm xs:text-base transition-all flex items-center justify-center gap-2 xs:gap-3 relative overflow-hidden ${
                            menuItem.available
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                    >
                        <ShoppingCart className="w-4 xs:w-5 h-4 xs:h-5" />
                        <span>
                            {menuItem.available ? `Add to Cart - ${formatCurrency(getCurrentPrice() * quantity)}` : 'Currently Unavailable'}
                        </span>
                        {menuItem.available && (
                            <Plus className="w-4 xs:w-5 h-4 xs:h-5" />
                        )}
                    </button>

                    {/* Enhanced Ingredients */}
                    <div className="space-y-3">
                        <h3 className="text-sm xs:text-base font-bold text-foreground flex items-center gap-2">
                            <div className="w-1 h-3 xs:h-4 bg-gradient-to-b from-muted-foreground to-foreground rounded-full"></div>
                            Premium Ingredients
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {menuItem.ingredients && menuItem.ingredients.length > 0 ? (
                                (Array.isArray(menuItem.ingredients)
                                    ? menuItem.ingredients
                                    : (menuItem.ingredients as string).split(',')
                                ).map((ingredient: string, index: number) => {
                                    const trimmedIngredient = ingredient.trim();
                                    if (!trimmedIngredient) return null;

                                    return (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold bg-card/80 border border-border/50 shadow-sm hover:shadow-md transition-all hover:scale-105"
                                        >
                                            {trimmedIngredient}
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="inline-flex items-center px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold bg-card/80 border border-border/50 shadow-sm">
                                    Fresh, locally-sourced ingredients
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Allergens */}
                    {menuItem.allergens && menuItem.allergens.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm xs:text-base font-bold text-foreground flex items-center gap-2">
                                <div className="w-1 h-3 xs:h-4 bg-gradient-to-b from-orange-400 to-red-500 rounded-full"></div>
                                Allergen Information
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(menuItem.allergens)
                                    ? menuItem.allergens
                                    : (menuItem.allergens as string).split(',')
                                ).map((allergen: string, index: number) => {
                                    const trimmedAllergen = allergen.trim();
                                    if (!trimmedAllergen) return null;

                                    return (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-700/50 shadow-sm hover:shadow-md transition-all hover:scale-105"
                                        >
                                            {trimmedAllergen}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {menuItem.tags && menuItem.tags.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm xs:text-base font-bold text-foreground flex items-center gap-2">
                                <div className="w-1 h-3 xs:h-4 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(menuItem.tags)
                                    ? menuItem.tags
                                    : (menuItem.tags as string).split(',')
                                ).map((tag: string, index: number) => {
                                    const trimmedTag = tag.trim();
                                    if (!trimmedTag) return null;

                                    return (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all hover:scale-105"
                                        >
                                            {trimmedTag}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Enhanced Nutritional Information */}
                    {menuItem.nutritionalInfo && Object.values(menuItem.nutritionalInfo).some(value => value !== undefined && value !== null) && (
                        <div className="space-y-3">
                            <h3 className="text-sm xs:text-base font-bold text-foreground flex items-center gap-2">
                                <div className="w-1 h-3 xs:h-4 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                                Nutritional Information
                            </h3>
                            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 xs:p-5 border border-border/50 shadow-sm">
                                <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 xs:gap-4">
                                    {menuItem.nutritionalInfo.calories && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.calories}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Calories
                                            </div>
                                        </div>
                                    )}
                                    {menuItem.nutritionalInfo.protein && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.protein}g
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Protein
                                            </div>
                                        </div>
                                    )}
                                    {menuItem.nutritionalInfo.fat && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.fat}g
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Fat
                                            </div>
                                        </div>
                                    )}
                                    {menuItem.nutritionalInfo.carbs && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.carbs}g
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Carbs
                                            </div>
                                        </div>
                                    )}
                                    {menuItem.nutritionalInfo.fiber && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.fiber}g
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Fiber
                                            </div>
                                        </div>
                                    )}
                                    {menuItem.nutritionalInfo.sugar && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.sugar}g
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Sugar
                                            </div>
                                        </div>
                                    )}
                                    {menuItem.nutritionalInfo.sodium && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.sodium}mg
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Sodium
                                            </div>
                                        </div>
                                    )}
                                    {menuItem.nutritionalInfo.cholesterol && (
                                        <div className="text-center">
                                            <div className="text-base xs:text-lg font-bold text-foreground">
                                                {menuItem.nutritionalInfo.cholesterol}mg
                                            </div>
                                            <div className="text-xs text-muted-foreground font-medium mt-1">
                                                Cholesterol
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
