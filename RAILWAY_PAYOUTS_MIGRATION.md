# Railway Payouts Table Migration

## Issue
The `/api/admin/payouts` endpoint is returning a 500 error on Railway production because the `payouts` table might not exist or has a different structure.

## Solution
Run the payouts table migration on Railway database.

## Migration SQL

Copy and paste this SQL into Railway's PostgreSQL database console:

```sql
-- Create payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    delivery_boy_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Verify the table was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payouts' 
ORDER BY ordinal_position;
```

## How to Run on Railway

1. Go to your Railway project dashboard
2. Click on your PostgreSQL database
3. Click on "Data" or "Query" tab
4. Paste the SQL above
5. Click "Execute" or "Run"

## Verify

After running the migration, test the endpoint:
```bash
curl https://ruchiv2-production.up.railway.app/api/admin/payouts
```

You should get a 200 response with delivery boy commission data.

## Alternative: Run via Railway CLI

If you have Railway CLI installed:

```bash
railway run node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL});p.query('CREATE TABLE IF NOT EXISTS payouts(id SERIAL PRIMARY KEY,delivery_boy_id INTEGER REFERENCES users(id),amount DECIMAL(10,2) NOT NULL,payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,notes TEXT)').then(()=>{console.log('✓ Table created');p.end()}).catch(e=>{console.error(e);p.end()})"
```

## Notes

- The `payouts` table uses `delivery_boy_id` (not `user_id`) to match the migration file
- This is safe to run multiple times due to `IF NOT EXISTS` clause
- No existing data will be affected
