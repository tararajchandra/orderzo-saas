
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv(filename) {
    try {
        const envPath = path.resolve(process.cwd(), filename);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2 && !line.trim().startsWith('#')) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    if (key && !process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) { console.log('Env load error', e); }
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

async function run() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../database/migrations/add_delivery_commission.sql'), 'utf8');
        await pool.query(sql);
        console.log('✅ Migration successful');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration failed', e);
        process.exit(1);
    }
}
run();
