// ============================================
// Run Database Migration
// ============================================
// Purpose: Execute the migration to make customer details optional
// ============================================

const { query } = require('./lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, 'database', 'migrations', '008_make_customer_details_optional.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration: 008_make_customer_details_optional.sql');
        console.log('---');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim().length > 0 && !s.trim().startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim().substring(0, 50) + '...');
                await query(statement);
            }
        }

        console.log('---');
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
