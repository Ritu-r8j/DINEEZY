import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createTransaction } from '@/app/(utils)/firebaseOperations';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      paymentDetails
    } = await request.json();

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET!)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Create transaction record
    const transactionResult = await createTransaction({
      orderId,
      restaurantId: paymentDetails?.restaurantId || '',
      customerInfo: paymentDetails?.customerInfo || {
        firstName: '',
        lastName: '',
        phone: ''
      },
      amount: paymentDetails?.amount || 0,
      currency: paymentDetails?.currency || 'INR',
      paymentMethod: 'online' as 'online' | 'cash' | 'pay-later', // Always 'online' for Razorpay payments
      paymentStatus: 'completed',
      transactionType: 'online',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      processingFee: 2, // Fixed ₹2 fee for online payments
      netAmount: (paymentDetails?.amount || 0) - 2,
      notes: 'Online payment via Razorpay'
    });

    if (!transactionResult.success) {
      console.error('Failed to create transaction:', transactionResult.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      transactionId: transactionResult.data?.id
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', details: error.message },
      { status: 500 }
    );
  }
}