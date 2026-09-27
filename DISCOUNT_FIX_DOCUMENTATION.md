# Discount Display Fix - Invoice Issue Resolution

## Problem
When a discount was applied in the admin order discount field, the discount amount was not shown in the invoice, even though the invoice total was correct after applying the discount.

## Root Causes Identified

### 1. **Duplicate Discount Column in SQL Query**
The invoice API query was using `SELECT i.*, ...` which already includes `i.discount`, and then adding another `COALESCE(i.discount, o.discount, 0) as discount`. This created a duplicate column that could override the actual invoice discount value.

**File:** `app/api/invoices/route.ts`
**Fix:** Removed the redundant `COALESCE(i.discount, o.discount, 0) as discount` line since `i.*` already includes the discount field.

### 2. **Type Coercion Issues in Display Logic**
The invoice page was using direct comparison `invoice.discount > 0` which could fail if the discount value was returned as a string "0" instead of number 0 from the database.

**Files Fixed:**
- `app/admin/invoices/[id]/page.tsx`

**Changes Made:**
- Updated all discount display conditions to use `parseFloat(invoice.discount?.toString() || '0') > 0`
- This ensures proper numeric comparison regardless of whether the value comes as a string or number

## Files Modified

### 1. `app/api/invoices/route.ts`
- Removed duplicate discount column from SELECT query
- Now relies on `i.discount` from `i.*` which is properly synced when orders are updated

### 2. `app/admin/invoices/[id]/page.tsx`
Updated discount display logic in 4 locations:
- **Main invoice display** (line ~810): Screen view of invoice
- **printReceiptFallback function** (line ~184): Browser print fallback
- **handleRawPrint function** (line ~421): USB thermal printer
- **handleWhatsAppShare function** (line ~480): WhatsApp message formatting

## How It Works Now

1. **When discount is applied in admin panel:**
   - Admin updates discount field in `/admin/orders` page
   - `updateDiscount()` function recalculates total and sends PUT request
   - Backend updates both `orders.discount` and `invoices.discount` (lines 136-146 in `orders/[id]/route.ts`)

2. **When invoice is viewed:**
   - Invoice API fetches data with `i.discount` from invoices table
   - Frontend properly checks if discount > 0 using parseFloat
   - Discount is displayed in all formats: screen, print, and WhatsApp

## Testing Checklist

✅ Apply discount in admin order page
✅ View invoice - discount should appear
✅ Print invoice (browser) - discount should appear
✅ Print invoice (USB thermal) - discount should appear  
✅ Send via WhatsApp - discount should appear in message
✅ Verify total calculation is correct

## Technical Details

### Database Schema
Both tables have discount column:
- `orders.discount` - DECIMAL(10, 2) DEFAULT 0
- `invoices.discount` - DECIMAL(10, 2) NOT NULL

### Sync Mechanism
When order discount is updated, the invoice is automatically updated via this query:
```sql
UPDATE invoices 
SET discount = COALESCE($3, discount)
WHERE order_id = $5
```

This ensures both tables stay in sync.

## Notes
- The fix handles both new orders and existing orders with discounts
- Type safety improved with optional chaining (`?.`) and default values
- All print formats (screen, thermal, browser print, WhatsApp) now consistently show discount
