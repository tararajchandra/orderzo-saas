const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

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
        console.log('🚀 Starting GPS coordinates migration...\n');

        // Read migration file
        const migrationPath = path.join(__dirname, '../database/migrations/008_add_gps_to_delivery_locations.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        await client.query('BEGIN');
        await client.query(migrationSQL);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!\n');

        // Verify the changes
        const result = await client.query(`
            SELECT 
                location_name, 
                latitude, 
                longitude, 
                radius_km,
                delivery_charge
            FROM delivery_locations 
            WHERE is_active = true
            ORDER BY location_name
        `);

        console.log('📍 Updated Delivery Locations with GPS Coordinates:\n');
        console.log('─'.repeat(80));
        console.log('Location Name'.padEnd(20) + 'Latitude'.padEnd(12) + 'Longitude'.padEnd(12) + 'Radius'.padEnd(10) + 'Charge');
        console.log('─'.repeat(80));

        result.rows.forEach(row => {
            const lat = row.latitude ? row.latitude.toString().padEnd(12) : 'Not set'.padEnd(12);
            const lng = row.longitude ? row.longitude.toString().padEnd(12) : 'Not set'.padEnd(12);
            const radius = row.radius_km ? `${row.radius_km}km`.padEnd(10) : 'Not set'.padEnd(10);
            const charge = `₹${row.delivery_charge}`;

            console.log(
                row.location_name.padEnd(20) +
                lat +
                lng +
                radius +
                charge
            );
        });

        console.log('─'.repeat(80));
        console.log('\n✨ GPS-based delivery zone detection is now ready!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Admins can update GPS coordinates in the admin panel');
        console.log('   2. Customers can use "Detect My Location" button at checkout');
        console.log('   3. System will auto-select the nearest delivery zone\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
