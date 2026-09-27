
const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); // Note: utilizing the dependency from package.json
const fs = require('fs');
const path = require('path');

// Manually load env vars
function loadEnv(filename) {
    try {
        const envPath = path.resolve(process.cwd(), filename);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                if (!line || line.trim().startsWith('#')) return;
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
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

async function resetAdmin() {
    try {
        const email = 'admin@restaurant.com';
        const rawPassword = 'admin123';

        console.log(`Generating valid hash for password: ${rawPassword}`);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(rawPassword, salt);

        console.log('Connecting to database...');

        // Check if admin exists
        const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (checkRes.rowCount > 0) {
            console.log('Admin user exists. Updating password...');
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
            console.log('✅ Password successfully updated.');
        } else {
            console.log('Admin user does not exist. Creating new admin user...');
            await pool.query(
                `INSERT INTO users (email, password_hash, name, role) 
                 VALUES ($1, $2, 'Admin', 'admin')`,
                [email, hash]
            );
            console.log('✅ Admin user created successfully.');
        }

    } catch (error) {
        console.error('❌ Failed to reset password:', error);
    } finally {
        await pool.end();
    }
}

resetAdmin();
