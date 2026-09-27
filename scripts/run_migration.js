
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

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function query(text, params) {
    return pool.query(text, params);
}

async function runMigration() {
    try {
        console.log('Running migration...');

        // Create images table
        await query(`
            CREATE TABLE IF NOT EXISTS images (
                id SERIAL PRIMARY KEY,
                image_data BYTEA NOT NULL,
                image_type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created images table');

        // Add image_id to menu_items
        await query(`
            ALTER TABLE menu_items 
            ADD COLUMN IF NOT EXISTS image_id INTEGER REFERENCES images(id) ON DELETE SET NULL
        `);
        console.log('Added image_id to menu_items');

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
