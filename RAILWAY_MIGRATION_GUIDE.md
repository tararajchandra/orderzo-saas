# Railway Database Migration Guide

## Overview
This guide explains how to run database migrations on Railway to add the `discount` and `order_number` columns to your production database.

## What Gets Migrated

The migration script will:
1. ✅ Run the main schema (`database/schema.sql`)
2. ✅ Run additional migrations from `database/migrations/`:
   - `001_add_discount_column.sql` - Adds discount column to orders table
   - `002_add_order_number_column.sql` - Adds order_number column to orders table

## Method 1: Run Migration via Railway CLI (Recommended)

### Prerequisites
- Railway CLI installed: `npm install -g @railway/cli`
- Logged in to Railway: `railway login`

### Steps

1. **Link your project** (if not already linked):
   ```bash
   railway link
   ```

2. **Run the migration**:
   ```bash
   railway run npm run migrate
   ```

   This will:
   - Connect to your Railway PostgreSQL database
   - Run the schema.sql file
   - Run all migration files in order
   - Show you the results

3. **Verify the migration**:
   ```bash
   railway run node -e "const {Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();const r=await c.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name IN ('discount','order_number')\");console.log('Columns:',r.rows);await c.end();})()"
   ```

## Method 2: Run Migration via Railway Dashboard

### Steps

1. **Go to your Railway project dashboard**
2. **Click on your service** (the Next.js app)
3. **Go to "Settings" tab**
4. **Scroll to "Deploy"**
5. **Add a custom start command** (temporarily):
   ```
   npm run migrate && npm start
   ```
6. **Redeploy** your application
7. **After migration completes**, change the start command back to:
   ```
   npm start
   ```

## Method 3: Manual SQL Execution

If you prefer to run SQL directly:

### Steps

1. **Go to Railway Dashboard**
2. **Click on your PostgreSQL database**
3. **Click "Data" tab**
4. **Click "Query"**
5. **Run these SQL commands**:

```sql
-- Add discount column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;

-- Add order_number column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('discount', 'order_number');
```

## Method 4: One-Time Deployment Script

### Create a one-time migration deployment:

1. **Update `package.json`** to add a postbuild script:
   ```json
   {
     "scripts": {
       "build": "next build",
       "postbuild": "npm run migrate"
     }
   }
   ```

2. **Push to Railway**:
   ```bash
   git add .
   git commit -m "Add migration to build process"
   git push
   ```

3. **After deployment**, remove the postbuild script to prevent running migrations on every build.

## Verification

After running the migration, verify it worked:

### Check via Railway CLI:
```bash
railway run node scripts/verify-migration.js
```

### Check via API:
Create a test order with a discount and verify it saves correctly.

## Troubleshooting

### Error: "column already exists"
✅ **This is fine!** The migration script handles this gracefully. It means the column was already added.

### Error: "DATABASE_URL not set"
❌ **Fix**: Make sure you're using `railway run` or the DATABASE_URL environment variable is set in Railway.

### Error: "Connection refused"
❌ **Fix**: 
1. Check that your PostgreSQL database is running in Railway
2. Verify DATABASE_URL is correct
3. Ensure SSL is enabled in the connection

### Migration runs but columns still missing
❌ **Fix**:
1. Check the migration logs for errors
2. Verify you're connected to the correct database
3. Run the verification query to confirm

## Migration Script Details

The `scripts/migrate-railway.js` script:
- ✅ Connects to Railway PostgreSQL with SSL
- ✅ Runs main schema.sql
- ✅ Runs all .sql files in database/migrations/ in alphabetical order
- ✅ Handles duplicate column errors gracefully
- ✅ Verifies tables and data after migration
- ✅ Shows admin credentials

## Environment Variables Required

The migration script uses:
- `DATABASE_URL` - Automatically provided by Railway PostgreSQL

No additional configuration needed!

## Best Practices

1. **Always backup** before running migrations (Railway does this automatically)
2. **Test locally first** using the same migration script
3. **Run during low traffic** periods if possible
4. **Verify** the migration completed successfully
5. **Monitor** your application after migration

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove discount column
ALTER TABLE orders DROP COLUMN IF EXISTS discount;

-- Remove order_number column  
ALTER TABLE orders DROP COLUMN IF EXISTS order_number;
```

**Note**: This will delete any discount/order_number data!

## Support

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check the migration output for specific errors
3. Verify database connection: `railway run node -e "console.log(process.env.DATABASE_URL)"`

## Files Involved

- `scripts/migrate-railway.js` - Main migration script
- `database/schema.sql` - Full database schema
- `database/migrations/001_add_discount_column.sql` - Discount column migration
- `database/migrations/002_add_order_number_column.sql` - Order number migration
- `package.json` - Contains `migrate` script

## Quick Command Reference

```bash
# Run migration
railway run npm run migrate

# Check logs
railway logs

# Connect to database
railway run psql

# Verify columns
railway run node -e "const {Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();const r=await c.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='orders'\");console.log(r.rows.map(r=>r.column_name));await c.end();})()"
```

## After Migration

Once migration is complete:
1. ✅ Restart your Railway service
2. ✅ Test creating an order with a discount
3. ✅ Verify the invoice shows the discount
4. ✅ Check that order numbers are generated correctly

Your Railway database is now up to date! 🎉
