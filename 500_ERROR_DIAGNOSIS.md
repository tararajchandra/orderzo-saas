# 500 Error Diagnosis: /api/orders

## Error Details
**Error**: 500 Internal Server Error  
**Endpoint**: `/api/orders`  
**Method**: Likely POST (creating new order)

## Root Cause Analysis

The error is most likely caused by one of these issues:

### 1. **Missing `discount` Column in Database** (Most Likely)
We recently added the `discount` field to the order creation code, but the database might not have this column yet.

**Symptoms:**
- Error occurs when creating a new order
- The schema file has `discount DECIMAL(10, 2) DEFAULT 0` at line 100
- But the actual database table might not have been updated

### 2. **Database Connection Issue**
- PostgreSQL might not be running
- Connection credentials might be incorrect

### 3. **Data Type Mismatch**
- The `discount` value being sent might not match the expected DECIMAL type

## Solution Steps

### Step 1: Check if discount column exists

Run this SQL query in your PostgreSQL database:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'discount';
```

**If the query returns no results**, the column doesn't exist and needs to be added.

### Step 2: Add the discount column (if missing)

```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
```

### Step 3: Verify the column was added

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'discount';
```

### Step 4: Test the API

Try creating an order again through the UI or with this test:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "customer_phone": "1234567890",
    "items": [{"menuItem": {"id": 1, "name": "Test", "price": 100}, "quantity": 1}],
    "subtotal": 100,
    "tax": 5,
    "discount": 10,
    "total_amount": 95,
    "payment_method": "cash",
    "order_type": "takeaway"
  }'
```

## Alternative: Check Server Logs

If you're running the dev server, check the terminal where `npm run dev` is running for the actual error message. It will show the exact SQL error or other issue.

## Quick Fix Script

I've created a migration script at `database/migrations/add_discount_column.sql` that you can run to fix this issue.

## Prevention

In the future, when adding new fields:
1. Update the schema.sql file ✅ (Done)
2. Create a migration script for existing databases
3. Run the migration on your database
4. Then update the API code

## Files to Check

1. **Database Schema**: `database/schema.sql` (line 100) - Has discount field ✅
2. **API Route**: `app/api/orders/route.ts` (line 129) - Uses discount field ✅
3. **Actual Database**: Needs to be updated with migration ❌

## Next Steps

1. Run the migration script (see below)
2. Restart your Next.js dev server
3. Try creating an order again
4. If error persists, check the server console for the actual error message
