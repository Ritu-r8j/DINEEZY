import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/app/(utils)/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  try {
    const orderId = payment.notes?.orderId;
    if (!orderId) return;

    // Update order status
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      paymentStatus: 'completed',
      status: 'confirmed',
      paymentDetails: {
        ...payment,
        capturedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Log transaction
    await addDoc(collection(db, 'transactions'), {
      type: 'payment_captured',
      orderId,
      paymentId: payment.id,
      amount: payment.amount / 100, // Convert from paise
      currency: payment.currency,
      method: payment.method,
      status: 'completed',
      razorpayData: payment,
      createdAt: serverTimestamp()
    });

    console.log('Payment captured for order:', orderId);
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: any) {
  try {
    const orderId = payment.notes?.orderId;
    if (!orderId) return;

    // Update order status
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      paymentStatus: 'failed',
      status: 'payment_failed',
      paymentDetails: {
        ...payment,
        failedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    // Log transaction
    await addDoc(collection(db, 'transactions'), {
      type: 'payment_failed',
      orderId,
      paymentId: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      method: payment.method,
      status: 'failed',
      errorCode: payment.error_code,
      errorDescription: payment.error_description,
      razorpayData: payment,
      createdAt: serverTimestamp()
    });

    console.log('Payment failed for order:', orderId);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleOrderPaid(order: any) {
  try {
    console.log('Order paid webhook received:', order.id);
    // Additional order paid logic can be added here
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}