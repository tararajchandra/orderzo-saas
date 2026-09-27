const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load env vars
function loadEnv(filename) {
    try {
        const envPath = path.resolve(process.cwd(), filename);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                // Skip comments and empty lines
                if (!line || line.trim().startsWith('#')) return;

                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    if (key && !process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
            console.log(`Loaded env from ${filename}`);
        }
    } catch (e) {
        console.log(`Could not load ${filename}`);
    }
}

loadEnv('.env.local');
loadEnv('.env');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ruchi_restaurant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Running GST rate migration...');

        const migrationPath = path.join(__dirname, '../database/migrations/add_gst_rate_to_menu_items.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await client.query(sql);

        console.log('✅ GST rate migration completed successfully!');

        // Verify the column was added
        const result = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'menu_items' AND column_name = 'gst_rate'
        `);

        if (result.rows.length > 0) {
            console.log('✅ Column gst_rate verified:', result.rows[0]);
        } else {
            console.log('❌ Column gst_rate not found!');
        }

    } catch (error) {
        console.error('Error running migration:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(console.error);
