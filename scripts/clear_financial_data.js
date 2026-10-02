const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function clearFinancialData() {
    console.log('Connecting to database...');
    const client = new Client({
        connectionString: process.env.DATABASE_URL.trim(),
    });

    try {
        await client.connect();
        console.log('Connected successfully!');

        console.log('Clearing financial data...');
        
        const query = `
            TRUNCATE TABLE 
                orders, 
                invoices, 
                expenses,
                payouts
            RESTART IDENTITY CASCADE;
        `;

        await client.query(query);

        console.log('✅ Financial data cleared successfully!');

    } catch (error) {
        console.error('❌ Error clearing data:', error);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

clearFinancialData();
