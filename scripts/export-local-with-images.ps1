# Export Menu Items WITH Images from Local Database
# This script connects to your local database and exports menu items with images

Write-Host "🎨 Export Menu Items WITH Images" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

# Local database configuration
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "restaurant_db"  # Change this to your local database name
$DB_USER = "postgres"       # Change this to your local database user
$DB_PASSWORD = "Root@321"   # Change this to your local database password

# Build connection string
$DATABASE_URL = "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

Write-Host "📊 Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host "  Database: $DB_NAME"
Write-Host "  User: $DB_USER`n"

# Ask for confirmation
$confirm = Read-Host "Is this correct? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "`n❌ Please edit this script and update the database configuration`n" -ForegroundColor Red
    exit 0
}

Write-Host "`n🔄 Exporting menu items with images...`n" -ForegroundColor Cyan

# Set environment variable and run export
$env:DATABASE_URL = $DATABASE_URL

# First, check if database has images
node scripts/check-images.js

Write-Host "`n📤 Starting export...`n" -ForegroundColor Cyan

# Export using the API locally
# We'll use a Node.js script for this
node -e @"
const { Client } = require('pg');
const fs = require('fs');

async function exportWithImages() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to local database\n');

        // Export menu items with images
        const result = await client.query(\`
            SELECT 
                m.name, m.description, m.category_id, 
                c.name as category_name, m.price, m.gst_rate, 
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
        \`);

        console.log(\`📦 Found \${result.rows.length} menu items\`);
        
        const withImages = result.rows.filter(item => item.image_data_base64);
        console.log(\`🖼️  Items with images: \${withImages.length}\n\`);

        if (withImages.length === 0) {
            console.log('⚠️  Warning: No images found in local database!');
            console.log('   Make sure your local database has image_data in menu_items table\n');
        }

        // Save to file
        const filename = 'menu_items_with_images_' + new Date().toISOString().split('T')[0] + '.json';
        fs.writeFileSync(filename, JSON.stringify(result.rows, null, 2));
        
        console.log(\`✅ Exported to: \${filename}\`);
        console.log(\`📊 File size: \${(fs.statSync(filename).size / 1024 / 1024).toFixed(2)} MB\n\`);

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

exportWithImages();
"@

Write-Host "`n🎉 Export complete!`n" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check the exported JSON file"
Write-Host "2. Split it into batches: node scripts/split-menu-items.js menu_items_with_images_*.json"
Write-Host "3. Import to Railway using the batch import method`n"
