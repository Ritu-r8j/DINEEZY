import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface CreateNotificationParams {
    restaurantId: string;
    type: 'order' | 'payment' | 'reservation';
    title: string;
    message: string;
    orderId?: string;
    amount?: number;
}

export async function createAdminNotification(params: CreateNotificationParams) {
    try {
        const notificationsRef = collection(db, 'adminNotifications');
        await addDoc(notificationsRef, {
            ...params,
            isRead: false,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error: any) {
        console.error('Error creating admin notification:', error);
        return { success: false, error: error.message };
    }
}

// Helper functions for specific notification types
export async function notifyNewOrder(restaurantId: string, orderId: string, customerName: string, total: number) {
    return createAdminNotification({
        restaurantId,
        type: 'order',
        title: 'New Order Received',
        message: `${customerName} placed a new order`,
        orderId,
        amount: total,
    });
}

export async function notifyPaymentReceived(restaurantId: string, orderId: string, amount: number, paymentMethod: string) {
    return createAdminNotification({
        restaurantId,
        type: 'payment',
        title: 'Payment Received',
        message: `Payment of ₹${amount.toFixed(2)} received via ${paymentMethod}`,
        orderId,
        amount,
    });
}

export async function notifyNewReservation(restaurantId: string, customerName: string, date: string, time: string, guests: number) {
    return createAdminNotification({
        restaurantId,
        type: 'reservation',
        title: 'New Reservation Request',
        message: `${customerName} requested a table for ${guests} guests on ${date} at ${time}`,
    });
}

export async function notifyOrderStatusChange(restaurantId: string, orderId: string, status: string) {
    const statusMessages: { [key: string]: string } = {
        'confirmed': 'Order confirmed',
        'preparing': 'Order is being prepared',
        'ready': 'Order is ready for pickup',
        'delivered': 'Order has been delivered',
        'cancelled': 'Order was cancelled',
    };

    return createAdminNotification({
        restaurantId,
        type: 'order',
        title: 'Order Status Updated',
        message: statusMessages[status] || `Order status changed to ${status}`,
        orderId,
    });
}
