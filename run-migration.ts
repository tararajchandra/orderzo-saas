// ============================================
// Run Database Migration
// ============================================
// Purpose: Execute the migration to make customer details optional
// ============================================

import pool from './lib/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    const client = await pool.connect();
    try {
        const migrationPath = path.join(process.cwd(), 'database', 'migrations', '008_make_customer_details_optional.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration: 008_make_customer_details_optional.sql');
        console.log('---');

        // Execute the entire migration
        await client.query(sql);

        console.log('---');
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
