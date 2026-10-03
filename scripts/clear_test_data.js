const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

async function clearTestData() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected successfully!');

        console.log('Clearing test data and resetting IDs...');
        
        // TRUNCATE command with CASCADE automatically clears dependent tables
        // RESTART IDENTITY resets the auto-increment counters back to 1
        const query = `
            TRUNCATE TABLE 
                orders, 
                invoices, 
                expenses,
                payouts,
                attendance, 
                attendance_breaks, 
                audit_logs 
            RESTART IDENTITY CASCADE;
        `;

        await client.query(query);

        console.log('✅ All test data cleared successfully!');
        console.log('✅ Order numbers and IDs have been reset to 1.');
        console.log('Note: Users, Menu Items, Categories, and Settings were NOT deleted.');

    } catch (error) {
        console.error('❌ Error clearing data:', error);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

clearTestData();
