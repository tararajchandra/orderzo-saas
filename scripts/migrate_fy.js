const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
    })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'restaurant_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    });

async function runMigration() {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');

        console.log('1. Creating financial_years table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS financial_years (
                id SERIAL PRIMARY KEY,
                name VARCHAR(20) NOT NULL UNIQUE,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                is_active BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('2. Inserting default financial years...');
        const fyData = [
            { name: '2023-24', start: '2023-04-01', end: '2024-03-31' },
            { name: '2024-25', start: '2024-04-01', end: '2025-03-31' },
            { name: '2025-26', start: '2025-04-01', end: '2026-03-31' },
            { name: '2026-27', start: '2026-04-01', end: '2027-03-31' }
        ];

        for (const fy of fyData) {
            await client.query(`
                INSERT INTO financial_years (name, start_date, end_date) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (name) DO NOTHING;
            `, [fy.name, fy.start, fy.end]);
        }

        console.log('3. Setting current active financial year...');
        await client.query(`UPDATE financial_years SET is_active = false;`);
        await client.query(`
            UPDATE financial_years 
            SET is_active = true 
            WHERE CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date;
        `);

        console.log('4. Adding financial_year_id to tables...');
        const tables = ['orders', 'invoices', 'expenses', 'payouts'];
        
        for (const table of tables) {
            const checkCol = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name=$1 AND column_name='financial_year_id'
            `, [table]);

            if (checkCol.rows.length === 0) {
                await client.query(`
                    ALTER TABLE ${table} 
                    ADD COLUMN financial_year_id INTEGER REFERENCES financial_years(id) ON DELETE SET NULL;
                `);
                console.log(`  - Added financial_year_id to ${table}`);
            }
        }

        console.log('5. Backfilling financial_year_id for existing records...');
        await client.query(`
            UPDATE orders o
            SET financial_year_id = fy.id
            FROM financial_years fy
            WHERE DATE(o.created_at) >= fy.start_date AND DATE(o.created_at) <= fy.end_date
            AND o.financial_year_id IS NULL;
        `);

        await client.query(`
            UPDATE invoices i
            SET financial_year_id = fy.id
            FROM financial_years fy
            WHERE DATE(i.generated_at) >= fy.start_date AND DATE(i.generated_at) <= fy.end_date
            AND i.financial_year_id IS NULL;
        `);

        const expenseCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='expenses'`);
        const hasExpenseDate = expenseCols.rows.some(r => r.column_name === 'expense_date');
        const expenseDateCol = hasExpenseDate ? 'expense_date' : 'created_at';
        
        await client.query(`
            UPDATE expenses e
            SET financial_year_id = fy.id
            FROM financial_years fy
            WHERE DATE(e.${expenseDateCol}) >= fy.start_date AND DATE(e.${expenseDateCol}) <= fy.end_date
            AND e.financial_year_id IS NULL;
        `);

        const payoutCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='payouts'`);
        const hasPayoutDate = payoutCols.rows.some(r => r.column_name === 'payout_date');
        const payoutDateCol = hasPayoutDate ? 'payout_date' : 'created_at';

        await client.query(`
            UPDATE payouts p
            SET financial_year_id = fy.id
            FROM financial_years fy
            WHERE DATE(p.${payoutDateCol}) >= fy.start_date AND DATE(p.${payoutDateCol}) <= fy.end_date
            AND p.financial_year_id IS NULL;
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

runMigration();
