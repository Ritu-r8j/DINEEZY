// Business Type Configuration
// Simplified version with just business type selection

export type BusinessType = 'QSR' | 'RESTO';

// Business type descriptions
export const BUSINESS_TYPE_INFO = {
  QSR: {
    name: 'Quick Service Restaurant (QSR)',
    description: 'Fast-casual dining with quick service, counter ordering, and minimal table service. Perfect for cafes, fast food, and quick-bite restaurants.',
    features: [
      'Counter ordering and payment',
      'Quick pickup and delivery',
      'Simplified menu management',
      'Fast order processing',
      'Loyalty programs'
    ]
  },
  RESTO: {
    name: 'Full-Service Restaurant (RESTO)',
    description: 'Traditional dining experience with table service, reservations, and comprehensive restaurant management. Ideal for fine dining, casual dining, and full-service establishments.',
    features: [
      'Table reservations and management',
      'Dine-in ordering with table service',
      'Advanced customer management',
      'Split billing and gratuity',
      'Comprehensive staff management'
    ]
  }
} as const;