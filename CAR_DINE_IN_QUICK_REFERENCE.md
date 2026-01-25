# Car Dine-In Quick Reference

## 🚀 Quick Start

### For Developers

**Files to Know:**
```
app/user/checkout/components/CarDineInForm.tsx    # Main form component
app/user/checkout/page.tsx                         # Integration point
app/admin/orders/page.tsx                          # Admin display
```

**Key State Variables:**
```typescript
carDetails: { model: string, number: string }
carServiceMode: 'EAT_IN_CAR' | 'TAKEAWAY'
carScheduledTime: string
```

**Order Type ID:**
```typescript
orderType: 'car-dine-in'
```

## 📋 Common Tasks

### Add New Service Action
```typescript
// In app/admin/orders/page.tsx
{order.orderType === 'car-dine-in' && order.serviceMode === 'EAT_IN_CAR' && (
    <button onClick={() => handleServiceAction(order.id, 'new-action')}>
        🆕 New Action
    </button>
)}
```

### Modify Time Slot Intervals
```typescript
// In app/user/checkout/page.tsx - generateTimeSlots()
current.setMinutes(current.getMinutes() + 15); // Change 15 to desired interval
```

### Add Validation Rule
```typescript
// In app/user/checkout/page.tsx - isStep2Valid()
if (isCarDineInSelected) {
    if (!carScheduledTime || !carDetails.model.trim() || !carDetails.number.trim()) {
        return false;
    }
    // Add new validation here
}
```

### Customize Service Mode Options
```typescript
// In app/user/checkout/components/CarDineInForm.tsx
<div onClick={() => onServiceModeChange('NEW_MODE')}>
    <div className="text-2xl mb-2">🆕</div>
    <h4>New Mode</h4>
    <p>Description</p>
</div>
```

## 🔍 Debugging

### Check Order Data
```typescript
console.log('Order Type:', selectedOrderType?.id);
console.log('Car Details:', carDetails);
console.log('Service Mode:', carServiceMode);
console.log('Scheduled Time:', carScheduledTime);
```

### Verify Validation
```typescript
console.log('Is Car Dine-In Selected:', 
    orderTypes.find(type => type.id === 'car-dine-in')?.selected
);
console.log('Is Step 2 Valid:', isStep2Valid());
```

### Check Admin Display
```typescript
console.log('Order Type Filter:', activeOrderTypeFilter);
console.log('Filtered Orders:', 
    orders.filter(o => o.orderType === 'car-dine-in')
);
```

## 🎨 Styling

### Component Classes
```css
/* CarDineInForm.tsx uses these from checkout.module.css */
.orderTypeCard    /* Card container */
.subheading       /* Section headings */
.bodyText         /* Body text */
```

### Color Scheme
```typescript
// Service mode colors
EAT_IN_CAR:  'text-green-600 dark:text-green-400'
TAKEAWAY:    'text-orange-600 dark:text-orange-400'

// Status colors
bg-blue-50 dark:bg-blue-900/20      // Info background
border-blue-200 dark:border-blue-800 // Info border
```

## 📊 Data Flow

```
User Input → State Update → Validation → Order Creation → Database → Admin Display
```

**Detailed:**
1. User fills CarDineInForm
2. State updates via callbacks
3. Validation on step change
4. Payment processing
5. Order created with car details
6. Saved to Firestore
7. Admin sees in orders list
8. Service actions available

## 🧪 Testing Scenarios

### Happy Path
```typescript
1. Select "Car Dine-In"
2. Choose time slot: "2:30 PM"
3. Enter car model: "Honda Civic"
4. Enter car number: "ABC-1234"
5. Select "Eat in Car"
6. Complete payment
7. ✅ Order created successfully
```

### Edge Cases
```typescript
// No time slots (late in day)
availableTimeSlots.length === 0

// Empty car details
carDetails.model === '' || carDetails.number === ''

// Invalid time slot
!availableTimeSlots.includes(carScheduledTime)
```

## 🔧 Configuration

### Time Slot Settings
```typescript
// Minimum advance time
const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

// End of day
endOfDay.setHours(23, 30, 0, 0); // 11:30 PM

// Interval
current.setMinutes(current.getMinutes() + 15); // 15 minutes
```

### Service Mode Defaults
```typescript
const [carServiceMode, setCarServiceMode] = useState<'EAT_IN_CAR' | 'TAKEAWAY'>('EAT_IN_CAR');
```

## 📱 Responsive Breakpoints

```typescript
// Tailwind breakpoints used
sm:  640px   // Small devices
md:  768px   // Medium devices
lg:  1024px  // Large devices
xl:  1280px  // Extra large devices
```

## 🚨 Common Issues

### Issue: Time slots not showing
**Solution:** Check if current time is past 11:30 PM

### Issue: Validation failing
**Solution:** Ensure all fields are filled and time slot is selected

### Issue: Order not appearing in admin
**Solution:** Check orderType is exactly 'car-dine-in' (case-sensitive)

### Issue: Service actions not showing
**Solution:** Verify serviceMode === 'EAT_IN_CAR' and order.status === 'ready'

## 📚 Related Documentation

- `CAR_DINE_IN_FEATURE.md` - Feature overview
- `CAR_DINE_IN_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `CAR_DINE_IN_TECHNICAL_DOCS.md` - Technical architecture
- `CAR_DINE_IN_USER_GUIDE.md` - User guide

## 🔗 Key Functions

```typescript
// Checkout page
generateTimeSlots()           // Generate available time slots
isStep2Valid()               // Validate car dine-in form
processOrder()               // Create order with car details

// Admin page
handleUpdateOrderStatus()    // Update order status
// Service action handlers (to be implemented)
```

## 💡 Pro Tips

1. **Reuse existing patterns** - Follow the pre-order implementation style
2. **Keep it simple** - Don't add complexity unless required
3. **Test edge cases** - Empty fields, late times, etc.
4. **Use TypeScript** - Leverage type safety
5. **Follow conventions** - Match existing code style

## 🎯 Performance Tips

1. **Memoize time slots** - Generate once, cache in state
2. **Optimize filters** - Use client-side filtering
3. **Lazy load** - Only load car dine-in form when selected
4. **Debounce inputs** - For car details if needed

## 🔐 Security Checklist

- [x] Input validation on client
- [x] Input validation on server (Firebase rules)
- [x] Sanitize user inputs
- [x] No sensitive data in URLs
- [x] Secure payment flow
- [ ] Rate limiting (future)
- [ ] Audit logging (future)

## 📞 Support

**Questions?** Check:
1. This quick reference
2. Technical documentation
3. Code comments
4. Team chat/Slack

**Found a bug?** Report with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/device info
