const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function testImport() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        process.exit(1);
    }

    console.log('🧪 Test Import - First 2 Batches WITH Images');
    console.log('═══════════════════════════════════════════════\n');

    const batchesToTest = ['menu_items_batch_1.json', 'menu_items_batch_2.json'];
    const batchDir = 'menu_items_batches';

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Railway database\n');

        for (const batchFile of batchesToTest) {
            const filePath = path.join(batchDir, batchFile);

            if (!fs.existsSync(filePath)) {
                console.log(`❌ File not found: ${filePath}`);
                continue;
            }

            console.log(`📤 Importing: ${batchFile}`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`   Items in batch: ${data.length}`);

            let imported = 0;
            let withImages = 0;

            await client.query('BEGIN');

            for (const item of data) {
                try {
                    // Get category_id
                    let categoryId = item.category_id;
                    if (item.category_name && item.category_name.trim() !== '') {
                        const categoryResult = await client.query(
                            'SELECT id FROM categories WHERE name = $1',
                            [item.category_name]
                        );
                        if (categoryResult.rows.length > 0) {
                            categoryId = categoryResult.rows[0].id;
                        }
                    }

                    // Decode base64 image
                    let imageData = null;
                    let imageType = null;
                    if (item.image_data_base64 && item.image_data_base64.trim() !== '') {
                        imageData = Buffer.from(item.image_data_base64, 'base64');
                        imageType = item.image_type || 'image/jpeg';
                        withImages++;
                    }

                    // Insert menu item
                    await client.query(
                        `INSERT INTO menu_items (name, description, category_id, price, gst_rate, available, image_data, image_type)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            item.name,
                            item.description || '',
                            categoryId || null,
                            parseFloat(item.price) || 0,
                            parseFloat(item.gst_rate) || 5.00,
                            item.available === 'true' || item.available === true || item.available === '1',
                            imageData,
                            imageType
                        ]
                    );
                    imported++;
                } catch (error) {
                    console.log(`   ⚠️  Error importing "${item.name}": ${error.message}`);
                }
            }

            await client.query('COMMIT');
            console.log(`   ✅ Imported: ${imported}/${data.length} items`);
            console.log(`   🖼️  With images: ${withImages}\n`);
        }

        // Verify
        console.log('📊 Verification:');
        const totalResult = await client.query('SELECT COUNT(*) FROM menu_items');
        const withImagesResult = await client.query('SELECT COUNT(*) FROM menu_items WHERE image_data IS NOT NULL');

        console.log(`   Total menu items: ${totalResult.rows[0].count}`);
        console.log(`   Items with images: ${withImagesResult.rows[0].count}\n`);

        // Show sample
        console.log('📋 Sample imported items:');
        const sampleResult = await client.query(`
            SELECT name, 
                   image_data IS NOT NULL as has_image,
                   LENGTH(image_data) as image_size
            FROM menu_items 
            LIMIT 5
        `);

        sampleResult.rows.forEach((row, index) => {
            const imageInfo = row.has_image
                ? `✅ (${(row.image_size / 1024).toFixed(1)} KB)`
                : '❌';
            console.log(`   ${index + 1}. ${row.name.padEnd(30)} ${imageInfo}`);
        });

        console.log('\n🎉 Test import successful!\n');
        console.log('Next steps:');
        console.log('1. Check your Railway app menu page');
        console.log('2. Verify images are showing');
        console.log('3. If all good, import remaining batches\n');

        await client.end();
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

testImport();
