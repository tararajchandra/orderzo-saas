# Order Total vs Invoice Total Discrepancy Fix

## Issue Description
The order list was showing ₹630.00 as the total amount, but when viewing the invoice for the same order, it showed ₹530.00. This was a ₹100 discrepancy caused by missing delivery charge display in the invoice.

## Root Cause
The issue had **two parts**:

### Part 1: Missing Discount Field in Order Update API
When a discount was updated on an order through the Admin Orders page:
1. The `updateDiscount` function in `/app/admin/orders/page.tsx` correctly calculated the new total and sent both `discount` and `total_amount` to the API
2. However, the API endpoint `/app/api/orders/[id]/route.ts` had the `discount` field **missing** from the UPDATE query parameters
3. The corresponding invoice record was **not being updated** when order totals changed

### Part 2: Missing Delivery Charge in Invoice Display (Main Issue)
The invoice display was not showing the delivery charge line item:
1. The order total calculation: `subtotal + tax + delivery_charge - discount`
2. The invoice was displaying: `subtotal + tax - discount` (missing delivery_charge)
3. The invoice **database** had the correct total, but the **display** was missing the delivery charge breakdown
4. This made it appear as if the totals were different, when in fact the invoice total was correct but incomplete in its breakdown

## Solution Implemented

### Changes to `/app/api/orders/[id]/route.ts`

1. **Added `discount` to the request body destructuring** (line 52)
2. **Added `discount` to the UPDATE query** (line 97)
3. **Added invoice synchronization logic** (lines 129-142) - Updates the invoice table when order totals change

### Changes to `/app/api/invoices/route.ts`

1. **Added `delivery_charge` to the SELECT query** (line 14):
   ```typescript
   SELECT i.*, o.customer_name, ..., o.delivery_charge, ...
   FROM invoices i
   JOIN orders o ON i.order_id = o.id
   ```

### Changes to `/app/admin/invoices/[id]/page.tsx`

1. **Added `delivery_charge` to InvoiceData interface** (line 13)
2. **Added delivery charge display in invoice totals** (line 800-806):
   ```tsx
   {invoice.delivery_charge && parseFloat(invoice.delivery_charge.toString()) > 0 && (
       <div>
           <span>Delivery Charge:</span>
           <span>₹{parseFloat(invoice.delivery_charge.toString()).toFixed(2)}</span>
       </div>
   )}
   ```
3. **Added delivery charge to browser print fallback** (line 183)
4. **Added delivery charge to USB thermal printer output** (line 420)
5. **Added delivery charge to WhatsApp invoice message** (line 479)

## Testing
After this fix:
1. View any order with a delivery charge
2. The order list will show the total including delivery charge
3. Click "View Invoice" - the invoice will now show:
   - Subtotal
   - Tax (if applicable)
   - **Delivery Charge** ← Now visible!
   - Discount (if applicable)
   - Total
4. The breakdown now matches the order total calculation
5. All print methods (browser, USB, WhatsApp) also show the delivery charge

## Impact
- **Fixed**: Invoice now shows complete breakdown including delivery charge
- **Fixed**: Order and invoice data synchronization when discount changes
- **No Breaking Changes**: Existing functionality remains intact
- **Data Integrity**: Delivery charges are now visible in all invoice views

## Date Fixed
December 20, 2025
