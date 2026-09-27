# Fix 500 Error - Quick Guide

## Problem
Getting **500 Internal Server Error** when trying to create orders at `/api/orders`

## Root Cause
The database is missing the `discount` column that was recently added to the code.

## Solution (Choose One Method)

### Method 1: Run Migration Script (Recommended)

1. **Update database credentials** in the migration script:
   - Open `scripts/run-migration.js`
   - Update the database credentials (host, port, database, user, password)
   
2. **Run the migration**:
   ```bash
   node scripts/run-migration.js
   ```

3. **Restart your Next.js server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

### Method 2: Manual SQL (If you prefer)

1. **Connect to your PostgreSQL database** using pgAdmin, psql, or any SQL client

2. **Run this SQL command**:
   ```sql
   ALTER TABLE orders 
   ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
   ```

3. **Verify it worked**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'orders' 
   AND column_name = 'discount';
   ```

4. **Restart your Next.js server**

### Method 3: Recreate Database (Nuclear Option)

If you don't have important data:

1. **Drop and recreate the database**:
   ```sql
   DROP DATABASE ruchi_restaurant;
   CREATE DATABASE ruchi_restaurant;
   ```

2. **Run the full schema**:
   ```bash
   psql -U postgres -d ruchi_restaurant -f database/schema.sql
   ```

3. **Restart your Next.js server**

## Verification

After running the migration, test by creating an order:

1. Go to **Create Order** or **Quick Bill** page
2. Add items to cart
3. Enter customer details
4. **Enter a discount amount** (e.g., 10)
5. Click **Save** or **Save & Print**

If it works without error, you're all set! ✅

## What Changed?

We recently added a manual discount field to the order creation forms. The code was updated to use this field, but the database schema needs to be updated to match.

**Files Updated:**
- `app/admin/orders/create/page.tsx` - Added discount input
- `app/admin/quick-bill/page.tsx` - Added discount input
- `app/api/orders/route.ts` - Uses discount in INSERT query

**Database Change Needed:**
- `orders` table needs `discount` column

## Troubleshooting

### Still getting 500 error?

1. **Check the server console** where `npm run dev` is running
2. Look for the actual error message (it will show the SQL error)
3. Common issues:
   - Database not running
   - Wrong database credentials
   - Column still missing (migration didn't run)

### Migration script not working?

1. **Check database credentials** in `scripts/run-migration.js`
2. **Ensure PostgreSQL is running**
3. **Try manual SQL method** instead

### Need help?

Check these files for more details:
- `500_ERROR_DIAGNOSIS.md` - Detailed diagnosis
- `database/migrations/001_add_discount_column.sql` - Migration SQL
- `scripts/run-migration.js` - Migration runner

## Prevention

For future schema changes:
1. ✅ Update `database/schema.sql`
2. ✅ Create migration script in `database/migrations/`
3. ✅ Run migration on database
4. ✅ Update API code
5. ✅ Test thoroughly

This ensures the database and code stay in sync!
