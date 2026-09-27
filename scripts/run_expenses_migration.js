
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
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function query(text, params) {
    return pool.query(text, params);
}

async function runMigration() {
    try {
        console.log('Running expenses migration...');

        // Read the SQL file
        const sqlPath = path.join(__dirname, '../database/migrations/create_expenses_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        await query(sql);

        console.log('Created expenses table successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
