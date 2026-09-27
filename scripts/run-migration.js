const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Database configuration - matches lib/db.ts
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting migration...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_add_discount_column.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Running migration: 001_add_discount_column.sql');

        // Execute the migration
        const result = await client.query(migrationSQL);

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Verification:');

        // Verify the column exists
        const verifyResult = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'discount'
        `);

        if (verifyResult.rows.length > 0) {
            console.log('   Column Name:', verifyResult.rows[0].column_name);
            console.log('   Data Type:', verifyResult.rows[0].data_type);
            console.log('   Default Value:', verifyResult.rows[0].column_default);
            console.log('\n✅ Discount column is now available in the orders table!');
        } else {
            console.log('   ⚠️  Warning: Could not verify discount column');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error('Error:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('\n🎉 All done! You can now restart your Next.js server.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
