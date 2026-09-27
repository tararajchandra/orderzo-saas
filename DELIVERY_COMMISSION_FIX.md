# Delivery Boy Commission Fix

## Issue Summary
The delivery boy commission was not being displayed due to a **500 Internal Server Error** in the `/api/admin/payouts` endpoint.

## Root Cause
The payouts API route (`app/api/admin/payouts/route.ts`) was using an incorrect column name based on the schema.sql file, but the **actual database** was created using a migration file that uses different column names.

**The Mismatch:**
- **schema.sql** (ideal structure): Uses `user_id`  
- **Actual migration** (`database/migrations/add_payouts_table.sql`): Uses `delivery_boy_id`
- **API code** (initially): Was trying to use `user_id`

The migration file shows:
```sql
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    delivery_boy_id INTEGER REFERENCES users(id),  -- ✓ Actual column name
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

Additionally, there was a SQL GROUP BY error where not all non-aggregated columns were included in the GROUP BY clause.

## Changes Made

### 1. Fixed POST Endpoint
**Changes:**
- Used `delivery_boy_id` to match actual database column
- Simplified to only include fields that exist in the migration: `delivery_boy_id`, `amount`, `payment_date`, `notes`
- Removed references to non-existent columns (`payment_method`)

**After:**
```typescript
const { user_id, amount, payout_date, notes } = body;
INSERT INTO payouts (delivery_boy_id, amount, payment_date, notes) 
VALUES ($1, $2, $3, $4)
```

### 2. Fixed GET Endpoint
**Problem:** SQL query had two issues:
1. Used `user_id` instead of `delivery_boy_id` in the JOIN
2. Missing columns in GROUP BY clause causing PostgreSQL error

**After:**
```sql
SELECT 
    u.id, u.name, u.phone, u.commission_rate, u.commission_type,
    COALESCE(SUM(o.driver_commission), 0) as total_earned,
    COALESCE(SUM(p.amount), 0) as total_paid
FROM users u
LEFT JOIN orders o ON u.id = o.delivery_boy_id AND o.order_status = 'delivered'
LEFT JOIN payouts p ON u.id = p.delivery_boy_id
WHERE u.role = 'delivery_boy'
GROUP BY u.id, u.name, u.phone, u.commission_rate, u.commission_type
```

### 3. Fixed Frontend Payouts Page (Line 59)
**Before:**
```typescript
body: JSON.stringify({
    delivery_boy_id: selectedBoy.id,
    amount: parseFloat(payAmount),
    notes
})
```

**After:**
```typescript
body: JSON.stringify({
    user_id: selectedBoy.id,
    amount: parseFloat(payAmount),
    notes
})
```

## How Commission Works

### Commission Calculation Flow:
1. **Delivery Boy Setup**: Admin sets commission rate and type (fixed/percentage) when creating/editing delivery boy
2. **Order Assignment**: Delivery boy accepts an order
3. **Order Completion**: When delivery boy marks order as "delivered", the system:
   - Fetches delivery boy's commission settings from `users` table
   - Calculates commission based on type:
     - **Percentage**: `(order_total × commission_rate) / 100`
     - **Fixed**: `commission_rate`
   - Stores result in `orders.driver_commission`

### Display Locations:
1. **Delivery Dashboard** (`app/delivery/page.tsx`):
   - Shows commission per order (line 212-217)
   - Shows total earnings at top (line 135, 157)

2. **Admin Payouts Report** (`/api/admin/payouts`):
   - Lists all delivery boys
   - Shows `total_earned` (sum of all commissions)
   - Shows `total_paid` (sum of all payouts)
   - Calculates `due_amount` (earned - paid)

## Testing Checklist
- [ ] Verify `/api/admin/payouts` returns 200 status (not 500)
- [ ] Check delivery dashboard shows commission for delivered orders
- [ ] Confirm commission calculation is correct for both fixed and percentage types
- [ ] Test payout creation with all required fields

## Related Files
- `app/api/admin/payouts/route.ts` - Fixed API endpoint (backend)
- `app/admin/payouts/page.tsx` - Fixed payouts page (frontend)
- `app/api/orders/[id]/route.ts` - Commission calculation logic
- `app/delivery/page.tsx` - Commission display on delivery dashboard
- `database/schema.sql` - Database schema reference

## Date Fixed
December 13, 2025
