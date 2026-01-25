# Car Dine-In Feature

A minimal implementation of car dine-in ordering for the restaurant platform.

## Features Implemented

### 1. User Flow (Checkout)
- **New Order Type**: "Car Dine-In" option added to checkout
- **Time Slot Selection**: Users can select from predefined time slots (15-minute intervals, minimum 30 minutes from now)
- **Car Details Form**:
  - Car Model (text input)
  - Car Number (text input)
- **Service Mode Toggle**:
  - 🍽️ **Eat in the Car**: Full service (water, assistance, tray pickup)
  - 🥡 **Takeaway**: Pickup only, no additional services

### 2. Order Data Model
Orders with `orderType: 'car-dine-in'` include:
```typescript
{
  orderType: 'car-dine-in',
  diningType: 'CAR_DINE_IN',
  scheduledTime: string,  // Selected time slot
  carDetails: {
    model: string,
    number: string
  },
  serviceMode: 'EAT_IN_CAR' | 'TAKEAWAY'
}
```

### 3. Admin Panel Integration
- **Order Type Filter**: New "Car Dine-In" filter (🚗) in orders page
- **Order Details Display**: Shows car details, scheduled time, and service mode
- **Conditional Service Actions**: 
  - For `serviceMode === 'EAT_IN_CAR'`: Shows service action buttons (Water, Assist, Pickup Tray)
  - For `serviceMode === 'TAKEAWAY'`: Only shows "Order Ready" status

### 4. Payment Flow
- Reuses existing payment infrastructure
- No changes to payment logic
- Car dine-in details saved with order after successful payment

## Files Modified

1. **app/user/checkout/page.tsx**
   - Added car dine-in state management
   - Integrated car dine-in form
   - Updated order data to include car details
   - Added validation for car dine-in fields

2. **app/user/checkout/components/CarDineInForm.tsx** (NEW)
   - Standalone form component for car dine-in details
   - Time slot picker
   - Car details inputs
   - Service mode toggle

3. **app/user/checkout/components/OrderTypeSelection.tsx**
   - Added car icon for car dine-in option

4. **app/admin/orders/page.tsx**
   - Added car-dine-in filter
   - Display car details in order modal
   - Service action buttons for EAT_IN_CAR mode

## Usage

### For Customers
1. Go to checkout
2. Select "Car Dine-In" as order type
3. Choose a time slot
4. Enter car model and number
5. Select service mode (Eat in Car or Takeaway)
6. Complete payment
7. Arrive at scheduled time

### For Restaurant Staff
1. View car dine-in orders in admin panel
2. Filter by "Car Dine-In" type
3. See car details and scheduled time
4. For "Eat in Car" orders:
   - Use service buttons (Water, Assist, Pickup Tray)
5. For "Takeaway" orders:
   - Mark as ready when prepared

## Design Decisions

### Minimal Implementation
- No GPS tracking
- No WhatsApp integration
- No ETA calculations
- No hardware integrations
- Simple time slot selection (no complex scheduling)

### Reused Components
- Existing payment flow
- Existing order management
- Existing notification system
- Existing time slot generation logic (from pre-order)

### Conditional Logic
Service actions are conditionally displayed based on `serviceMode`:
- `EAT_IN_CAR`: Full service enabled
- `TAKEAWAY`: Service actions hidden

## Future Enhancements (Not Implemented)
- Real-time location tracking
- Automated notifications when customer arrives
- Integration with parking management
- Service request tracking
- Customer feedback for car service
