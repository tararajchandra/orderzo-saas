# Discount Display Fix

## Issue
Discount field and amount were not showing in printed invoices even though discount was being applied to the total.

## Root Cause
The invoice API query was not explicitly selecting the discount field, causing it to be missing from the invoice data when displayed/printed.

## Solution

### 1. **Updated Invoice API Query** (`app/api/invoices/route.ts`)
- Added explicit selection of discount field
- Used `COALESCE(i.discount, o.discount, 0)` to ensure discount is always available
- Falls back to order discount if invoice discount is null

### 2. **Added Discount Display to Quick Bill** (`app/admin/quick-bill/page.tsx`)
- **Browser Fallback Print**: Added discount line between tax and total
- **USB Thermal Print**: Added discount line in thermal printer output
- Format: `Discount: -XX.XX` (shown with minus sign)
- Only displays if discount > 0

### 3. **Verified Other Pages**
- ✅ `app/admin/orders/create/page.tsx` - Already had discount display
- ✅ `app/admin/orders/page.tsx` - Already had discount display  
- ✅ `app/admin/invoices/[id]/page.tsx` - Already had discount display

## Changes Made

### Invoice API (`app/api/invoices/route.ts`)
```typescript
// Before
SELECT i.*, o.customer_name, o.customer_phone, o.customer_address, 
       o.items, o.payment_method, o.payment_status, o.order_type,
       o.created_at as order_date, o.table_number
FROM invoices i
JOIN orders o ON i.order_id = o.id

// After
SELECT i.*, o.customer_name, o.customer_phone, o.customer_address, 
       o.items, o.payment_method, o.payment_status, o.order_type,
       o.created_at as order_date, o.table_number,
       COALESCE(i.discount, o.discount, 0) as discount
FROM invoices i
JOIN orders o ON i.order_id = o.id
```

### Quick Bill Browser Print
```html
<div class="text-right">Subtotal: ${Number(order.subtotal).toFixed(2)}</div>
${(settings?.gstType === 'regular' && Number(order.tax_amount || 0) > 0) 
    ? `<div class="text-right">Tax: ${Number(order.tax_amount).toFixed(2)}</div>` 
    : ''}
${Number(order.discount_amount || 0) > 0 
    ? `<div class="text-right">Discount: -${Number(order.discount_amount).toFixed(2)}</div>` 
    : ''}
<div class="text-right header-medium">TOTAL: ${Number(order.total_amount).toFixed(2)}</div>
```

### Quick Bill USB Print
```typescript
printer.textLine(`Subtotal: ${Number(order.subtotal).toFixed(2)}`);
if (settings?.gstType === 'regular' && Number(order.tax_amount || 0) > 0) 
    printer.textLine(`Tax: ${Number(order.tax_amount).toFixed(2)}`);
if (Number(order.discount_amount || 0) > 0) 
    printer.textLine(`Discount: -${Number(order.discount_amount).toFixed(2)}`);
printer.textLine(`TOTAL: ${Number(order.total_amount).toFixed(2)}`);
```

## Invoice Display Format

### Before (Missing Discount):
```
Subtotal:     780.00
TOTAL:        750.00  ← Where did 30 go?
```

### After (With Discount):
```
Subtotal:     780.00
Discount:     -30.00  ← Now visible!
─────────────────────
TOTAL:        750.00
```

## Testing

To verify the fix:

1. **Create a new order with discount**:
   - Add items to cart
   - Enter discount amount (e.g., 30)
   - Save the order

2. **Print the invoice**:
   - Go to invoice page
   - Click print
   - Verify discount line appears between subtotal and total

3. **Check all print methods**:
   - ✅ Browser fallback print
   - ✅ USB thermal print
   - ✅ Quick bill print
   - ✅ Order creation print

## Files Modified

1. `app/api/invoices/route.ts` - Updated query to include discount
2. `app/admin/quick-bill/page.tsx` - Added discount to browser and USB prints

## Benefits

✅ **Transparency**: Customers can now see the discount applied  
✅ **Accuracy**: Invoice breakdown matches the actual calculation  
✅ **Consistency**: All print methods show discount uniformly  
✅ **Compliance**: Proper invoice formatting with all line items

## Notes

- Discount only shows if amount > 0
- Displayed with minus sign (e.g., `-30.00`)
- Works for both browser and thermal printer outputs
- Compatible with both regular GST and Bill of Supply formats
