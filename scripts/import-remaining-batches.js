const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function importRemainingBatches() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        process.exit(1);
    }

    console.log('📦 Import Remaining Batches (3-21) WITH Images');
    console.log('═══════════════════════════════════════════════════\n');

    // Batches 3 to 21
    const batchesToImport = [];
    for (let i = 3; i <= 21; i++) {
        batchesToImport.push(`menu_items_batch_${i}.json`);
    }

    const batchDir = 'menu_items_batches';

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Railway database\n');

        let totalImported = 0;
        let totalWithImages = 0;
        let batchNumber = 3;

        for (const batchFile of batchesToImport) {
            const filePath = path.join(batchDir, batchFile);

            if (!fs.existsSync(filePath)) {
                console.log(`❌ File not found: ${filePath}`);
                continue;
            }

            console.log(`📤 [${batchNumber}/21] Importing: ${batchFile}`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

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
            totalImported += imported;
            totalWithImages += withImages;

            console.log(`   ✅ Imported: ${imported}/${data.length} items (${withImages} with images)`);

            batchNumber++;

            // Small delay between batches to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n═══════════════════════════════════════════════════');
        console.log('📊 Final Statistics:');
        console.log('═══════════════════════════════════════════════════\n');

        // Get total counts
        const totalResult = await client.query('SELECT COUNT(*) FROM menu_items');
        const withImagesResult = await client.query('SELECT COUNT(*) FROM menu_items WHERE image_data IS NOT NULL');

        console.log(`✅ Total menu items in database: ${totalResult.rows[0].count}`);
        console.log(`🖼️  Items with images: ${withImagesResult.rows[0].count}`);
        console.log(`📦 Items imported in this run: ${totalImported}`);
        console.log(`🎨 Images imported in this run: ${totalWithImages}\n`);

        console.log('🎉 All batches imported successfully!\n');
        console.log('Next steps:');
        console.log('1. Go to your Railway app menu page');
        console.log('2. Refresh the page (Ctrl+Shift+R)');
        console.log('3. You should see all 207 menu items with images!\n');

        await client.end();
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
        await client.end();
        process.exit(1);
    }
}

importRemainingBatches();
