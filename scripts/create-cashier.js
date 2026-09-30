const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function createCashierUser() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL environment variable not set!');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database\n');

        const password = 'cashier123';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        const checkResult = await client.query(
            "SELECT id, email FROM users WHERE email = 'cashier@restaurant.com'"
        );

        if (checkResult.rows.length > 0) {
            console.log('\nCashier user already exists!');
            console.log('Updating password...\n');

            await client.query(
                'UPDATE users SET password_hash = $1 WHERE email = $2',
                [hashedPassword, 'cashier@restaurant.com']
            );

            console.log('Cashier password updated successfully!');
        } else {
            console.log('\nCreating new cashier user...\n');

            await client.query(
                `INSERT INTO users (email, password_hash, name, role, is_active) 
                 VALUES ($1, $2, $3, $4, $5)`,
                ['cashier@restaurant.com', hashedPassword, 'Cashier', 'cashier', true]
            );

            console.log('Cashier user created successfully!');
        }

        console.log('\n---------------------------------------------------');
        console.log('  Cashier Credentials');
        console.log('---------------------------------------------------');
        console.log('  Email:    cashier@restaurant.com');
        console.log('  Password: cashier123');
        console.log('---------------------------------------------------\n');

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createCashierUser();
