# Business Type Selection System

This document explains the simplified business type selection system that allows restaurants to choose between QSR (Quick Service Restaurant) and RESTO (Full-Service Restaurant) modes.

## Overview

The system provides:
- **Business Type Selection**: Admins can choose between QSR and RESTO modes
- **Simple Configuration**: Clean interface without complex feature management
- **Component-Level Business Type Gating**: UI components can be conditionally rendered based on business type

## Business Types

### QSR (Quick Service Restaurant)
- **Target**: Fast-casual dining, cafes, quick-bite restaurants
- **Focus**: Speed, efficiency, counter service
- **Characteristics**: Counter ordering, quick pickup, simplified operations

### RESTO (Full-Service Restaurant)
- **Target**: Fine dining, casual dining, full-service establishments
- **Focus**: Table service, reservations, comprehensive management
- **Characteristics**: Table reservations, dine-in service, full restaurant experience

## Configuration

### Admin Settings Page

Admins can configure their business type in `/admin/settings`:

- Simple two-option selection between QSR and RESTO
- Visual cards showing the characteristics of each type
- Immediate saving to the database

## Usage in Components

### 1. Using the useBusinessType Hook

```typescript
import { useBusinessType } from '@/app/(utils)/useFeatures';

function MyComponent() {
  const { getBusinessType, isQSR, isRESTO } = useBusinessType();
  
  // Check business type
  if (isQSR()) {
    // Show QSR-specific content
  }
  
  if (isRESTO()) {
    // Show RESTO-specific content
  }
}
```

### 2. Using Business Type Gates

```typescript
import { BusinessTypeGate } from '@/app/(utils)/useFeatures';

function MyComponent() {
  return (
    <div>
      {/* Show content only for QSR */}
      <BusinessTypeGate businessType="QSR">
        <QSRSpecificComponent />
      </BusinessTypeGate>
      
      {/* Show content only for RESTO */}
      <BusinessTypeGate businessType="RESTO">
        <RESTOSpecificComponent />
      </BusinessTypeGate>
      
      {/* Show content for both types */}
      <BusinessTypeGate businessType={['QSR', 'RESTO']}>
        <CommonComponent />
      </BusinessTypeGate>
    </div>
  );
}
```

## Database Schema

The restaurant settings include:

```typescript
interface RestaurantSettings {
  // ... other fields
  businessType?: 'QSR' | 'RESTO';
}
```

## Examples

### QSR Configuration
- Optimized for quick service
- Counter-based operations
- Fast order processing

### RESTO Configuration  
- Full-service dining experience
- Table management
- Comprehensive restaurant operations

## Best Practices

1. **Default to QSR**: Simpler setup for new restaurants
2. **Clear Distinction**: Make the difference between QSR and RESTO obvious
3. **Graceful Handling**: Always provide fallbacks for business type checks
4. **Performance**: Business type checks are cached and optimized

## Future Enhancements

- **Guided Setup**: Help restaurants choose the right type
- **Migration Tools**: Easy switching between types
- **Analytics**: Track usage patterns by business type

## Troubleshooting

### Business Type Not Showing
1. Check if business type is set in settings
2. Verify component is wrapped in BusinessTypeGate
3. Ensure database has the businessType field

### Performance Issues
1. Business type is loaded once and cached
2. Use BusinessTypeGate components instead of multiple useBusinessType calls