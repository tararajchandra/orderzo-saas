# Customer Details Optional - Migration Guide

## Overview
This migration makes `customer_name` and `customer_phone` optional in the orders table to support walk-in dine-in and takeaway orders where customer details may not be collected.

## Changes Made

### 1. Database Schema
- Modified `customer_name` from `NOT NULL` to nullable
- Modified `customer_phone` from `NOT NULL` to nullable
- Default values: "Walk-in Customer" for name, "N/A" for phone when not provided

### 2. Backend API (`app/api/orders/route.ts`)
- Updated validation to only require customer details for delivery orders
- Dine-in and takeaway orders can be created without customer details
- Default values are automatically applied when fields are empty

### 3. Frontend (`app/salesman/page.tsx`)
- Updated validation to only require customer details for delivery orders
- Dynamic placeholder text shows "(Optional)" for dine-in/takeaway
- Border highlighting only shows for delivery orders when fields are empty

## How to Run the Migration

### Option 1: Using psql (if you have PostgreSQL client installed)
```powershell
psql $env:DATABASE_URL -f database\migrations\008_make_customer_details_optional.sql
```

### Option 2: Using Railway CLI (for Railway database)
```powershell
railway run psql -f database/migrations/008_make_customer_details_optional.sql
```

### Option 3: Manual SQL Execution
Connect to your database and run the following SQL:

```sql
-- Make customer_name and customer_phone nullable
ALTER TABLE orders 
ALTER COLUMN customer_name DROP NOT NULL,
ALTER COLUMN customer_phone DROP NOT NULL;

-- Add default values for better data quality
UPDATE orders 
SET customer_name = 'Walk-in Customer' 
WHERE customer_name IS NULL OR customer_name = '';

UPDATE orders 
SET customer_phone = 'N/A' 
WHERE customer_phone IS NULL OR customer_phone = '';
```

### Option 4: Using Railway Dashboard
1. Go to your Railway project
2. Click on your PostgreSQL database
3. Go to the "Query" tab
4. Copy and paste the SQL from Option 3
5. Click "Execute"

## Testing

After running the migration, test the following:

### 1. Salesperson Dine-in Order (No Customer Details)
1. Login as salesperson
2. Select "Dine-in" order type
3. Enter table number
4. Add items to cart
5. Leave customer name and phone empty
6. Place order
7. ✅ Order should be created successfully with "Walk-in Customer" and "N/A"

### 2. Salesperson Takeaway Order (No Customer Details)
1. Login as salesperson
2. Select "Takeaway" order type
3. Add items to cart
4. Leave customer name and phone empty
5. Place order
6. ✅ Order should be created successfully

### 3. Delivery Order (Customer Details Required)
1. Select "Delivery" order type
2. Try to place order without customer details
3. ✅ Should show validation error
4. Fill in customer name and phone
5. ✅ Order should be created successfully

## Files Modified

1. `database/migrations/008_make_customer_details_optional.sql` - Migration file
2. `database/schema.sql` - Updated schema documentation
3. `app/api/orders/route.ts` - Updated validation logic
4. `app/salesman/page.tsx` - Updated UI and validation

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Make fields NOT NULL again (will fail if there are NULL values)
ALTER TABLE orders 
ALTER COLUMN customer_name SET NOT NULL,
ALTER COLUMN customer_phone SET NOT NULL;
```

Note: You'll need to update any NULL values before running the rollback.
