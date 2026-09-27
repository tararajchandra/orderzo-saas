const { Client } = require('pg');

async function checkImages() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔍 Checking menu items for images...\n');

        // Check total items
        const totalResult = await client.query('SELECT COUNT(*) FROM menu_items');
        console.log(`Total menu items: ${totalResult.rows[0].count}\n`);

        // Check items with images
        const withImagesResult = await client.query('SELECT COUNT(*) FROM menu_items WHERE image_data IS NOT NULL');
        console.log(`Items WITH images: ${withImagesResult.rows[0].count}`);

        const withoutImagesResult = await client.query('SELECT COUNT(*) FROM menu_items WHERE image_data IS NULL');
        console.log(`Items WITHOUT images: ${withoutImagesResult.rows[0].count}\n`);

        // Show sample items
        console.log('📋 Sample menu items:');
        const sampleResult = await client.query(`
            SELECT id, name, 
                   image_data IS NOT NULL as has_image, 
                   image_type,
                   LENGTH(image_data) as image_size
            FROM menu_items 
            LIMIT 10
        `);

        sampleResult.rows.forEach(row => {
            const imageInfo = row.has_image
                ? `✅ YES (${row.image_type}, ${(row.image_size / 1024).toFixed(1)} KB)`
                : '❌ NO';
            console.log(`  ${row.id}. ${row.name.padEnd(30)} - Image: ${imageInfo}`);
        });

        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

checkImages();
