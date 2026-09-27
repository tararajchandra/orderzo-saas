const { Client } = require('pg');
const fs = require('fs');

// Local database configuration
const LOCAL_DB = {
    host: 'localhost',
    port: 5432,
    database: 'restaurant_db',  // Change this to your local database name
    user: 'postgres',           // Change this to your local database user
    password: 'Root@321'        // Change this to your local database password
};

async function exportWithImages() {
    console.log('🎨 Export Menu Items WITH Images');
    console.log('═══════════════════════════════════════\n');

    console.log('📊 Connecting to local database:');
    console.log(`   Host: ${LOCAL_DB.host}`);
    console.log(`   Port: ${LOCAL_DB.port}`);
    console.log(`   Database: ${LOCAL_DB.database}`);
    console.log(`   User: ${LOCAL_DB.user}\n`);

    const client = new Client(LOCAL_DB);

    try {
        await client.connect();
        console.log('✅ Connected to local database\n');

        // First, check how many items have images
        const checkResult = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN image_data IS NOT NULL THEN 1 END) as with_images
            FROM menu_items
        `);

        console.log('📊 Database Statistics:');
        console.log(`   Total menu items: ${checkResult.rows[0].total}`);
        console.log(`   Items with images: ${checkResult.rows[0].with_images}`);
        console.log(`   Items without images: ${checkResult.rows[0].total - checkResult.rows[0].with_images}\n`);

        if (checkResult.rows[0].with_images === '0') {
            console.log('⚠️  WARNING: No images found in local database!');
            console.log('   Make sure your local database has image_data in menu_items table\n');
            await client.end();
            return;
        }

        console.log('📤 Exporting menu items with images...\n');

        // Export menu items with images
        const result = await client.query(`
            SELECT 
                m.name, 
                m.description, 
                m.category_id, 
                c.name as category_name, 
                m.price, 
                m.gst_rate, 
                m.available,
                CASE 
                    WHEN m.image_data IS NOT NULL THEN encode(m.image_data, 'base64')
                    ELSE NULL
                END as image_data_base64,
                m.image_type,
                CASE 
                    WHEN m.image_data IS NOT NULL THEN length(m.image_data)
                    ELSE 0
                END as image_size
            FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            ORDER BY m.id
        `);

        console.log(`✅ Exported ${result.rows.length} menu items`);

        const withImages = result.rows.filter(item => item.image_data_base64);
        console.log(`🖼️  Items with images: ${withImages.length}\n`);

        // Save to file
        const filename = `menu_items_with_images_${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(filename, JSON.stringify(result.rows, null, 2));

        const fileSizeMB = (fs.statSync(filename).size / 1024 / 1024).toFixed(2);
        console.log(`✅ Exported to: ${filename}`);
        console.log(`📊 File size: ${fileSizeMB} MB\n`);

        // Show sample items
        console.log('📋 Sample exported items:');
        result.rows.slice(0, 5).forEach((item, index) => {
            const hasImage = item.image_data_base64 ? '✅' : '❌';
            const imageSize = item.image_size > 0 ? `(${(item.image_size / 1024).toFixed(1)} KB)` : '';
            console.log(`   ${index + 1}. ${item.name.padEnd(30)} ${hasImage} ${imageSize}`);
        });

        console.log('\n🎉 Export complete!\n');
        console.log('Next steps:');
        console.log(`1. Split into batches: node scripts/split-menu-items.js "${filename}"`);
        console.log('2. Import to Railway using batch import\n');

        await client.end();
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nPossible issues:');
        console.error('1. Local database is not running');
        console.error('2. Database credentials are incorrect');
        console.error('3. Database name is wrong');
        console.error('4. PostgreSQL service is not started\n');
        console.error('Full error:', error);
        await client.end();
        process.exit(1);
    }
}

exportWithImages();
