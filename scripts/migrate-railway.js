const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    // Use DATABASE_URL from Railway environment
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        console.log('\nSet it from Railway:');
        console.log('export DATABASE_URL="postgresql://user:pass@host:port/db"');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false // Required for Railway
        }
    });

    try {
        console.log('🔌 Connecting to Railway PostgreSQL...');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        console.log(`📄 Reading schema from: ${schemaPath}`);

        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log(`✅ Schema file loaded (${schema.length} characters)\n`);

        // Execute schema
        console.log('🚀 Creating database tables...');
        await client.query(schema);
        console.log('✅ Database schema created successfully!\n');

        // Run additional migrations
        console.log('🔄 Running additional migrations...\n');
        const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort(); // Run in order

            for (const file of migrationFiles) {
                try {
                    console.log(`  📄 Running: ${file}`);
                    const migrationPath = path.join(migrationsDir, file);
                    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                    await client.query(migrationSQL);
                    console.log(`  ✅ ${file} completed`);
                } catch (migError) {
                    // Some migrations might fail if columns already exist, that's okay
                    if (migError.code === '42701') { // duplicate column
                        console.log(`  ⚠️  ${file} - column already exists (skipped)`);
                    } else {
                        console.log(`  ⚠️  ${file} - ${migError.message}`);
                    }
                }
            }
            console.log('\n✅ All migrations completed!\n');
        } else {
            console.log('⚠️  No migrations directory found, skipping additional migrations\n');
        }

        // Verify tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('📊 Created tables:');
        result.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.table_name}`);
        });
        console.log(`\n✅ Total: ${result.rows.length} tables created`);

        // Check default data
        const adminCheck = await client.query(
            "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
        );
        console.log(`\n👤 Admin users: ${adminCheck.rows[0].count}`);

        const categoriesCheck = await client.query(
            'SELECT COUNT(*) as count FROM categories'
        );
        console.log(`📁 Categories: ${categoriesCheck.rows[0].count}`);

        console.log('\n🎉 Database setup complete!');
        console.log('\n📝 Default admin credentials:');
        console.log('   Email: admin@restaurant.com');
        console.log('   Password: admin123');
        console.log('\n⚠️  Remember to change the admin password after first login!');

    } catch (error) {
        console.error('\n❌ Migration failed!');
        console.error('Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Tip: Make sure DATABASE_URL is correct');
        } else if (error.code === '42P07') {
            console.log('\n💡 Tip: Tables already exist. Drop them first or use a fresh database.');
        }

        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run migrations
console.log('═══════════════════════════════════════════════════');
console.log('  Railway Database Migration');
console.log('  RuchiV2 Restaurant Management System');
console.log('═══════════════════════════════════════════════════\n');

runMigrations();
