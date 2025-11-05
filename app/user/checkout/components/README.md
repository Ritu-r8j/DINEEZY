# Checkout Components

This directory contains modular components for the checkout page, making the code more maintainable and reusable.

## Components Overview

### 1. **StepNavigation.tsx**
- Displays the 3-step progress indicator
- Shows current step and completed steps
- Props: `currentStep`

### 2. **CustomerInfoForm.tsx**
- Handles customer information input (name, email, phone)
- Different UI for logged-in vs guest users
- Props: `customerInfo`, `setCustomerInfo`, `isLoggedIn`

### 3. **OrderTypeSelection.tsx**
- Order type selection (Dine In, Takeaway, Delivery)
- Delivery options (when delivery is selected)
- Props: `orderTypes`, `deliveryOptions`, `selectedOrderType`, `selectOrderType`, `selectDeliveryOption`

### 4. **OrderReview.tsx**
- Special instructions textarea
- Cart items review with quantity controls
- Props: `cartItems`, `specialInstructions`, `setSpecialInstructions`, `updateQuantity`

### 5. **PaymentSection.tsx**
- Payment method selection
- Promo code input
- Props: `paymentMethods`, `promoCode`, `setPromoCode`, `selectPaymentMethod`

### 6. **OrderSummary.tsx**
- Desktop-only order summary sidebar
- Shows cart items, price breakdown, estimated time
- Props: `cartItems`, `subtotal`, `deliveryFee`, `tax`, `discount`, `total`, `estimatedTime`, `selectedOrderType`, `error`

### 7. **MobileSummary.tsx**
- Mobile-only floating bottom summary
- Expandable/collapsible design
- Includes action buttons for navigation
- Props: Multiple props for cart data, state management, and actions

### 8. **StepNavButtons.tsx**
- Navigation buttons for each step
- Handles different button states and actions
- Props: Step validation functions, navigation functions, order placement

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be reused in other parts of the app
3. **Testing**: Easier to write unit tests for individual components
4. **Debugging**: Issues can be isolated to specific components
5. **Code Organization**: Logical separation of concerns
6. **Performance**: Smaller components can be optimized individually

## Usage

```tsx
import {
    StepNavigation,
    CustomerInfoForm,
    OrderTypeSelection,
    // ... other components
} from './components';

// Use components in your checkout page
<StepNavigation currentStep={currentStep} />
<CustomerInfoForm 
    customerInfo={customerInfo}
    setCustomerInfo={setCustomerInfo}
    isLoggedIn={!!user}
/>
```

## File Structure

```
app/user/checkout/
├── components/
│   ├── StepNavigation.tsx
│   ├── CustomerInfoForm.tsx
│   ├── OrderTypeSelection.tsx
│   ├── OrderReview.tsx
│   ├── PaymentSection.tsx
│   ├── OrderSummary.tsx
│   ├── MobileSummary.tsx
│   ├── StepNavButtons.tsx
│   ├── index.ts
│   └── README.md
├── checkout.module.css
└── page.tsx
```