const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
// fallback
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

async function diagnoseImages() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'restaurant_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: false // Usually false for local, modify if needed
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        console.log('📊 Checking Image Data in menu_items table...\n');

        // Query 1: Overview
        const res1 = await client.query(`
            SELECT 
                COUNT(*) FILTER (WHERE image_data IS NOT NULL) as items_with_images,
                COUNT(*) as total_items
            FROM menu_items;
        `);
        console.log('Summary:');
        console.log(`- Total Items: ${res1.rows[0].total_items}`);
        console.log(`- Items with Images: ${res1.rows[0].items_with_images}`);
        console.log('');

        // Query 2: Sample
        const res2 = await client.query(`
            SELECT 
                name,
                CASE 
                    WHEN image_data IS NULL THEN 'No image'
                    ELSE 'Has image (' || LENGTH(image_data) || ' bytes)'
                END as image_status,
                image_type
            FROM menu_items
            ORDER BY id
            LIMIT 20;
        `);

        console.log('Sample Data (First 20):');
        console.table(res2.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

diagnoseImages();
