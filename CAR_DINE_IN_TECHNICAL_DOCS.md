# Car Dine-In Technical Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Checkout Page                                               │
│  ├── Order Type Selection (includes Car Dine-In)            │
│  ├── CarDineInForm Component                                │
│  │   ├── Time Slot Picker                                   │
│  │   ├── Car Details Form                                   │
│  │   └── Service Mode Toggle                                │
│  └── Payment Integration (Razorpay)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Order Processing                                            │
│  ├── Validation (car details, time slot)                    │
│  ├── Order Creation                                          │
│  └── Conditional Service Logic                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Firebase Firestore                                          │
│  └── Orders Collection                                       │
│      └── Order Document                                      │
│          ├── orderType: 'car-dine-in'                       │
│          ├── diningType: 'CAR_DINE_IN'                      │
│          ├── scheduledTime                                   │
│          ├── carDetails: { model, number }                   │
│          └── serviceMode: 'EAT_IN_CAR' | 'TAKEAWAY'         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Admin Interface Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Admin Orders Page                                           │
│  ├── Order Type Filter (includes Car Dine-In)              │
│  ├── Order Details Modal                                     │
│  │   ├── Car Details Display                                │
│  │   └── Service Mode Indicator                             │
│  └── Conditional Service Actions                            │
│      ├── EAT_IN_CAR: Water, Assist, Pickup Tray            │
│      └── TAKEAWAY: Standard completion only                 │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

### CarDineInForm Component

```typescript
interface CarDineInFormProps {
    carDetails: {
        model: string;
        number: string;
    };
    serviceMode: 'EAT_IN_CAR' | 'TAKEAWAY';
    scheduledTime: string;
    availableTimeSlots: string[];
    onCarDetailsChange: (details: { model: string; number: string }) => void;
    onServiceModeChange: (mode: 'EAT_IN_CAR' | 'TAKEAWAY') => void;
    onScheduledTimeChange: (time: string) => void;
}
```

**Responsibilities:**
- Render time slot picker
- Capture car details (model, number)
- Toggle service mode
- Validate inputs
- Provide user feedback

### Checkout Page Integration

**State Management:**
```typescript
// Car Dine-In specific state
const [carDetails, setCarDetails] = useState({
    model: '',
    number: ''
});
const [carServiceMode, setCarServiceMode] = useState<'EAT_IN_CAR' | 'TAKEAWAY'>('EAT_IN_CAR');
const [carScheduledTime, setCarScheduledTime] = useState('');
```

**Validation Logic:**
```typescript
const isStep2Valid = () => {
    const isCarDineInSelected = orderTypes.find(type => type.id === 'car-dine-in')?.selected;
    if (isCarDineInSelected) {
        if (!carScheduledTime || !carDetails.model.trim() || !carDetails.number.trim()) {
            return false;
        }
    }
    return true;
};
```

## Data Model

### Order Schema Extension

```typescript
interface CarDineInOrder extends BaseOrder {
    orderType: 'car-dine-in';
    diningType: 'CAR_DINE_IN';
    scheduledTime: string;  // e.g., "2:30 PM"
    carDetails: {
        model: string;      // e.g., "Honda Civic"
        number: string;     // e.g., "ABC-1234"
    };
    serviceMode: 'EAT_IN_CAR' | 'TAKEAWAY';
}
```

### Database Structure

```
orders/
  └── {orderId}/
      ├── orderId: string
      ├── orderType: 'car-dine-in'
      ├── diningType: 'CAR_DINE_IN'
      ├── scheduledTime: string
      ├── carDetails: {
      │   ├── model: string
      │   └── number: string
      │   }
      ├── serviceMode: 'EAT_IN_CAR' | 'TAKEAWAY'
      ├── customerInfo: {...}
      ├── items: [...]
      ├── status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered'
      └── ... (other order fields)
```

## Business Logic

### Time Slot Generation

```typescript
const generateTimeSlots = () => {
    const slots: string[] = [];
    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now
    
    // Round up to next 15-minute interval
    const minutes = minTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    minTime.setMinutes(roundedMinutes, 0, 0);
    
    // Generate slots until end of day (11:30 PM)
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 30, 0, 0);
    
    const current = new Date(minTime);
    while (current <= endOfDay) {
        const timeString = current.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        slots.push(timeString);
        current.setMinutes(current.getMinutes() + 15);
    }
    
    return slots;
};
```

### Conditional Service Logic

```typescript
// In Admin Orders Page
{order.status === 'ready' && (
    <>
        {/* Standard completion button */}
        <button onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>
            Complete Order
        </button>
        
        {/* Conditional service actions */}
        {order.orderType === 'car-dine-in' && order.serviceMode === 'EAT_IN_CAR' && (
            <div className="service-actions">
                <button>💧 Water</button>
                <button>🤝 Assist</button>
                <button>🍽️ Pickup Tray</button>
            </div>
        )}
    </>
)}
```

## API Integration

### Order Creation Flow

```typescript
// 1. User submits order
const placeOrder = async () => {
    // Generate order ID
    const orderId = generateOrderId();
    
    // 2. Show payment modal (if online payment)
    if (!isDineInPayLater) {
        setShowPaymentModal(true);
        return;
    }
    
    // 3. Process order after payment
    await processOrder(paymentResult, orderId);
};

// 4. Create order in database
const processOrder = async (paymentResult, orderId) => {
    const orderData = {
        orderId,
        orderType: 'car-dine-in',
        diningType: 'CAR_DINE_IN',
        scheduledTime: carScheduledTime,
        carDetails: {
            model: carDetails.model,
            number: carDetails.number
        },
        serviceMode: carServiceMode,
        // ... other order fields
    };
    
    await createOrder(orderData);
};
```

### Payment Integration

Car Dine-In reuses the existing Razorpay payment flow:

```typescript
// Payment modal handles both online and cash payments
<RazorpayPayment
    amount={total}
    orderId={generatedOrderId}
    customerInfo={customerInfo}
    onSuccess={handlePaymentSuccess}
    onError={handlePaymentError}
    onCancel={handlePaymentCancel}
/>
```

## Admin Panel Integration

### Order Filtering

```typescript
// Filter state includes car-dine-in
const [activeOrderTypeFilter, setActiveOrderTypeFilter] = useState<
    'all' | 'pre-order' | 'dine-in' | 'takeaway' | 'delivery' | 'car-dine-in'
>('all');

// Filter logic
const filteredOrders = orders.filter(order => {
    const matchesOrderType = 
        activeOrderTypeFilter === 'all' || 
        order.orderType === activeOrderTypeFilter;
    return matchesOrderType;
});
```

### Order Details Display

```typescript
// In order details modal
{selectedOrder.orderType === 'car-dine-in' && selectedOrder.carDetails && (
    <>
        <div>Scheduled Time: {selectedOrder.scheduledTime}</div>
        <div>Car Model: {selectedOrder.carDetails.model}</div>
        <div>Car Number: {selectedOrder.carDetails.number}</div>
        <div>
            Service Mode: {
                selectedOrder.serviceMode === 'EAT_IN_CAR' 
                    ? '🍽️ Eat in Car (Full Service)' 
                    : '🥡 Takeaway (No Service)'
            }
        </div>
    </>
)}
```

## Performance Considerations

### Time Slot Generation
- Generated once on component mount
- Cached in state
- No API calls required
- O(n) complexity where n = number of 15-min intervals until end of day

### Order Filtering
- Client-side filtering for fast response
- No additional database queries
- Efficient array operations

### State Management
- Minimal state updates
- No unnecessary re-renders
- Optimized with React hooks

## Security Considerations

### Input Validation
- Car model: Required, non-empty string
- Car number: Required, non-empty string
- Scheduled time: Must be from available slots
- Service mode: Must be 'EAT_IN_CAR' or 'TAKEAWAY'

### Data Sanitization
- All user inputs are sanitized before storage
- No SQL injection risk (using Firestore)
- XSS protection through React's built-in escaping

## Testing Strategy

### Unit Tests
```typescript
describe('CarDineInForm', () => {
    it('should validate car details', () => {
        // Test validation logic
    });
    
    it('should generate time slots correctly', () => {
        // Test time slot generation
    });
    
    it('should toggle service mode', () => {
        // Test service mode toggle
    });
});
```

### Integration Tests
```typescript
describe('Car Dine-In Order Flow', () => {
    it('should create order with car details', async () => {
        // Test complete order creation
    });
    
    it('should display car details in admin panel', async () => {
        // Test admin panel display
    });
});
```

## Deployment Checklist

- [x] Component implementation complete
- [x] State management implemented
- [x] Validation logic added
- [x] Admin panel integration complete
- [x] TypeScript types defined
- [x] No compilation errors
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation complete

## Monitoring & Analytics

### Metrics to Track
1. **Order Volume**
   - Total car dine-in orders
   - Orders by service mode (EAT_IN_CAR vs TAKEAWAY)
   - Peak time slots

2. **User Behavior**
   - Service mode preference
   - Average order value
   - Time slot distribution

3. **Operational Metrics**
   - Order preparation time
   - Service completion time
   - Customer satisfaction

### Implementation
```typescript
// Track order creation
analytics.track('car_dine_in_order_created', {
    serviceMode: carServiceMode,
    scheduledTime: carScheduledTime,
    orderValue: total
});

// Track service actions
analytics.track('car_service_action', {
    orderId: order.id,
    action: 'water' | 'assist' | 'pickup_tray'
});
```

## Future Enhancements

### Phase 2 (Optional)
1. **Real-time Updates**
   - WebSocket integration for live order status
   - Push notifications when order is ready

2. **Advanced Scheduling**
   - Multi-day scheduling
   - Recurring orders
   - Reservation integration

3. **Service Tracking**
   - Track service action completion
   - Service quality metrics
   - Staff performance analytics

4. **Customer Experience**
   - In-car payment options
   - Digital menu in car
   - Feedback collection

### Phase 3 (Advanced)
1. **Location Services**
   - GPS-based car location
   - Automated staff dispatch
   - Parking spot assignment

2. **Integration**
   - POS system integration
   - Kitchen display system
   - Inventory management

3. **AI/ML Features**
   - Demand prediction
   - Optimal time slot suggestions
   - Personalized recommendations
