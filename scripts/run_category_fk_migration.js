const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load env vars
function loadEnv(filename) {
    try {
        const envPath = path.resolve(process.cwd(), filename);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                // Skip comments and empty lines
                if (!line || line.trim().startsWith('#')) return;

                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    if (key && !process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
            console.log(`Loaded env from ${filename}`);
        }
    } catch (e) {
        console.log(`Could not load ${filename}`);
    }
}

loadEnv('.env.local');
loadEnv('.env');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function query(text, params) {
    return pool.query(text, params);
}

async function runMigration() {
    try {
        console.log('Starting category foreign key migration...');

        // Step 1: Add the new category_id column (nullable initially)
        console.log('Step 1: Adding category_id column...');
        await query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id INTEGER`);

        // Step 2: Populate category_id by matching existing category names
        console.log('Step 2: Populating category_id from existing category names...');
        await query(`
            UPDATE menu_items m
            SET category_id = c.id
            FROM categories c
            WHERE m.category = c.name AND m.category_id IS NULL
        `);

        // Step 3: Handle any menu items with categories that don't exist
        console.log('Step 3: Creating missing categories...');
        await query(`
            INSERT INTO categories (name, description, sort_order)
            SELECT DISTINCT m.category, 'Auto-migrated category', 999
            FROM menu_items m
            WHERE m.category_id IS NULL
            ON CONFLICT (name) DO NOTHING
        `);

        // Step 4: Update any remaining NULL category_id values
        console.log('Step 4: Updating remaining NULL category_id values...');
        await query(`
            UPDATE menu_items m
            SET category_id = c.id
            FROM categories c
            WHERE m.category = c.name AND m.category_id IS NULL
        `);

        // Check if any NULL values remain
        const nullCheck = await query(`SELECT COUNT(*) FROM menu_items WHERE category_id IS NULL`);
        if (parseInt(nullCheck.rows[0].count) > 0) {
            throw new Error(`Found ${nullCheck.rows[0].count} menu items with NULL category_id`);
        }

        // Step 5: Make category_id NOT NULL
        console.log('Step 5: Setting category_id as NOT NULL...');
        await query(`ALTER TABLE menu_items ALTER COLUMN category_id SET NOT NULL`);

        // Step 6: Add foreign key constraint
        console.log('Step 6: Adding foreign key constraint...');
        await query(`
            ALTER TABLE menu_items
            DROP CONSTRAINT IF EXISTS fk_menu_items_category
        `);
        await query(`
            ALTER TABLE menu_items
            ADD CONSTRAINT fk_menu_items_category
            FOREIGN KEY (category_id) REFERENCES categories(id)
            ON DELETE RESTRICT
        `);

        // Step 7: Create index
        console.log('Step 7: Creating index on category_id...');
        await query(`CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id)`);

        // Step 8: Drop the old category column
        console.log('Step 8: Dropping old category column...');
        await query(`ALTER TABLE menu_items DROP COLUMN IF EXISTS category`);

        // Step 9: Drop old index
        console.log('Step 9: Dropping old category index...');
        await query(`DROP INDEX IF EXISTS idx_menu_items_category`);

        console.log('✅ Migration completed successfully!');
        
        // Verify the migration
        const result = await query(`
            SELECT m.id, m.name, m.category_id, c.name as category_name 
            FROM menu_items m 
            JOIN categories c ON m.category_id = c.id
            LIMIT 5
        `);
        console.log('\nSample menu items with categories:');
        console.table(result.rows);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
