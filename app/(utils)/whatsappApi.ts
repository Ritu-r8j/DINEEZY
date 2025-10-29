// WhatsApp OTP API Service
import { storeOTPInFirestore, verifyOTPFromFirestore } from './firebaseOperations';

const API_BASE_URL = process.env.WHATSAPP_API_BASE_URL || 'https://api.webifyit.in/api/v1/dev';
const API_KEY = process.env.WHATSAPP_API_KEY || 'dev_3a0b6f51d8b1';

export interface WhatsAppOTPResponse {
  status: boolean;
  message: string;
  data: any;
}

export interface SendOTPResponse {
  success: boolean;
  error?: string;
  data?: {
    otpId: string;
    phoneNumber: string;
  };
}

export interface VerifyOTPResponse {
  success: boolean;
  error?: string;
  data?: {
    verified: boolean;
    phoneNumber: string;
  };
}

// Generate a 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via WhatsApp
export const sendOTP = async (phoneNumber: string, otp: string): Promise<SendOTPResponse> => {
  try {
    // Format phone number (remove + and ensure it starts with country code)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.slice(1) : phoneNumber;
    
    // Create OTP message
    const message = `Your DineEase verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    
    let data: WhatsAppOTPResponse;

    if (typeof window === 'undefined') {
      const response = await fetch(`${API_BASE_URL}/create-message?apikey=${API_KEY}&to=${formattedPhone}&message=${encodeURIComponent(message)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return {
          success: false,
          error: `WhatsApp API request failed with status ${response.status}`,
        };
      }

      data = await response.json();
    } else {
      const response = await fetch('/api/whatsapp/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: formattedPhone, message }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage =
          (errorBody && (errorBody.message || errorBody.error)) ||
          `WhatsApp proxy request failed with status ${response.status}`;
        return {
          success: false,
          error: errorMessage,
        };
      }

      data = await response.json();
    }

    if (data.status) {
      // Store OTP in Firestore
      const storeResult = await storeOTPInFirestore(formattedPhone, otp);
      
      if (storeResult.success) {
        return {
          success: true,
          data: {
            otpId: `otp_${Date.now()}_${formattedPhone}`,
            phoneNumber: formattedPhone,
          }
        };
      } else {
        return {
          success: false,
          error: 'Failed to store OTP: ' + storeResult.error
        };
      }
    } else {
      return {
        success: false,
        error: data.message || 'Failed to send OTP'
      };
    }
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      error: error.message || 'Network error occurred'
    };
  }
};

// OTP storage is now handled by Firestore

export const verifyOTP = async (otpId: string, enteredOTP: string): Promise<VerifyOTPResponse> => {
  try {
    // Extract phone number from otpId (format: otp_timestamp_phoneNumber)
    const phoneNumber = otpId.split('_').slice(2).join('_');
    
    if (!phoneNumber) {
      return {
        success: false,
        error: 'Invalid OTP ID'
      };
    }
    
    // Verify OTP using Firestore
    const result = await verifyOTPFromFirestore(phoneNumber, enteredOTP);
    
    if (result.success) {
      return {
        success: true,
        data: {
          verified: true,
          phoneNumber: phoneNumber
        }
      };
    } else {
      return {
        success: false,
        error: result.error || 'OTP verification failed'
      };
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error.message || 'Verification failed'
    };
  }
};

export const cleanupExpiredOTPs = async (): Promise<void> => {
 
  return;
};
