'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ChevronLeft, ChevronRight, Check, ChevronUp, ChevronDown, CircleCheck } from 'lucide-react';
import styles from './checkout.module.css';
import {
    getRestaurantSettings,
    MenuItem,
    createOrder,
    OrderData,
    getUserReservations,
    ReservationData
} from '@/app/(utils)/firebaseOperations';
import { CartManager, CartMenuItem } from '@/app/(utils)/cartUtils';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { toast } from 'sonner';
import { sendNotification } from '@/app/(utils)/notification';

// Use CartMenuItem from cartUtils instead of local interface

interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
    selected: boolean;
}

interface OrderType {
    id: string;
    name: string;
    description: string;
    icon: string;
    selected: boolean;
}

interface DeliveryOption {
    id: string;
    name: string;
    description: string;
    time: string;
    price: number;
    selected: boolean;
}

export default function Checkout() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading } = useAuth();
    const [cartItems, setCartItems] = useState<CartMenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    // Customer information form state
    const [customerInfo, setCustomerInfo] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    const [orderTypes, setOrderTypes] = useState<OrderType[]>([
        { id: 'dine-in', name: 'Dine In', description: 'Eat at the restaurant', icon: '🍽️', selected: true },
        { id: 'takeaway', name: 'Takeaway', description: 'Pick up in 20-30 min', icon: '🥡', selected: false },
        // { id: 'delivery', name: 'Delivery', description: 'Deliver to your address', icon: '🚚', selected: false }
    ]);

    const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([
        { id: 'standard', name: 'Standard Delivery', description: '30-45 min', time: '30-45 min', price: 3.99, selected: true },
        { id: 'express', name: 'Express Delivery', description: '15-25 min', time: '15-25 min', price: 6.99, selected: false },
        { id: 'scheduled', name: 'Scheduled Delivery', description: 'Choose your time', time: 'Custom', price: 2.99, selected: false }
    ]);

    const [specialInstructions, setSpecialInstructions] = useState('');
    const [tablePreference, setTablePreference] = useState('');
    const [diningPreferences, setDiningPreferences] = useState({
        windowSeat: false,
        quietArea: false,
        highChair: false,
        wheelchairAccessible: false
    });

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([

        { id: 'card', name: 'Credit/Debit Card', icon: '💳', selected: true },
        { id: 'upi', name: 'UPI', icon: '📱', selected: false },
        { id: 'cash', name: 'Cash on Delivery', icon: '💵', selected: false }
    ]);

    const [promoCode, setPromoCode] = useState('');
    
    // Reservation selection state
    const [userReservations, setUserReservations] = useState<any[]>([]);
    const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
    const [loadingReservations, setLoadingReservations] = useState(false);

    // Load cart items and restaurant info on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const cartItems = CartManager.getCartItems();
                const restaurantId = CartManager.getRestaurantId();

                if (cartItems.length > 0) {
                    setCartItems(cartItems);
                } else {
                    router.back();
                    return;
                }

                // Fetch restaurant info if we have a restaurant ID
                if (restaurantId) {
                    const restaurantResult = await getRestaurantSettings(restaurantId);
                    if (restaurantResult.success && restaurantResult.data) {
                        setRestaurantInfo(restaurantResult.data);
                    }
                }

                // Load user reservations if logged in
                if (user && restaurantId) {
                    setLoadingReservations(true);
                    const reservationsResult = await getUserReservations(user.uid);
                    if (reservationsResult.success && reservationsResult.data) {
                        // Filter reservations for this restaurant that are upcoming (confirmed or pending)
                        const restaurantReservations = reservationsResult.data.filter(
                            (res: ReservationData) => 
                                res.restaurantId === restaurantId && 
                                (res.status === 'confirmed' || res.status === 'pending')
                        );
                        setUserReservations(restaurantReservations);
                        
                        // Auto-select if there's a pre-order reservation ID in localStorage
                        const preOrderReservationId = localStorage.getItem('preOrderReservationId');
                        if (preOrderReservationId) {
                            const matchingReservation = restaurantReservations.find(
                                (res: ReservationData) => res.id === preOrderReservationId
                            );
                            if (matchingReservation) {
                                setSelectedReservation(preOrderReservationId);
                            }
                            // Clear the localStorage after using it
                            localStorage.removeItem('preOrderReservationId');
                            localStorage.removeItem('preOrderRestaurantId');
                        }
                    }
                    setLoadingReservations(false);
                }

            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load checkout data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [router, user]);

    // Populate customer information from user data if logged in
    useEffect(() => {
        if (user && userProfile) {
            setCustomerInfo({
                firstName: userProfile.displayName?.split(' ')[0] || user.displayName?.split(' ')[0] || '',
                lastName: userProfile.displayName?.split(' ').slice(1).join(' ') || user.displayName?.split(' ').slice(1).join(' ') || '',
                phone: userProfile.phoneNumber || ''
            });
        }
    }, [user, userProfile]);

    // Auto-progression logic
    useEffect(() => {
        // Auto-advance to next step when current step is completed
        if (currentStep === 1 && isStep1Valid()) {
            // Don't auto-advance from step 1, let user manually proceed
        } else if (currentStep === 2 && isStep2Valid()) {
            // Don't auto-advance from step 2, let user manually proceed
        }
    }, [currentStep, customerInfo, orderTypes]);

    const selectOrderType = (typeId: string) => {
        setOrderTypes(types =>
            types.map(type => ({
                ...type,
                selected: type.id === typeId
            }))
        );
    };

    const selectDeliveryOption = (optionId: string) => {
        setDeliveryOptions(options =>
            options.map(option => ({
                ...option,
                selected: option.id === optionId
            }))
        );
    };

    const selectPaymentMethod = (methodId: string) => {
        setPaymentMethods(methods =>
            methods.map(method => ({
                ...method,
                selected: method.id === methodId
            }))
        );
    };

    const updateQuantity = (cartItemId: string, change: number) => {
        const currentItem = cartItems.find(item => item.cartItemId === cartItemId);
        if (!currentItem) return;

        const newQuantity = (currentItem.quantity || 1) + change;

        if (newQuantity <= 0) {
            // Remove item from cart
            const result = CartManager.removeFromCart(cartItemId);
            if (result.success) {
                setCartItems(result.cartItems);
                if (result.cartItems.length === 0) {
                    router.back();
                }
            }
        } else {
            // Update quantity
            const result = CartManager.updateCartItemQuantity(cartItemId, newQuantity);
            if (result.success) {
                setCartItems(result.cartItems);
            }
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + ((item.customPrice || item.price) * (item.quantity || 1)), 0);
    const selectedDeliveryOption = deliveryOptions.find(option => option.selected);
    const selectedOrderType = orderTypes.find(type => type.selected);
    const deliveryFee = selectedOrderType?.id === 'delivery' ? (selectedDeliveryOption?.price || 0) : 0;
    const discount = promoCode ? -2.50 : 0;
    const taxRate = 0;
    const tax = (subtotal + deliveryFee) * taxRate;
    const total = subtotal + deliveryFee + discount + tax;

    const estimatedTime = selectedOrderType?.id === 'takeaway' ? '20-30 minutes' :
        selectedOrderType?.id === 'delivery' ? selectedDeliveryOption?.time || '30-45 minutes' :
            'Ready when you arrive';

    // Step validation functions
    const isStep1Valid = () => {
        return customerInfo.firstName.trim() !== '' &&
            customerInfo.phone.trim() !== '';
    };

    const isStep2Valid = () => {
        return true; // Special instructions are optional
    };

    const isStep3Valid = () => {
        return paymentMethods.some(method => method.selected);
    };

    // Form validation (overall)
    const isFormValid = () => {
        return isStep1Valid() && isStep2Valid() && isStep3Valid();
    };

    // Navigation functions
    const nextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const goToStep = (step: number) => {
        if (step >= 1 && step <= 3) {
            setCurrentStep(step);
        }
    };

    // Place order function
    const placeOrder = async () => {
        if (!isFormValid()) {
            setError('Please fill in all required fields');
            return;
        }

        setIsPlacingOrder(true);
        setError(null);



        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get restaurant ID from localStorage
            const restaurantId = localStorage.getItem('restaurantId');
            if (!restaurantId) {
                throw new Error('Restaurant ID not found');
            }

            // Generate meaningful order ID
            const generateOrderId = () => {
                const now = new Date();
                const year = now.getFullYear().toString().slice(-2);
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const day = now.getDate().toString().padStart(2, '0');
                const hour = now.getHours().toString().padStart(2, '0');
                const minute = now.getMinutes().toString().padStart(2, '0');
                const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();

                return `ORD${year}${month}${day}${hour}${minute}${randomSuffix}`;
            };

            // Generate or get guest session ID for guest users
            let guestSessionId = null;
            if (!user) {
                // Check if guest session already exists
                guestSessionId = localStorage.getItem('guestSessionId');
                if (!guestSessionId) {
                    // Generate new guest session ID
                    guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    localStorage.setItem('guestSessionId', guestSessionId);
                }
            }

            // Generate meaningful order ID
            const orderId = generateOrderId();

            // Create order data for database
            const orderData = {
                orderId, // Include the meaningful order ID
                customerInfo,
                items: cartItems.map(item => ({
                    id: item.id.toString(),
                    name: item.name,
                    quantity: item.quantity || 1,
                    price: item.customPrice || item.price,
                    image: item.image,
                    // Include customization details
                    selectedVariant: item.selectedVariant || null,
                    selectedAddons: item.selectedAddons || [],
                    customPrice: item.customPrice || item.price
                })),
                orderType: selectedOrderType?.id || 'takeaway',
                deliveryOption: selectedOrderType?.id === 'delivery' ? selectedDeliveryOption : null,
                paymentMethod: paymentMethods.find(m => m.selected)?.id || 'card',
                specialInstructions,
                subtotal,
                deliveryFee,
                tax,
                discount,
                total,
                estimatedTime,
                status: 'pending' as const, // Start as pending, restaurant will accept to confirm
                restaurantId,
                ...(selectedOrderType?.id === 'dine-in' && {
                    tablePreference,
                    diningPreferences
                }),
                ...(user?.uid && { userId: user.uid }), // Only include userId if user is logged in
                ...(guestSessionId && { guestSessionId }), // Include guest session ID for guest users
                isGuest: !user, // Track if this is a guest order
                ...(selectedReservation && { reservationId: selectedReservation }) // Link to reservation if selected
            };

            // Save order to database
            const orderResult = await createOrder(orderData);

            if (!orderResult.success) {
                throw new Error(orderResult.error || 'Failed to create order');
            }

            // Also save to localStorage for immediate access (backup)
            const order = {
                id: orderId, // Use the meaningful order ID
                ...orderData,
                createdAt: new Date().toISOString()
            };

            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            existingOrders.push(order);
            localStorage.setItem('orders', JSON.stringify(existingOrders));

            // Clear cart
            CartManager.clearCart();

            toast.success("Order Placed Successfully!", {
                icon: <CircleCheck className="size-5 text-green-500" />,

            });
            await sendNotification(
                'ORDER_CONFIRMED',
                customerInfo.phone,
                {
                    name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim() || 'User',
                    orderId: orderId,
                    time: '15-20',
                    restaurant: restaurantInfo?.name || 'Restaurant'
                }
            );
            router.push('/user/orders');

        } catch (err) {
            console.error('Error placing order:', err);
            setError('Failed to place order. Please try again.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    // Show loading state while cart items are being loaded
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-black-600 dark:text-white-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Loading your cart...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !isPlacingOrder) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Error Loading Checkout</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Show empty cart message if no items
    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Your cart is empty</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Add some delicious items from our menu</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                    >
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-zinc-950 dark:to-slate-900">
            <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 pb-20 lg:pb-6 max-w-7xl">
                {/* Page Title */}
                <div className={`text-center mb-3 sm:mb-4 md:mb-6 ${styles.fadeInUp}`}>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">Checkout</h1>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">Complete your order in a few simple steps</p>
                </div>

                {/* Step Navigation */}
                <div className={`mb-3 sm:mb-4 md:mb-6 ${styles.staggerIn} ${styles.stepNavigationContainer}`}>
                    <div className="flex items-center justify-center px-4 py-2">
                        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8 max-w-full">
                            {/* Step 1 */}
                            <div className="flex items-center min-w-0 flex-shrink-0">
                                <div
                                    className={`${styles.stepCircle} w-10 h-10 sm:w-11 sm:h-11 md:w-13 md:h-13 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg font-bold transition-all duration-300 shadow-lg ${currentStep >= 1
                                        ? 'bg-gray-900 dark:bg-gray-700 text-white ring-4 ring-gray-400 dark:ring-gray-500'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 ring-4 ring-transparent'
                                        }`}
                                    style={{ padding: '8px' }}
                                >
                                    {currentStep > 1 ? <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <span className="leading-none">1</span>}
                                </div>
                                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm md:text-base font-semibold transition-colors hidden sm:inline ${currentStep === 1
                                    ? 'text-gray-900 dark:text-gray-300'
                                    : currentStep > 1
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    Order Type
                                </span>
                            </div>

                            {/* Connector Line */}
                            <div className={`w-8 sm:w-10 md:w-16 lg:w-20 h-1 transition-colors ${currentStep >= 2
                                ? 'bg-gray-900 dark:bg-gray-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                                }`}></div>

                            {/* Step 2 */}
                            <div className="flex items-center min-w-0 flex-shrink-0">
                                <div
                                    className={`${styles.stepCircle} w-10 h-10 sm:w-11 sm:h-11 md:w-13 md:h-13 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg font-bold transition-all duration-300 shadow-lg ${currentStep >= 2
                                        ? 'bg-gray-900 dark:bg-gray-700 text-white ring-4 ring-gray-400 dark:ring-gray-500'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 ring-4 ring-transparent'
                                        }`}
                                    style={{ padding: '8px' }}
                                >
                                    {currentStep > 2 ? <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <span className="leading-none">2</span>}
                                </div>
                                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm md:text-base font-semibold transition-colors hidden xs:inline ${currentStep === 2
                                    ? 'text-gray-900 dark:text-gray-300'
                                    : currentStep > 2
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    Details
                                </span>
                            </div>

                            {/* Connector Line */}
                            <div className={`w-8 sm:w-10 md:w-16 lg:w-20 h-1 transition-colors ${currentStep >= 3
                                ? 'bg-gray-900 dark:bg-gray-600'
                                : 'bg-gray-200 dark:bg-gray-700'
                                }`}></div>

                            {/* Step 3 */}
                            <div className="flex items-center min-w-0 flex-shrink-0">
                                <div
                                    className={`${styles.stepCircle} w-10 h-10 sm:w-11 sm:h-11 md:w-13 md:h-13 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-sm sm:text-base md:text-lg font-bold transition-all duration-300 shadow-lg ${currentStep >= 3
                                        ? 'bg-gray-900 dark:bg-gray-700 text-white ring-4 ring-gray-400 dark:ring-gray-500'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 ring-4 ring-transparent'
                                        }`}
                                    style={{ padding: '8px' }}
                                >
                                    <span className="leading-none">3</span>
                                </div>
                                <span className={`ml-1 sm:ml-2 text-xs sm:text-sm md:text-base font-semibold transition-colors hidden xs:inline ${currentStep === 3
                                    ? 'text-gray-900 dark:text-gray-300'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    Payment
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {/* Left Column - Step Content */}
                    <div className="xl:col-span-2">
                        <div className={`bg-white dark:bg-background/70 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-gray-200 dark:border-foreground/5 p-3 sm:p-4 md:p-6 dark:hover:border-primary/20 transition-all duration-300 ${styles.staggerIn}`}>
                            {/* Step 1: Order Type */}
                            {currentStep === 1 && (
                                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                    <div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Order Type & Information</h2>

                                        {/* Customer Information */}
                                        <div className="mb-4 sm:mb-6">
                                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Customer Information</h3>

                                            {user ? (
                                                <div className="space-y-3">
                                                    <div className="bg-white dark:bg-background/70 border border-gray-200 dark:border-foreground/5 rounded-lg p-3 mb-3 dark:hover:border-primary/20 transition-all duration-300">
                                                        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-300">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="text-xs sm:text-sm font-medium">Using your account information</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                                        <div>
                                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                First Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={customerInfo.firstName}
                                                                onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                                                                placeholder="Enter your first name"
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Last Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={customerInfo.lastName}
                                                                onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                                                                placeholder="Enter your last name"
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Phone Number *
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                value={customerInfo.phone}
                                                                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                                                placeholder="(555) 123-4567"
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="bg-white dark:bg-background/70 border border-gray-200 dark:border-foreground/5 rounded-lg p-4 mb-4 dark:hover:border-primary/20 transition-all duration-300">
                                                        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-300">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="font-medium">Guest checkout</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                            Create an account to save your information for faster checkout next time.
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                First Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={customerInfo.firstName}
                                                                onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                                                                placeholder="Enter your first name"
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Last Name
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={customerInfo.lastName}
                                                                onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                                                                placeholder="Enter your last name"
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                                                            />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Phone Number *
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                value={customerInfo.phone}
                                                                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                                                placeholder="(555) 123-4567"
                                                                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                                * Required fields. We'll use your phone number to contact you about your order.
                                            </p>
                                        </div>

                                        {/* Order Type Selection */}
                                        <div>
                                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Choose Order Type</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                                                {orderTypes.map((type) => (
                                                    <div
                                                        key={type.id}
                                                        onClick={() => selectOrderType(type.id)}
                                                        className={`${styles.orderTypeCard} p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${type.selected
                                                            ? 'border-gray-900 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50 shadow-lg'
                                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <div className="text-center">
                                                            <div className="mb-2 sm:mb-3 flex items-center justify-center">
                                                                {type.id === 'dine-in' && (
                                                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4-4v4M8 3v4m8-4v4" />
                                                                        <circle cx="12" cy="12" r="3" strokeWidth="1.2" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.5 12h3M12 10.5v3" />
                                                                    </svg>
                                                                )}
                                                                {type.id === 'takeaway' && (
                                                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                                    </svg>
                                                                )}
                                                                {type.id === 'delivery' && (
                                                                    <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17l4 4 4-4m-4-5v9m5-5v2a2 2 0 11-4 0v-2m0 0V7a2 2 0 114 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1">{type.name}</h3>
                                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                      

                                        {/* Reservation Selection (only show if user is logged in and has reservations) */}
                                        {user && userReservations.length > 0 && (
                                            <div className="mt-6">
                                                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                                    Link to Reservation (Optional)
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    You have upcoming reservations at this restaurant. Link this order to a reservation for a seamless dining experience.
                                                </p>
                                                <div className="space-y-2">
                                                    {/* Option to not link to any reservation */}
                                                    <div
                                                        onClick={() => setSelectedReservation(null)}
                                                        className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${!selectedReservation
                                                            ? 'border-gray-900 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50 shadow-lg'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <div>
                                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No Reservation</h3>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400">Place order without linking to a reservation</p>
                                                            </div>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!selectedReservation
                                                            ? 'border-gray-900 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                            }`}>
                                                            {!selectedReservation && (
                                                                <div className="w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-gray-400"></div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* List of reservations */}
                                                    {userReservations.map((reservation: ReservationData) => (
                                                        <div
                                                            key={reservation.id}
                                                            onClick={() => setSelectedReservation(reservation.id)}
                                                            className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedReservation === reservation.id
                                                                ? 'border-gray-900 dark:border-gray-500 bg-gray-50 dark:bg-gray-800/50 shadow-lg'
                                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <div>
                                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                        {new Date(reservation.reservationDetails.date).toLocaleDateString('en-US', { 
                                                                            weekday: 'short', 
                                                                            month: 'short', 
                                                                            day: 'numeric' 
                                                                        })} at {reservation.reservationDetails.time}
                                                                    </h3>
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                        {reservation.reservationDetails.guests} {reservation.reservationDetails.guests === 1 ? 'guest' : 'guests'}
                                                                        {reservation.reservationDetails.tableNumber && ` • Table ${reservation.reservationDetails.tableNumber}`}
                                                                        {' • '}
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                            reservation.status === 'confirmed' 
                                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                                        }`}>
                                                                            {reservation.status}
                                                                        </span>
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5">
                                                                        {reservation.reservationId}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedReservation === reservation.id
                                                                ? 'border-gray-900 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50'
                                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                                }`}>
                                                                {selectedReservation === reservation.id && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-gray-400"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {selectedReservation && (
                                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <div>
                                                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Pre-Order Linked</p>
                                                                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                                                    This order will be linked to your reservation. Your food will be prepared and ready for your arrival.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Delivery Options (only show if delivery is selected) */}
                                        {selectedOrderType?.id === 'delivery' && (
                                            <div className="mt-4">
                                                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3">Delivery Options</h3>
                                                <div className="space-y-2">
                                                    {deliveryOptions.map((option) => (
                                                        <div
                                                            key={option.id}
                                                            onClick={() => selectDeliveryOption(option.id)}
                                                            className={`${styles.deliveryOption} flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${option.selected
                                                                ? 'border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 shadow-lg'
                                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 17l4 4 4-4m-4-5v9m5-5v2a2 2 0 11-4 0v-2m0 0V7a2 2 0 114 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                                                            </svg>
                                                                <div>
                                                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{option.name}</h3>
                                                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">₹{option.price.toFixed(2)}</p>
                                                                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center mt-1 ${option.selected
                                                                    ? 'border-gray-900 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50'
                                                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                                    }`}>
                                                                    {option.selected && (
                                                                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-900 dark:bg-gray-400"></div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Step 1 Navigation */}
                                    <div className="flex justify-end pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-600">
                                        <button
                                            onClick={nextStep}
                                            disabled={!isStep1Valid()}
                                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${styles.stepButton} ${'cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 '

                                                }`}
                                        >
                                            Continue to Details
                                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 inline" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Details */}
                            {currentStep === 2 && (
                                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                    <div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Order Details</h2>

                                        {/* Special Instructions */}
                                        <div className="mb-6 sm:mb-8">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Special Instructions</h3>
                                            
                                            {/* Quick Select Options */}
                                            <div className="mb-4">
                                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">Quick select (tap to add):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { icon: '🌶️', text: 'Less spicy' },
                                                        { icon: '🔥', text: 'Extra spicy' },
                                                        { icon: '🧂', text: 'Less salt' },
                                                        { icon: '🧈', text: 'No butter' },
                                                        { icon: '🥜', text: 'No nuts' },
                                                        { icon: '🧄', text: 'No onion/garlic' },
                                                        { icon: '🌿', text: 'Extra veggies' },
                                                        { icon: '🍖', text: 'Well done' },
                                                        { icon: '🥗', text: 'Dressing on side' },
                                                        { icon: '🍴', text: 'Extra cutlery' },
                                                        { icon: '📦', text: 'Separate packaging' },
                                                        { icon: '♻️', text: 'Eco-friendly packaging' }
                                                    ].map((option, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            onClick={() => {
                                                                const currentText = specialInstructions.trim();
                                                                const newText = currentText 
                                                                    ? `${currentText}, ${option.text}` 
                                                                    : option.text;
                                                                setSpecialInstructions(newText);
                                                            }}
                                                            className="px-3 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-md"
                                                        >
                                                            <span>{option.icon}</span>
                                                            <span className="text-gray-700 dark:text-gray-300">{option.text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Text Area */}
                                            <textarea
                                                value={specialInstructions}
                                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                                placeholder="Any special requests for your order..."
                                                className="w-full p-3 sm:p-4 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 focus:bg-white dark:focus:bg-gray-700 transition-all resize-none"
                                                rows={3}
                                            />
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Optional - Let us know if you have any dietary restrictions or preferences</p>
                                                {specialInstructions && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSpecialInstructions('')}
                                                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium cursor-pointer"
                                                    >
                                                        Clear all
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cart Review */}
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Review Your Order</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                {cartItems.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-background/70 rounded-2xl border border-gray-200 dark:border-foreground/5 hover:shadow-lg dark:hover:border-primary/20 transition-all duration-300">
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            width={50}
                                                            height={50}
                                                            className="w-12 h-12 sm:w-15 sm:h-15 object-cover rounded-lg flex-shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                                                {item.name}
                                                                {item.selectedVariant && (
                                                                    <span className="text-xs text-gray-500 ml-1">({item.selectedVariant.name})</span>
                                                                )}
                                                            </h3>
                                                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                                    <div className="truncate">+ {item.selectedAddons.map(addon => addon.name).join(', ')}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        updateQuantity(item.cartItemId || item.id, -1);
                                                                    }}
                                                                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                                                                >
                                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                                                                    </svg>
                                                                </button>
                                                                <span className="font-semibold w-6 sm:w-8 text-center text-xs sm:text-sm text-gray-900 dark:text-white">{item.quantity || 1}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        updateQuantity(item.cartItemId || item.id, 1);
                                                                    }}
                                                                    className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer"
                                                                >
                                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            <p className="font-bold text-gray-900 dark:text-white min-w-[60px] sm:min-w-[80px] text-right text-xs sm:text-sm">
                                                                ₹{((item.customPrice || item.price) * (item.quantity || 1)).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2 Navigation */}
                                    <div className="flex justify-between pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                                        <button
                                            onClick={prevStep}
                                            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all cursor-pointer hover:shadow-md transform hover:-translate-y-0.5"
                                        >
                                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline" />
                                            Back to Order Type
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            disabled={!isStep2Valid()}
                                            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${isStep2Valid()
                                                ? 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white shadow-lg'
                                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            Continue to Payment
                                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 inline" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Payment */}
                            {currentStep === 3 && (
                                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                    <div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Payment & Review</h2>

                                        {/* Payment Method */}
                                        <div className="mb-6 sm:mb-8">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Payment Method</h3>
                                            <div className="space-y-2 sm:space-y-3">
                                                {paymentMethods.map((method) => (
                                                    <div
                                                        key={method.id}
                                                        onClick={() => selectPaymentMethod(method.id)}
                                                        className={`${styles.paymentMethod} flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${method.selected
                                                            ? 'border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 shadow-lg'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-center w-8 h-8">
                                                            {method.id === 'card' && (
                                                                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                                </svg>
                                                            )}
                                                            {method.id === 'upi' && (
                                                                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                            )}
                                                            {method.id === 'cash' && (
                                                                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span className="flex-1 font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                                                            {method.name}
                                                        </span>
                                                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${method.selected
                                                            ? 'border-gray-900 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                            }`}>
                                                            {method.selected && (
                                                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-900 dark:bg-gray-400"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Promo Code */}
                                        <div className="mb-6 sm:mb-8">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Promo Code</h3>
                                            <div className="flex gap-2 sm:gap-3">
                                                <input
                                                    type="text"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value)}
                                                    placeholder="Enter promo code"
                                                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400 hover:border-gray-400 dark:hover:border-gray-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
                                                />
                                                <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-colors cursor-pointer">
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 3 Navigation */}
                                    <div className="flex justify-between pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-600">
                                        <button
                                            onClick={prevStep}
                                            className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all cursor-pointer hover:shadow-md transform hover:-translate-y-0.5"
                                        >
                                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline" />
                                            Back to Details
                                        </button>
                                        <button
                                            onClick={placeOrder}
                                            disabled={isPlacingOrder || !isFormValid()}
                                            className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${isPlacingOrder || !isFormValid()
                                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                                : 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-white shadow-xl hover:shadow-2xl'
                                                }`}
                                        >
                                            {isPlacingOrder ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2 inline" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Place Order • ₹{total.toFixed(2)}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Order Summary (Desktop Only) */}
                    <div className="hidden xl:block xl:col-span-1">
                        <div className={`bg-white dark:bg-background/70 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-gray-200 dark:border-foreground/5 p-4 sm:p-6 sticky top-20 dark:hover:border-primary/20 transition-all duration-300 ${styles.staggerIn}`}>
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Order Summary</h2>

                            {/* Cart Items */}
                            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 sm:gap-3">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {item.name}
                                                {item.selectedVariant && (
                                                    <span className="text-xs text-gray-500 ml-1">({item.selectedVariant.name})</span>
                                                )}
                                            </h3>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                    <div className="truncate">+ {item.selectedAddons.map(addon => addon.name).join(', ')}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                                ₹{((item.customPrice || item.price) * (item.quantity || 1)).toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity || 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {selectedOrderType?.id === 'delivery' && (
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                        <span>Delivery Fee</span>
                                        <span>₹{deliveryFee.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                    <span>Tax (0%)</span>
                                    <span>₹{tax.toFixed(2)}</span>
                                </div>
                                {discount < 0 && (
                                    <div className="flex justify-between text-gray-900 dark:text-gray-400 text-xs sm:text-sm">
                                        <span>Discount</span>
                                        <span>₹{discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 sm:pt-3">
                                    <div className="flex justify-between font-bold text-sm sm:text-lg text-gray-900 dark:text-white">
                                        <span>Total</span>
                                        <span>₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Info */}
                            {/* Dine-In Info Summary */}
                            {selectedOrderType?.id === 'dine-in' && (tablePreference || Object.values(diningPreferences).some(v => v)) && (
                                <div className="mt-4 p-3 sm:p-4 bg-white dark:bg-background/70 border border-gray-200 dark:border-foreground/5 rounded-lg dark:hover:border-primary/20 transition-all duration-300">
                                    <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
                                        <svg className="w-3 h-3 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M4 7h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4-4v4M8 3v4" />
                                            <circle cx="12" cy="12" r="2" strokeWidth="0.6" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.6" d="M10.5 12h3M12 10.5v3" />
                                        </svg>
                                        Your Preferences
                                    </h3>
                                    <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                                        {tablePreference && (
                                            <p><span className="font-semibold">Table:</span> {
                                                tablePreference === 'window' ? 'Window seat' :
                                                tablePreference === 'corner' ? 'Corner table' :
                                                tablePreference === 'center' ? 'Center table' :
                                                tablePreference === 'booth' ? 'Booth seating' :
                                                'Outdoor seating'
                                            }</p>
                                        )}
                                        {diningPreferences.windowSeat && <p>• Window view requested</p>}
                                        {diningPreferences.quietArea && <p>• Quiet area preferred</p>}
                                        {diningPreferences.highChair && <p>• High chair needed</p>}
                                        {diningPreferences.wheelchairAccessible && <p>• Wheelchair accessible table</p>}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white dark:bg-background/70 border border-gray-200 dark:border-foreground/5 rounded-lg p-3 sm:p-4 dark:hover:border-primary/20 transition-all duration-300">
                                <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-300">
                                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span className="font-medium">Estimated Time</span>
                                    </div>
                                    <p className="text-gray-900 dark:text-gray-200 font-semibold">{estimatedTime}</p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <div className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium">
                                        {error}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Order Summary for Mobile */}
            <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background/70 border-t-2 border-gray-200 dark:border-foreground/5 shadow-2xl dark:shadow-gray-900/50 z-50 backdrop-blur-sm transition-all duration-300">
                {/* Summary Header */}
                <div
                    className="flex items-center justify-between p-2 sm:p-3 md:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ease-out"
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gray-900 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg ring-2 ring-gray-400 dark:ring-gray-600">
                            <span className="text-white text-xs sm:text-sm font-bold">{cartItems.length}</span>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm md:text-base font-bold text-gray-900 dark:text-white">Order Summary</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">₹{total.toFixed(2)} • {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (currentStep < 3) {
                                    nextStep();
                                } else {
                                    placeOrder();
                                }
                            }}
                            disabled={!isFormValid() || isPlacingOrder}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ease-out relative overflow-hidden ${isFormValid() && !isPlacingOrder
                                ? 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white shadow-lg ring-2 ring-gray-400 dark:ring-gray-600 hover:shadow-2xl transform hover:-translate-y-0.5 cursor-pointer'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed border border-gray-400 dark:border-gray-600'
                                }`}
                        >
                            {isPlacingOrder ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />
                                    Processing...
                                </>
                            ) : currentStep < 3 ? (
                                'Next'
                            ) : (
                                `Pay ₹${total.toFixed(2)}`
                            )}
                        </button>
                        <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            {isSummaryExpanded ? (
                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                            ) : (
                                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Expandable Summary Content */}
                <div className={`transition-all duration-300 ease-out overflow-hidden transform origin-top ${isSummaryExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-300 dark:border-gray-600">
                        {/* Cart Items */}
                        <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 ease-out animate-fadeInUp">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={32}
                                        height={32}
                                        className="w-7 h-7 sm:w-8 sm:h-8 object-cover rounded flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                            {item.name}
                                            {item.selectedVariant && (
                                                <span className="text-xs text-gray-500 ml-1">({item.selectedVariant.name})</span>
                                            )}
                                        </h3>
                                        <div className="text-xs text-gray-600 dark:text-gray-300">
                                            <div>Qty: {item.quantity || 1}</div>
                                            {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                <div className="truncate">+ {item.selectedAddons.map(addon => addon.name).join(', ')}</div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                                        ₹{((item.customPrice || item.price) * (item.quantity || 1)).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-1 mb-2 sm:mb-3 text-xs">
                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            {selectedOrderType?.id === 'delivery' && (
                                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                    <span>Delivery Fee</span>
                                    <span>₹{deliveryFee.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>Tax (0%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            {discount < 0 && (
                                <div className="flex justify-between text-gray-900 dark:text-gray-400">
                                    <span>Discount</span>
                                    <span>₹{discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-1">
                                <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Order Info */}
                        {/* Dine-In Info Summary (Mobile) */}
                        {selectedOrderType?.id === 'dine-in' && (tablePreference || Object.values(diningPreferences).some(v => v)) && (
                            <div className="mt-3 p-2 sm:p-3 bg-white dark:bg-background/70 border border-gray-200 dark:border-foreground/5 rounded-lg dark:hover:border-primary/20 transition-all duration-300">
                                <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1">
                                    <svg className="w-3 h-3 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M4 7h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4-4v4M8 3v4" />
                                        <circle cx="12" cy="12" r="2" strokeWidth="0.6" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.6" d="M10.5 12h3M12 10.5v3" />
                                    </svg>
                                    Your Preferences
                                </h3>
                                <div className="text-xs text-gray-700 dark:text-gray-300 space-y-0.5">
                                    {tablePreference && (
                                        <p><span className="font-semibold">Table:</span> {
                                            tablePreference === 'window' ? 'Window seat' :
                                            tablePreference === 'corner' ? 'Corner table' :
                                            tablePreference === 'center' ? 'Center table' :
                                            tablePreference === 'booth' ? 'Booth seating' :
                                            'Outdoor seating'
                                        }</p>
                                    )}
                                    {diningPreferences.windowSeat && <p>• Window view</p>}
                                    {diningPreferences.quietArea && <p>• Quiet area</p>}
                                    {diningPreferences.highChair && <p>• High chair</p>}
                                    {diningPreferences.wheelchairAccessible && <p>• Wheelchair access</p>}
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-background/70 border border-gray-200 dark:border-foreground/5 rounded-lg p-2 sm:p-3 dark:hover:border-primary/20 transition-all duration-300">
                            <div className="text-xs text-gray-800 dark:text-gray-300">
                                <div className="flex items-center gap-1 mb-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span className="font-medium">Estimated Time</span>
                                </div>
                                <p className="text-gray-900 dark:text-gray-200 font-semibold">{estimatedTime}</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                                <div className="text-red-600 dark:text-red-400 text-xs font-medium">
                                    {error}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}