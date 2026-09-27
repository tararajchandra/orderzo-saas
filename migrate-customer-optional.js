// Simple migration script to make customer details optional
// Run this with: node migrate-customer-optional.js

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting migration...\n');

        // Step 1: Make customer_name nullable
        console.log('Step 1: Making customer_name nullable...');
        await client.query('ALTER TABLE orders ALTER COLUMN customer_name DROP NOT NULL');
        console.log('✅ customer_name is now nullable\n');

        // Step 2: Make customer_phone nullable
        console.log('Step 2: Making customer_phone nullable...');
        await client.query('ALTER TABLE orders ALTER COLUMN customer_phone DROP NOT NULL');
        console.log('✅ customer_phone is now nullable\n');

        // Step 3: Update existing NULL values
        console.log('Step 3: Updating existing NULL values...');
        const result1 = await client.query(
            "UPDATE orders SET customer_name = 'Walk-in Customer' WHERE customer_name IS NULL OR customer_name = ''"
        );
        console.log(`✅ Updated ${result1.rowCount} rows for customer_name\n`);

        const result2 = await client.query(
            "UPDATE orders SET customer_phone = 'N/A' WHERE customer_phone IS NULL OR customer_phone = ''"
        );
        console.log(`✅ Updated ${result2.rowCount} rows for customer_phone\n`);

        // Verify the changes
        console.log('🔍 Verifying changes...');
        const verify = await client.query(`
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name IN ('customer_name', 'customer_phone')
        `);

        console.log('\nColumn Status:');
        verify.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.is_nullable === 'YES' ? '✅ Nullable' : '❌ Not Nullable'}`);
        });

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📝 What changed:');
        console.log('  • Salesperson can now create dine-in orders without customer details');
        console.log('  • Salesperson can now create takeaway orders without customer details');
        console.log('  • Delivery orders still require customer details\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration();
