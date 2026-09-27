# Delivery Charge Field Addition - Quick Bill Feature

## Overview
Added a manual delivery charge input field to the Quick Bill (Create Order) page in the admin panel, allowing admins to add custom delivery charges to any order type.

## Changes Made

### 1. **State Management** (`app/admin/orders/create/page.tsx`)
- Added new state variable: `manualDeliveryCharge` (line ~61)
- Initialized to 0 by default

### 2. **Delivery Charge Calculation Logic**
Updated `getDeliveryCharge()` function to:
- **Priority 1**: Use manual delivery charge if entered (> 0)
- **Priority 2**: For delivery orders with selected location, use location-based charge
- **Priority 3**: Return 0 if neither applies

```typescript
const getDeliveryCharge = () => {
    // If manual delivery charge is set, use it
    if (manualDeliveryCharge > 0) return manualDeliveryCharge;
    
    // Otherwise, for delivery orders, use location-based charge
    if (orderType !== 'delivery' || !selectedLocationId) return 0;
    const location = deliveryLocations.find(loc => loc.id === selectedLocationId);
    return location ? Number(location.delivery_charge) : 0;
};
```

### 3. **User Interface**
Added manual delivery charge input field in the order form (after discount field):
- **Label**: "Delivery Charge:"
- **Input Type**: Number
- **Validation**: Minimum 0, step 0.01
- **Width**: 120px
- **Alignment**: Right-aligned text
- **Position**: Below the discount input, above the total

### 4. **Display in Totals Section**
Updated the delivery charge display condition:
- **Before**: Only showed for delivery orders with selected location
- **After**: Shows whenever `getDeliveryCharge() > 0`
- This means it displays for:
  - Manual delivery charges (any order type)
  - Location-based charges (delivery orders)

### 5. **Print Receipt Integration**

#### Browser Print Fallback
- Updated subtotal calculation to exclude delivery charge
- Added delivery charge line item display
- Shows only when delivery charge > 0

#### USB Thermal Printer
- Updated subtotal calculation to exclude delivery charge
- Added delivery charge line item to receipt
- Shows only when delivery charge > 0

#### Printable Order Object
- Added `delivery_charge: getDeliveryCharge()` to the printable order data
- Ensures correct display in all print formats

## Use Cases

### 1. **Delivery Orders with Location**
- Admin selects delivery location → automatic charge applied
- Admin can override by entering manual delivery charge

### 2. **Takeaway/Dine-in with Delivery Charge**
- Admin can add delivery charge manually
- Useful for special cases (e.g., takeaway with delivery service)

### 3. **Custom Delivery Charges**
- Admin can enter any custom amount
- Overrides location-based charges

## Invoice Integration

The delivery charge is already handled in the backend:
- `orders` table has `delivery_charge` column
- `invoices` table syncs delivery charge from orders
- Invoice display already shows delivery charge (from previous implementation)

## Technical Details

### Data Flow
1. **User Input** → `manualDeliveryCharge` state
2. **Calculation** → `getDeliveryCharge()` function
3. **Display** → Totals section (if > 0)
4. **Submit** → Included in `orderData.delivery_charge`
5. **Backend** → Saved to database
6. **Invoice** → Automatically synced and displayed

### Validation
- Minimum value: 0
- Step: 0.01 (allows cents)
- Type: Number input with validation

### Backward Compatibility
- Existing delivery orders continue to work
- Location-based charges still function
- Manual charge takes priority when set

## Testing Checklist

✅ Create takeaway order with manual delivery charge
✅ Create delivery order with location (auto charge)
✅ Create delivery order and override with manual charge
✅ Verify delivery charge appears in totals
✅ Verify delivery charge in browser print
✅ Verify delivery charge in USB thermal print
✅ Verify delivery charge in invoice
✅ Verify total calculation is correct
✅ Test with 0 delivery charge (should not display)

## Files Modified

1. **`app/admin/orders/create/page.tsx`**
   - Added state variable
   - Updated calculation logic
   - Added UI input field
   - Updated display conditions
   - Updated print functions
   - Updated printable order object

## Notes

- The manual delivery charge field is always visible, regardless of order type
- It provides flexibility for edge cases and special scenarios
- The field respects the existing location-based delivery charge system
- All print formats (browser, USB, invoice) correctly display the delivery charge
