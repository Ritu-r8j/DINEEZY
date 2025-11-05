'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '@/app/(utils)/firebaseOperations';

interface CartContextType {
    showCart: boolean;
    customizationMode: boolean;
    menuItem: MenuItem | null;
    restaurantId: string | null;
    
    openCart: () => void;
    closeCart: () => void;
    openCustomization: (item: MenuItem, restaurantId: string) => void;
    closeCustomization: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [showCart, setShowCart] = useState(false);
    const [customizationMode, setCustomizationMode] = useState(false);
    const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);

    const openCart = () => {
        setShowCart(true);
        setCustomizationMode(false);
    };

    const closeCart = () => {
        setShowCart(false);
        setCustomizationMode(false);
        setMenuItem(null);
        setRestaurantId(null);
    };

    const openCustomization = (item: MenuItem, restId: string) => {
        setMenuItem(item);
        setRestaurantId(restId);
        setCustomizationMode(true);
        setShowCart(true);
    };

    const closeCustomization = () => {
        setCustomizationMode(false);
        setMenuItem(null);
        setRestaurantId(null);
        // Keep cart open but switch to regular cart view
    };

    return (
        <CartContext.Provider value={{
            showCart,
            customizationMode,
            menuItem,
            restaurantId,
            openCart,
            closeCart,
            openCustomization,
            closeCustomization
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}