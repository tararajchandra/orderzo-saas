// Batch Import Helper Script
// This script splits a large menu items JSON file into smaller batches

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = process.argv[2] || 'menu_items.json';
const BATCH_SIZE = 10; // Import 10 items at a time
const OUTPUT_DIR = 'menu_items_batches';

try {
    console.log('📦 Menu Items Batch Splitter');
    console.log('═══════════════════════════════════════\n');

    // Read the input file
    console.log(`📄 Reading: ${INPUT_FILE}`);
    const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

    if (!Array.isArray(data)) {
        console.error('❌ Error: Input file must contain an array of menu items');
        process.exit(1);
    }

    console.log(`✅ Found ${data.length} menu items\n`);

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR);
    }

    // Split into batches
    const batches = [];
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        batches.push(data.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Creating ${batches.length} batch files...\n`);

    // Write batch files
    batches.forEach((batch, index) => {
        const filename = `menu_items_batch_${index + 1}.json`;
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, JSON.stringify(batch, null, 2));
        console.log(`✅ Created: ${filename} (${batch.length} items)`);
    });

    console.log('\n🎉 Done!');
    console.log(`\n📁 Batch files saved in: ${OUTPUT_DIR}/`);
    console.log('\n📝 Instructions:');
    console.log('   1. Go to your app → Data Management → Import');
    console.log('   2. Import each batch file one by one');
    console.log(`   3. Import batch 1, wait for success, then batch 2, etc.`);
    console.log(`   4. Total batches: ${batches.length}\n`);

} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nUsage:');
    console.log('  node scripts/split-menu-items.js <input-file.json>');
    console.log('\nExample:');
    console.log('  node scripts/split-menu-items.js menu_items_2025-12-12.json');
    process.exit(1);
}
