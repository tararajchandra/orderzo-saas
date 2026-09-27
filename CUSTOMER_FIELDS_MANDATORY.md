# Customer Name and Phone Made Mandatory

## Issue
Customer name and mobile number were not enforced as mandatory fields when admins and salesmen created orders, even though they were required by the database schema.

## Solution Implemented

### Changes Made

#### 1. Admin Order Creation (`app/admin/orders/create/page.tsx`)
**Added:**
- `required` attribute to customer name input (line 404)
- `required` attribute to phone number input (line 417)
- `pattern="[0-9]{10}"` validation for 10-digit phone numbers (line 418)
- Visual feedback: Red border when fields are empty (lines 405, 419)
- Tooltip message for phone validation (line 419)

**Before:**
```tsx
<input
    type="text"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    className="input"
    placeholder="Enter customer name"
/>
```

**After:**
```tsx
<input
    type="text"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}\n    className="input"
    placeholder="Enter customer name"
    required
    style={{ borderColor: !customerName ? 'var(--danger)' : undefined }}
/>
```

#### 2. Salesman Order Creation (`app/salesman/page.tsx`)
**Added:**
- `required` attribute to customer name input (line 291)
- `required` attribute to phone number input (line 300)
- `pattern="[0-9]{10}"` validation for 10-digit phone numbers (line 301)
- Visual feedback: Red border when fields are empty (lines 290, 298)
- Updated placeholders to include asterisk (*) to indicate required fields
- Tooltip message for phone validation (line 302)

**Before:**
```tsx
<input
    type="text"
    placeholder="Customer Name"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    className="input mb-1"
    style={{ padding: '0.5rem' }}
/>
```

**After:**
```tsx
<input
    type="text"
    placeholder="Customer Name *"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    className="input mb-1"
    style={{ padding: '0.5rem', borderColor: !customerName ? 'var(--danger)' : undefined }}
    required
/>
```

## Validation Layers

### 1. **HTML5 Validation** (Browser-level)
- `required` attribute prevents form submission if fields are empty
- `pattern="[0-9]{10}"` ensures phone number is exactly 10 digits
- `type="tel"` provides appropriate mobile keyboard on touch devices

### 2. **JavaScript Validation** (Already existed)
Both pages already had JavaScript validation:
```typescript
if (!customerName || !customerPhone) {
    alert('Please provide customer name and phone number');
    return;
}
```

### 3. **Visual Feedback**
- Empty required fields show red border
- Asterisk (*) in labels and placeholders indicates mandatory fields
- Tooltip on phone field explains the 10-digit requirement

## User Experience Improvements

1. **Immediate Feedback**: Red border appears when field is empty
2. **Clear Indication**: Asterisk (*) shows which fields are required
3. **Format Guidance**: Phone field shows expected format (10 digits)
4. **Prevents Errors**: Can't submit form without filling required fields

## Testing Checklist

- [ ] Admin cannot create order without customer name
- [ ] Admin cannot create order without phone number
- [ ] Phone number must be exactly 10 digits
- [ ] Salesman cannot create order without customer name
- [ ] Salesman cannot create order without phone number
- [ ] Visual feedback (red border) appears for empty fields
- [ ] Form submission is blocked until all required fields are filled

## Database Schema Alignment

These fields were already `NOT NULL` in the database schema:
```sql
CREATE TABLE orders (
    ...
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    ...
);
```

Now the frontend validation matches the backend requirements.

## Files Modified

1. `app/admin/orders/create/page.tsx` - Admin order creation form
2. `app/salesman/page.tsx` - Salesman order creation form

## Git Commit

```
Make customer name and phone mandatory for admin and salesman order creation
```

## Date Implemented
December 13, 2025
