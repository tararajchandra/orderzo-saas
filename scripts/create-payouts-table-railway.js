const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrationSQL = `
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    delivery_boy_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
`;

async function runMigration() {
    try {
        console.log('🚀 Running payouts table migration on Railway...\n');

        await pool.query(migrationSQL);
        console.log('✅ Payouts table created successfully!');

        // Verify
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payouts' 
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Table structure:');
        console.table(result.rows);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
