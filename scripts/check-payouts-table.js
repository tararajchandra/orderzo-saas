const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkPayoutsTable() {
    try {
        console.log('Checking payouts table structure...\n');

        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'payouts' 
            ORDER BY ordinal_position
        `);

        console.log('Payouts table columns:');
        console.table(result.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPayoutsTable();
