// Razorpay utility functions for payment processing

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email?: string;
    contact: string;
  };
  notes: {
    orderId: string;
    restaurantId: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface CreateOrderParams {
  amount: number;
  orderId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  restaurantInfo?: {
    name: string;
    id: string;
  };
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create Razorpay order
export const createRazorpayOrder = async (params: CreateOrderParams) => {
  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create order');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return { success: false, error: error.message };
  }
};

// Process Razorpay payment
export const processRazorpayPayment = async (
  orderData: CreateOrderParams,
  restaurantInfo: { name: string; id: string }
): Promise<PaymentResult> => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    // Create order
    const orderResult = await createRazorpayOrder(orderData);
    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }

    const { orderId, amount, currency, key } = orderResult.data;

    return new Promise((resolve) => {
      const options: RazorpayOptions = {
        key,
        amount,
        currency,
        name: restaurantInfo.name,
        description: `Order #${orderData.orderId}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verificationResult = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.orderId,
              paymentDetails: {
                amount: amount / 100, // Convert from paise
                currency,
                method: 'card', // This will be updated by Razorpay
                customerInfo: orderData.customerInfo,
                restaurantId: restaurantInfo.id,
              },
            });

            if (verificationResult.success) {
              resolve({
                success: true,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              });
            } else {
              resolve({
                success: false,
                error: 'Payment verification failed',
              });
            }
          } catch (error: any) {
            resolve({
              success: false,
              error: error.message,
            });
          }
        },
        prefill: {
          name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`.trim(),
          email: orderData.customerInfo.email || '',
          contact: orderData.customerInfo.phone,
        },
        notes: {
          orderId: orderData.orderId,
          restaurantId: restaurantInfo.id,
        },
        theme: {
          color: '#1f2937', // Dark gray color
        },
        modal: {
          ondismiss: () => {
            resolve({
              success: false,
              error: 'Payment cancelled by user',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify payment
export const verifyPayment = async (verificationData: any) => {
  try {
    const response = await fetch('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Payment verification failed');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return { success: false, error: error.message };
  }
};

// Process UPI payment
export const processUPIPayment = async (
  orderData: CreateOrderParams,
  restaurantInfo: { name: string; id: string },
  upiId?: string
): Promise<PaymentResult> => {
  try {
    // Create order first
    const orderResult = await createRazorpayOrder(orderData);
    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    const { orderId, amount, currency, key } = orderResult.data;

    return new Promise((resolve) => {
      const options: RazorpayOptions = {
        key,
        amount,
        currency,
        name: restaurantInfo.name,
        description: `Order #${orderData.orderId}`,
        order_id: orderId,
        handler: async (response: any) => {
          const verificationResult = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderData.orderId,
            paymentDetails: {
              amount: amount / 100,
              currency,
              method: 'upi',
              customerInfo: orderData.customerInfo,
              restaurantId: restaurantInfo.id,
            },
          });

          resolve({
            success: verificationResult.success,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
            error: verificationResult.success ? undefined : 'Payment verification failed',
          });
        },
        prefill: {
          name: `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`.trim(),
          email: orderData.customerInfo.email || '',
          contact: orderData.customerInfo.phone,
        },
        notes: {
          orderId: orderData.orderId,
          restaurantId: restaurantInfo.id,
        },
        theme: {
          color: '#1f2937',
        },
        modal: {
          ondismiss: () => {
            resolve({
              success: false,
              error: 'Payment cancelled by user',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Format currency for display
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${amount.toFixed(2)}`;
};

// Calculate processing fee - Fixed ₹2 for online payments, ₹0 for cash
export const calculateProcessingFee = (amount: number, method: string = 'online'): number => {
  return method === 'cash' ? 0 : 2; // Fixed ₹2 fee for online payments
};

// Declare global Razorpay interface
declare global {
  interface Window {
    Razorpay: any;
  }
}