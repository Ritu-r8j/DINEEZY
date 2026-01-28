'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/(contexts)/AuthContext';
import { getRestaurantSettings } from './firebaseOperations';
import { BusinessType } from './businessTypeConfig';
import React from 'react';

interface BusinessTypeState {
  businessType: BusinessType | null;
  isLoading: boolean;
  error: string | null;
}

export const useBusinessType = (restaurantId?: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<BusinessTypeState>({
    businessType: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadBusinessType = async () => {
      // Use provided restaurantId or fall back to user's restaurant
      const targetRestaurantId = restaurantId || user?.uid;
      
      if (!targetRestaurantId) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const result = await getRestaurantSettings(targetRestaurantId);
        
        if (result.success && result.data) {
          const businessType = result.data.businessType || 'QSR';
          setState({
            businessType,
            isLoading: false,
            error: null
          });
        } else {
          // Default to QSR if no settings found
          setState({
            businessType: 'QSR',
            isLoading: false,
            error: null
          });
        }
      } catch (error: any) {
        console.error('Error loading business type:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load business type'
        }));
      }
    };

    loadBusinessType();
  }, [user?.uid, restaurantId]);

  // Helper function to get business type
  const getBusinessType = (): BusinessType | null => {
    return state.businessType;
  };

  // Helper function to check if it's a QSR
  const isQSR = (): boolean => {
    return state.businessType === 'QSR';
  };

  // Helper function to check if it's a RESTO
  const isRESTO = (): boolean => {
    return state.businessType === 'RESTO';
  };

  return {
    ...state,
    getBusinessType,
    isQSR,
    isRESTO
  };
};

// Component to conditionally render based on business type
interface BusinessTypeGateProps {
  businessType: BusinessType | BusinessType[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  restaurantId?: string; // Optional restaurant ID for user contexts
}

export const BusinessTypeGate: React.FC<BusinessTypeGateProps> = ({ 
  businessType, 
  children, 
  fallback = null,
  restaurantId 
}) => {
  const { getBusinessType, isLoading } = useBusinessType(restaurantId);
  
  if (isLoading) {
    return null;
  }
  
  const currentBusinessType = getBusinessType();
  if (!currentBusinessType) {
    return React.createElement(React.Fragment, null, fallback);
  }
  
  const allowedTypes = Array.isArray(businessType) ? businessType : [businessType];
  const isAllowed = allowedTypes.includes(currentBusinessType);
  
  if (isAllowed) {
    return React.createElement(React.Fragment, null, children);
  }
  
  return React.createElement(React.Fragment, null, fallback);
};