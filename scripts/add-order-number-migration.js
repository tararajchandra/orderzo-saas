/**
 * Migration Script: Add Order Number Field
 * Purpose: Add order_number column to orders table for daily sequential numbering
 * Run: node scripts/add-order-number-migration.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting migration: Add order_number field...\n');

        // Start transaction
        await client.query('BEGIN');

        // Step 1: Add order_number column
        console.log('📝 Step 1: Adding order_number column...');
        await client.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE
        `);
        console.log('✅ Column added successfully\n');

        // Step 2: Create index
        console.log('📝 Step 2: Creating index on order_number...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_orders_order_number 
            ON orders(order_number)
        `);
        console.log('✅ Index created successfully\n');

        // Step 3: Add comment
        console.log('📝 Step 3: Adding column comment...');
        await client.query(`
            COMMENT ON COLUMN orders.order_number 
            IS 'Daily sequential order number in format YYYYMMDD-XXX'
        `);
        console.log('✅ Comment added successfully\n');

        // Step 4: Update existing orders with sequential numbers (optional)
        console.log('📝 Step 4: Updating existing orders with order numbers...');
        const updateResult = await client.query(`
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
            WHERE o.id = n.id
            RETURNING o.id, o.order_number
        `);
        console.log(`✅ Updated ${updateResult.rowCount} existing orders\n`);

        // Commit transaction
        await client.query('COMMIT');

        // Verify migration
        console.log('📝 Verifying migration...');
        const verifyResult = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'order_number'
        `);

        if (verifyResult.rows.length > 0) {
            console.log('✅ Migration verified successfully');
            console.log('Column details:', verifyResult.rows[0]);
        } else {
            throw new Error('Migration verification failed - column not found');
        }

        // Show sample orders
        console.log('\n📊 Sample orders with new order numbers:');
        const sampleResult = await client.query(`
            SELECT id, order_number, customer_name, total_amount, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 5
        `);

        if (sampleResult.rows.length > 0) {
            console.table(sampleResult.rows);
        } else {
            console.log('No orders found in database');
        }

        console.log('\n✅ Migration completed successfully! 🎉\n');
        console.log('📝 Next steps:');
        console.log('1. Deploy updated code to production');
        console.log('2. Test order creation with new numbering system');
        console.log('3. Update frontend to display order numbers\n');

    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
runMigration().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
