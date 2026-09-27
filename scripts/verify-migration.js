/**
 * Verify Migration Script
 * Checks if discount and order_number columns exist in the orders table
 */

const { Client } = require('pg');

async function verifyMigration() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connecting to database...\n');
        await client.connect();
        console.log('✅ Connected!\n');

        // Check for discount column
        const discountCheck = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'discount'
        `);

        // Check for order_number column
        const orderNumberCheck = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'order_number'
        `);

        console.log('📊 Migration Verification Results:\n');
        console.log('═══════════════════════════════════════════════════\n');

        // Discount column
        if (discountCheck.rows.length > 0) {
            console.log('✅ discount column EXISTS');
            console.log('   Type:', discountCheck.rows[0].data_type);
            console.log('   Default:', discountCheck.rows[0].column_default);
        } else {
            console.log('❌ discount column MISSING');
        }

        console.log('');

        // Order number column
        if (orderNumberCheck.rows.length > 0) {
            console.log('✅ order_number column EXISTS');
            console.log('   Type:', orderNumberCheck.rows[0].data_type);
            console.log('   Max Length:', orderNumberCheck.rows[0].character_maximum_length);
        } else {
            console.log('❌ order_number column MISSING');
        }

        console.log('\n═══════════════════════════════════════════════════\n');

        // Overall status
        const allGood = discountCheck.rows.length > 0 && orderNumberCheck.rows.length > 0;

        if (allGood) {
            console.log('🎉 All migrations completed successfully!');
            console.log('✅ Your database is up to date.\n');
        } else {
            console.log('⚠️  Some migrations are missing!');
            console.log('❌ Please run: npm run migrate\n');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Verification failed!');
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  Migration Verification');
console.log('  RuchiV2 Restaurant Management System');
console.log('═══════════════════════════════════════════════════\n');

verifyMigration();
