const { Pool } = require('pg');
require('dotenv').config({ path: '.env' }); // Use .env for Railway connection

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkRailwayPayoutsTable() {
    try {
        console.log('Connecting to Railway database...\n');

        // Check if payouts table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'payouts'
            );
        `);

        console.log('Payouts table exists:', tableCheck.rows[0].exists);

        if (tableCheck.rows[0].exists) {
            // Get table structure
            const structure = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'payouts' 
                ORDER BY ordinal_position
            `);

            console.log('\nPayouts table structure:');
            console.table(structure.rows);

            // Get row count
            const count = await pool.query('SELECT COUNT(*) FROM payouts');
            console.log('\nTotal rows in payouts table:', count.rows[0].count);
        } else {
            console.log('\n⚠️  Payouts table does NOT exist in Railway database!');
            console.log('You need to run the migration: database/migrations/add_payouts_table.sql');
        }

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

checkRailwayPayoutsTable();
