# Daily Order Numbering System

## Overview

The Ruchi Restaurant Management System now implements a **daily sequential order numbering system** that automatically resets each day. This provides clear, organized order tracking with easy-to-read order numbers.

---

## Order Number Format

### Format Structure
```
YYYYMMDD-XXX
```

### Components
- **YYYYMMDD**: Date in format Year-Month-Day (8 digits)
- **-**: Separator
- **XXX**: Sequential number (3 digits, zero-padded)

### Examples
- First order of December 16, 2025: `20251216-001`
- Second order of December 16, 2025: `20251216-002`
- 25th order of December 16, 2025: `20251216-025`
- 100th order of December 16, 2025: `20251216-100`

---

## How It Works

### 1. **Daily Reset**
- Order numbers reset to `001` at the start of each new day
- The date prefix changes automatically based on the current date
- Previous day's orders retain their original numbers

### 2. **Sequential Numbering**
- Each new order increments the counter by 1
- Numbers are zero-padded to 3 digits (001, 002, ..., 999)
- System can handle up to 999 orders per day

### 3. **Automatic Generation**
When a new order is created:
1. System gets current date in YYYYMMDD format
2. Queries database for count of today's orders
3. Increments count by 1
4. Generates order number: `{date}-{count}`
5. Saves order with unique order number

---

## Benefits

### ✅ **Easy Identification**
- Instantly know which day an order was placed
- Quick visual scanning of order lists
- Clear organization by date

### ✅ **Simple Communication**
- Easy to communicate: "Order 001" instead of "Order 12345"
- Customers can easily remember their order number
- Reduces confusion with similar-looking numbers

### ✅ **Daily Tracking**
- Track daily order volume at a glance
- Easy to identify peak days
- Simplified daily reconciliation

### ✅ **Unique & Reliable**
- Each order number is unique across all time
- No duplicate order numbers possible
- Database constraint ensures uniqueness

---

## Database Implementation

### Schema Changes

**New Field:**
```sql
order_number VARCHAR(20) UNIQUE
```

**Index:**
```sql
CREATE INDEX idx_orders_order_number ON orders(order_number);
```

### Migration

Run the migration file to add the order_number field:
```bash
psql -d your_database -f database/migrations/add_order_number.sql
```

Or execute directly:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
```

---

## API Changes

### Order Creation Endpoint

**File:** `app/api/orders/route.ts`

**New Logic:**
```typescript
// Generate daily sequential order number
const today = new Date();
const datePrefix = today.toISOString().split('T')[0].replace(/-/g, '');

// Get count of orders created today
const orderCountResult = await query(
    `SELECT COUNT(*) as count FROM orders 
     WHERE order_number LIKE $1 
     AND DATE(created_at) = CURRENT_DATE`,
    [`${datePrefix}-%`]
);
const orderCount = parseInt(orderCountResult.rows[0].count) + 1;
const orderNumber = `${datePrefix}-${String(orderCount).padStart(3, '0')}`;
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "20251216-001",
    "customer_name": "John Doe",
    "total_amount": 500,
    ...
  }
}
```

---

## Usage Examples

### 1. **Creating an Order**

**Request:**
```javascript
POST /api/orders
{
  "customer_name": "John Doe",
  "customer_phone": "1234567890",
  "items": [...],
  "total_amount": 500,
  "payment_method": "cash"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "id": 45,
    "order_number": "20251216-001", // ← Auto-generated
    "customer_name": "John Doe",
    ...
  }
}
```

### 2. **Displaying Order Number**

**In Admin Panel:**
```tsx
<div>
  <h3>Order #{order.order_number}</h3>
  <p>Order ID: {order.id}</p>
</div>
```

**Output:**
```
Order #20251216-001
Order ID: 45
```

### 3. **Searching by Order Number**

```sql
SELECT * FROM orders WHERE order_number = '20251216-001';
```

### 4. **Getting Today's Orders**

```sql
SELECT * FROM orders 
WHERE DATE(created_at) = CURRENT_DATE 
ORDER BY order_number;
```

---

## Frontend Integration

### Displaying Order Numbers

**Order List:**
```tsx
{orders.map(order => (
  <div key={order.id}>
    <h4>Order #{order.order_number}</h4>
    <p>Customer: {order.customer_name}</p>
    <p>Amount: ₹{order.total_amount}</p>
  </div>
))}
```

**Order Details:**
```tsx
<div className="order-header">
  <h2>Order Details</h2>
  <p className="order-number">#{order.order_number}</p>
  <p className="order-date">{formatDate(order.created_at)}</p>
</div>
```

**Invoice:**
```tsx
<div className="invoice-header">
  <h1>Invoice</h1>
  <p>Order Number: {order.order_number}</p>
  <p>Invoice Number: {invoice.invoice_number}</p>
  <p>Date: {formatDate(order.created_at)}</p>
</div>
```

---

## Reports & Analytics

### Daily Order Count

```sql
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  MAX(order_number) as last_order
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;
```

**Example Output:**
```
order_date  | total_orders | last_order
------------|--------------|-------------
2025-12-16  | 45           | 20251216-045
2025-12-15  | 52           | 20251215-052
2025-12-14  | 38           | 20251214-038
```

### Peak Day Analysis

```sql
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as order_count
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY order_count DESC
LIMIT 10;
```

---

## Migration Guide

### For Existing Installations

**Step 1: Run Migration**
```bash
# Connect to your database
psql -U your_user -d ruchi_db

# Run migration
\i database/migrations/add_order_number.sql
```

**Step 2: Update Existing Orders (Optional)**

If you want to assign order numbers to existing orders:

```sql
-- This will assign sequential numbers based on creation date
WITH numbered_orders AS (
  SELECT 
    id,
    TO_CHAR(created_at, 'YYYYMMDD') as date_prefix,
    ROW_NUMBER() OVER (
      PARTITION BY DATE(created_at) 
      ORDER BY created_at
    ) as daily_seq
  FROM orders
  WHERE order_number IS NULL
)
UPDATE orders o
SET order_number = n.date_prefix || '-' || LPAD(n.daily_seq::text, 3, '0')
FROM numbered_orders n
WHERE o.id = n.id;
```

**Step 3: Deploy Updated Code**
```bash
# Pull latest code
git pull origin main

# Restart application
npm run build
pm2 restart ruchi
```

---

## Troubleshooting

### Issue: Duplicate Order Numbers

**Cause:** Race condition when multiple orders created simultaneously

**Solution:** Database UNIQUE constraint prevents duplicates. If collision occurs, retry with incremented number.

**Prevention:** Use database transactions for order creation.

### Issue: Order Number Not Showing

**Cause:** Migration not run or field not added

**Solution:**
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'order_number';

-- If not exists, run migration
ALTER TABLE orders ADD COLUMN order_number VARCHAR(20) UNIQUE;
```

### Issue: Order Numbers Skipping

**Cause:** Failed order creation attempts still increment counter

**Solution:** This is expected behavior. Ensures uniqueness even if some orders fail.

---

## Best Practices

### 1. **Display Order Number Prominently**
- Show on order confirmation
- Include in customer notifications
- Display on invoices and receipts
- Use in customer communication

### 2. **Use for Customer Reference**
```
"Your order #20251216-001 has been confirmed"
"Order #20251216-001 is out for delivery"
```

### 3. **Internal Order ID vs Order Number**
- **Order ID (id):** Internal database primary key
- **Order Number (order_number):** Customer-facing reference
- Use order_number for customer communication
- Use id for internal database operations

### 4. **Search Functionality**
- Allow customers to search by order number
- Implement autocomplete for order number search
- Support partial matching (e.g., "001" finds today's first order)

---

## Future Enhancements

### Possible Improvements

1. **Custom Prefixes**
   - Add restaurant code: `RES1-20251216-001`
   - Add location code: `DL-20251216-001`

2. **Order Type Indicators**
   - Delivery: `D-20251216-001`
   - Takeaway: `T-20251216-001`
   - Dine-in: `I-20251216-001`

3. **Extended Capacity**
   - Support more than 999 orders/day
   - Use 4-digit sequence: `20251216-0001`

4. **Custom Reset Period**
   - Weekly reset instead of daily
   - Monthly reset for low-volume restaurants

---

## Summary

✅ **Implemented:** Daily sequential order numbering  
✅ **Format:** YYYYMMDD-XXX  
✅ **Auto-Reset:** Every day at midnight  
✅ **Unique:** Database constraint ensures no duplicates  
✅ **User-Friendly:** Easy to read and communicate  

**Migration Required:** Yes (run `add_order_number.sql`)  
**Breaking Changes:** None (backward compatible)  
**Customer Impact:** Positive (clearer order references)

---

**Last Updated:** December 16, 2025  
**Version:** 2.1  
**Status:** ✅ Implemented and Ready
