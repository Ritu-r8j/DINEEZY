'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, ShoppingCart, Star, Clock, Flame, Sparkles } from 'lucide-react';
import { MenuItem } from '@/app/(utils)/firebaseOperations';

interface ProductInfoProps {
    menuItem: MenuItem;
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

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-4 xs:gap-6 lg:gap-8 animate-fade-in">
                {/* Enhanced Product Image */}
                <div className="relative group">
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

                    {/* Enhanced Availability Badge */}
                    <div className="absolute top-3 xs:top-4 right-3 xs:right-4">
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

                    {/* Enhanced Rating and Info */}
                    <div className="flex flex-wrap items-center gap-2 xs:gap-3">
                        <div className="flex items-center gap-1.5 bg-muted/50 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full shadow-sm border border-border/50">
                            <Star className="w-3 xs:w-4 h-3 xs:h-4 text-black fill-current" />
                            <span className="text-xs xs:text-sm font-bold text-foreground">4.5</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3 xs:w-4 h-3 xs:h-4" />
                            <span className="text-xs xs:text-sm font-medium">15-20 min</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Flame className="w-3 xs:w-4 h-3 xs:h-4" />
                            <span className="text-xs xs:text-sm font-medium">{menuItem.calories || '450'} cal</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-primary">
                            <Sparkles className="w-3 xs:w-4 h-3 xs:h-4" />
                            <span className="text-xs xs:text-sm font-medium">Chef's Special</span>
                        </div>
                    </div>

                    {/* Enhanced Price and Quantity */}
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 xs:gap-6 py-4 xs:py-6 border-y border-border/50">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl xs:text-3xl font-bold text-foreground">
                                    ₹{menuItem.price}
                                </span>
                                {(menuItem as any).originalPrice && (menuItem as any).originalPrice > menuItem.price && (
                                    <span className="text-lg text-muted-foreground line-through">
                                        ₹{(menuItem as any).originalPrice}
                                    </span>
                                )}
                            </div>
                            {(menuItem as any).originalPrice && (menuItem as any).originalPrice > menuItem.price && (
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs font-semibold">
                                    Save ₹{(menuItem as any).originalPrice - menuItem.price}
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
                            {menuItem.available ? `Add to Cart - ₹${menuItem.price * quantity}` : 'Currently Unavailable'}
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

                    {/* Enhanced Nutritional Information */}
                    <div className="space-y-3">
                        <h3 className="text-sm xs:text-base font-bold text-foreground flex items-center gap-2">
                            <div className="w-1 h-3 xs:h-4 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                            Nutritional Information
                        </h3>
                        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 xs:p-5 border border-border/50 shadow-sm">
                            <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 xs:gap-4">
                                {[
                                    { value: menuItem.calories || '450', label: 'Calories' },
                                    { value: (menuItem as any).protein || '25g', label: 'Protein' },
                                    { value: (menuItem as any).fat || '20g', label: 'Fat' },
                                    { value: (menuItem as any).carbs || '40g', label: 'Carbs' }
                                ].map((item, index) => (
                                    <div key={index} className="text-center">
                                        <div className="text-base xs:text-lg font-bold text-foreground">
                                            {item.value}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-medium mt-1">
                                            {item.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
