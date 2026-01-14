import { MenuItem } from './firebaseOperations';

// Extended MenuItem interface for cart functionality
export interface CartMenuItem extends MenuItem {
    quantity?: number;
    selectedVariant?: any;
    selectedAddons?: any[];
    customPrice?: number; // Price including variant and addons
    cartItemId?: string; // Unique identifier for cart item (id + variant + addons)
}

// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Cart utility functions
export class CartManager {
    private static CART_KEY = 'cart';
    private static CART_COUNT_KEY = 'cartCount';
    private static RESTAURANT_ID_KEY = 'restaurantId';

    // Get cart items from localStorage
    static getCartItems(): CartMenuItem[] {
        if (!isBrowser) return [];
        try {
            const cartItems = localStorage.getItem(this.CART_KEY);
            const items = cartItems ? JSON.parse(cartItems) : [];
            
            // Add backward compatibility for items without cartItemId
            return items.map((item: CartMenuItem) => {
                if (!item.cartItemId) {
                    item.cartItemId = `${item.id}_default_none`;
                }
                return item;
            });
        } catch (error) {
            console.error('Error getting cart items:', error);
            return [];
        }
    }

    // Get cart count from localStorage
    static getCartCount(): number {
        if (!isBrowser) return 0;
        try {
            const cartCount = localStorage.getItem(this.CART_COUNT_KEY);
            return cartCount ? parseInt(cartCount) : 0;
        } catch (error) {
            console.error('Error getting cart count:', error);
            return 0;
        }
    }

    // Get restaurant ID from localStorage
    static getRestaurantId(): string | null {
        if (!isBrowser) return null;
        try {
            return localStorage.getItem(this.RESTAURANT_ID_KEY);
        } catch (error) {
            console.error('Error getting restaurant ID:', error);
            return null;
        }
    }

    // Add item to cart with variants and addons
    static addToCart(
        item: MenuItem,
        quantity: number = 1,
        restaurantId: string,
        selectedVariant?: any,
        selectedAddons?: any[]
    ): { success: boolean; cartItems: CartMenuItem[]; cartCount: number } {
        try {
            const existingCart = this.getCartItems();

            // Calculate custom price including variant and addons
            let customPrice = selectedVariant ? selectedVariant.price : item.price;
            if (selectedAddons && selectedAddons.length > 0) {
                customPrice += selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
            }

            // Create a unique identifier for items with different variants/addons
            const cartItemId = `${item.id}_${selectedVariant?.name || 'default'}_${selectedAddons?.map(a => a.name).sort().join(',') || 'none'}`;

            const existingItemIndex = existingCart.findIndex(cartItem => 
                cartItem.cartItemId === cartItemId
            );

            let updatedItems: CartMenuItem[];
            let newCartCount: number;

            if (existingItemIndex >= 0) {
                // Item with same variant/addons exists, update quantity
                updatedItems = existingCart.map((cartItem, index) =>
                    index === existingItemIndex
                        ? { ...cartItem, quantity: (cartItem.quantity || 1) + quantity }
                        : cartItem
                );
                newCartCount = this.getCartCount() + quantity;
            } else {
                // New item or different variant/addons combination
                const cartItem: CartMenuItem = {
                    ...item,
                    quantity,
                    selectedVariant,
                    selectedAddons: selectedAddons || [],
                    customPrice,
                    cartItemId
                };
                updatedItems = [...existingCart, cartItem];
                newCartCount = this.getCartCount() + quantity;
            }

            // Save to localStorage
            localStorage.setItem(this.CART_KEY, JSON.stringify(updatedItems));
            localStorage.setItem(this.CART_COUNT_KEY, newCartCount.toString());
            localStorage.setItem(this.RESTAURANT_ID_KEY, restaurantId);

            // Dispatch custom event for cart updates
            this.dispatchCartUpdate();

            return { success: true, cartItems: updatedItems, cartCount: newCartCount };
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, cartItems: this.getCartItems(), cartCount: this.getCartCount() };
        }
    }

    // Update item quantity in cart
    static updateCartItemQuantity(cartItemId: string, newQuantity: number): { success: boolean; cartItems: CartMenuItem[]; cartCount: number } {
        try {
            const existingCart = this.getCartItems();
            const itemIndex = existingCart.findIndex(cartItem => cartItem.cartItemId === cartItemId);

            if (itemIndex === -1) {
                return { success: false, cartItems: existingCart, cartCount: this.getCartCount() };
            }

            const currentQuantity = existingCart[itemIndex].quantity || 1;
            const quantityDifference = newQuantity - currentQuantity;

            let updatedItems: CartMenuItem[];
            let newCartCount: number;

            if (newQuantity <= 0) {
                // Remove item from cart
                updatedItems = existingCart.filter((_, index) => index !== itemIndex);
                newCartCount = this.getCartCount() - currentQuantity;
            } else {
                // Update quantity
                updatedItems = existingCart.map((cartItem, index) =>
                    index === itemIndex
                        ? { ...cartItem, quantity: newQuantity }
                        : cartItem
                );
                newCartCount = this.getCartCount() + quantityDifference;
            }

            // Save to localStorage
            localStorage.setItem(this.CART_KEY, JSON.stringify(updatedItems));
            localStorage.setItem(this.CART_COUNT_KEY, newCartCount.toString());

            // Dispatch custom event for cart updates
            this.dispatchCartUpdate();

            return { success: true, cartItems: updatedItems, cartCount: newCartCount };
        } catch (error) {
            console.error('Error updating cart item quantity:', error);
            return { success: false, cartItems: this.getCartItems(), cartCount: this.getCartCount() };
        }
    }

    // Remove item from cart
    static removeFromCart(cartItemId: string): { success: boolean; cartItems: CartMenuItem[]; cartCount: number } {
        try {
            const existingCart = this.getCartItems();
            const itemIndex = existingCart.findIndex(cartItem => cartItem.cartItemId === cartItemId);

            if (itemIndex === -1) {
                return { success: false, cartItems: existingCart, cartCount: this.getCartCount() };
            }

            const itemQuantity = existingCart[itemIndex].quantity || 1;
            const updatedItems = existingCart.filter((_, index) => index !== itemIndex);
            const newCartCount = this.getCartCount() - itemQuantity;

            // Save to localStorage
            localStorage.setItem(this.CART_KEY, JSON.stringify(updatedItems));
            localStorage.setItem(this.CART_COUNT_KEY, newCartCount.toString());

            // Dispatch custom event for cart updates
            this.dispatchCartUpdate();

            return { success: true, cartItems: updatedItems, cartCount: newCartCount };
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, cartItems: this.getCartItems(), cartCount: this.getCartCount() };
        }
    }

    // Clear entire cart
    static clearCart(): void {
        try {
            localStorage.removeItem(this.CART_KEY);
            localStorage.removeItem(this.CART_COUNT_KEY);
            localStorage.removeItem(this.RESTAURANT_ID_KEY);

            // Dispatch custom event for cart updates
            this.dispatchCartUpdate();
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    }

    // Get total price of cart
    static getTotalPrice(): number {
        try {
            const cartItems = this.getCartItems();
            return cartItems.reduce((total, item) => {
                const itemPrice = item.customPrice || item.price;
                return total + (itemPrice * (item.quantity || 1));
            }, 0);
        } catch (error) {
            console.error('Error calculating total price:', error);
            return 0;
        }
    }

    // Check if cart is from different restaurant
    static isDifferentRestaurant(currentRestaurantId: string): boolean {
        const savedRestaurantId = this.getRestaurantId();
        return savedRestaurantId !== null && savedRestaurantId !== currentRestaurantId;
    }

    // Get cart item by ID
    static getCartItem(cartItemId: string): CartMenuItem | null {
        try {
            const cartItems = this.getCartItems();
            return cartItems.find(item => item.cartItemId === cartItemId) || null;
        } catch (error) {
            console.error('Error getting cart item:', error);
            return null;
        }
    }

    // Dispatch custom event for cart updates
    private static dispatchCartUpdate(): void {
        try {
            // Dispatch custom event to notify components of cart changes
            const event = new CustomEvent('cartUpdated', {
                detail: {
                    cartItems: this.getCartItems(),
                    cartCount: this.getCartCount(),
                    totalPrice: this.getTotalPrice()
                }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Error dispatching cart update event:', error);
        }
    }
}
