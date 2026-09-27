const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔄 Running delivery locations migration...');

        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '007_add_delivery_locations.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        await client.query(migrationSQL);

        console.log('✅ Delivery locations migration completed successfully!');
        console.log('📍 Sample delivery locations have been added to the database.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
