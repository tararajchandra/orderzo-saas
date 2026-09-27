/**
 * Migration Runner - Run All Pending Migrations
 */

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

async function runAllMigrations() {
    const client = await pool.connect();

    try {
        console.log('🔄 Starting migrations...\n');

        // List of migrations to run
        const migrations = [
            '001_add_discount_column.sql',
            '002_add_order_number_column.sql'
        ];

        for (const migrationFile of migrations) {
            const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);

            if (!fs.existsSync(migrationPath)) {
                console.log(`⚠️  Skipping ${migrationFile} - file not found\n`);
                continue;
            }

            const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

            console.log(`📄 Running migration: ${migrationFile}`);

            // Execute the migration
            await client.query(migrationSQL);
            console.log(`✅ ${migrationFile} completed\n`);
        }

        console.log('📊 Verification:\n');

        // Verify discount column
        const discountCheck = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'discount'
        `);

        if (discountCheck.rows.length > 0) {
            console.log('✅ discount column:');
            console.log('   Type:', discountCheck.rows[0].data_type);
            console.log('   Default:', discountCheck.rows[0].column_default);
        }

        // Verify order_number column
        const orderNumberCheck = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'order_number'
        `);

        if (orderNumberCheck.rows.length > 0) {
            console.log('\n✅ order_number column:');
            console.log('   Type:', orderNumberCheck.rows[0].data_type);
            console.log('   Max Length:', orderNumberCheck.rows[0].character_maximum_length);
        }

        console.log('\n✅ All migrations completed successfully!');

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

// Run all migrations
runAllMigrations()
    .then(() => {
        console.log('\n🎉 All done! You can now restart your Next.js server.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Unexpected error:', error);
        process.exit(1);
    });
