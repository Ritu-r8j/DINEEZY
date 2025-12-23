'use client';

import { useState } from 'react';
import { Loader2, CreditCard, Banknote, CheckCircle, XCircle } from 'lucide-react';
import { processRazorpayPayment, formatCurrency } from '@/app/(utils)/razorpayUtils';
import { createTransaction } from '@/app/(utils)/firebaseOperations';

interface RazorpayPaymentProps {
  amount: number;
  orderId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  restaurantInfo: {
    name: string;
    id: string;
  };
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

interface PaymentMethod {
  id: 'online' | 'cash';
  name: string;
  icon: React.ReactNode;
  description: string;
  processingFee: number;
}

export default function RazorpayPayment({
  amount,
  orderId,
  customerInfo,
  restaurantInfo,
  onSuccess,
  onError,
  onCancel
}: RazorpayPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'cash'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'online',
      name: 'Online Payment',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Pay with Card, UPI, or Net Banking',
      processingFee: 2 // Fixed ₹2 fee
    },
    {
      id: 'cash',
      name: 'Cash on Delivery',
      icon: <Banknote className="w-5 h-5" />,
      description: 'Pay with cash when order arrives',
      processingFee: 0 // No fee for cash
    }
  ];

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod)!;
  const totalAmount = amount; // Amount already includes convenience fee from checkout page

  const handlePayment = async () => {
    if (selectedMethod === 'cash') {
      await handleCashPayment();
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const orderData = {
        amount,
        orderId,
        customerInfo
      };

      // For online payment, use Razorpay (which handles card, UPI, net banking, etc.)
      const paymentResult = await processRazorpayPayment(orderData, restaurantInfo);

      if (paymentResult?.success) {
        setPaymentStatus('success');
        
        // Transaction is already created in the verification API for online payments
        onSuccess({
          ...paymentResult,
          method: 'online',
          processingFee: selectedPaymentMethod.processingFee,
          totalAmount
        });
      } else {
        setPaymentStatus('failed');
        onError(paymentResult?.error || 'Payment failed');
      }
    } catch (error: any) {
      setPaymentStatus('failed');
      onError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');

      // Create transaction record for cash payment
      await createTransaction({
        orderId,
        restaurantId: restaurantInfo.id,
        customerInfo,
        amount,
        currency: 'INR',
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        transactionType: 'offline',
        processingFee: 0,
        netAmount: amount,
        notes: 'Cash on delivery payment'
      });

      setPaymentStatus('success');
      onSuccess({
        success: true,
        method: 'cash',
        processingFee: 0,
        totalAmount: amount,
        paymentId: `cash_${orderId}_${Date.now()}`
      });
    } catch (error: any) {
      setPaymentStatus('failed');
      onError(error.message || 'Failed to process cash payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your payment of {formatCurrency(totalAmount)} has been processed successfully.
        </p>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="text-center py-8">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Payment Failed
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          There was an issue processing your payment. Please try again.
        </p>
        <button
          onClick={() => setPaymentStatus('idle')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose Payment Method
        </h3>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedMethod === method.id
                      ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {method.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {method.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {method.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {method.processingFee > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      +₹{method.processingFee} fee
                    </p>
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedMethod === method.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Payment Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Order Amount</span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(amount - selectedPaymentMethod.processingFee)}</span>
          </div>
          {selectedPaymentMethod.processingFee > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Convenience Fee</span>
              <span className="text-gray-900 dark:text-white">
                ₹{selectedPaymentMethod.processingFee}
              </span>
            </div>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-gray-900 dark:text-white">Total Amount</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>
            {isProcessing
              ? 'Processing...'
              : selectedMethod === 'cash'
              ? 'Confirm Order'
              : `Pay ${formatCurrency(totalAmount)}`
            }
          </span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          🔒 Your payment information is secure and encrypted
        </p>
      </div>
    </div>
  );
}