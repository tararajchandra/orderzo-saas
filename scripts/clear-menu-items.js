const { Client } = require('pg');

async function clearMenuItems() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        console.log('\nUsage:');
        console.log('$env:DATABASE_URL="your_railway_url"');
        console.log('node scripts/clear-menu-items.js');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔌 Connected to Railway database\n');

        // Check current count
        const countBefore = await client.query('SELECT COUNT(*) FROM menu_items');
        console.log(`📊 Current menu items: ${countBefore.rows[0].count}\n`);

        console.log('⚠️  WARNING: This will DELETE all menu items!');
        console.log('   This is necessary to replace them with items that have images.\n');

        // Delete all menu items
        console.log('🗑️  Deleting menu items...');
        await client.query('DELETE FROM menu_items');

        const countAfter = await client.query('SELECT COUNT(*) FROM menu_items');
        console.log(`✅ Deleted ${parseInt(countBefore.rows[0].count) - parseInt(countAfter.rows[0].count)} menu items`);
        console.log(`📊 Remaining menu items: ${countAfter.rows[0].count}\n`);

        console.log('🎉 Ready to import new menu items with images!\n');

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

clearMenuItems();
