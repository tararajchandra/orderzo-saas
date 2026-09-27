import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// This endpoint creates the payouts table if it doesn't exist
// Access it once to run the migration: /api/admin/migrate-payouts
export async function GET() {
    try {
        console.log('Running payouts table migration...');

        // Create payouts table
        await query(`
            CREATE TABLE IF NOT EXISTS payouts (
                id SERIAL PRIMARY KEY,
                delivery_boy_id INTEGER REFERENCES users(id),
                amount DECIMAL(10,2) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            );
        `);

        // Verify table structure
        const structure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'payouts' 
            ORDER BY ordinal_position
        `);

        return NextResponse.json({
            success: true,
            message: 'Payouts table created/verified successfully',
            structure: structure.rows
        });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                detail: error.detail || 'No additional details'
            },
            { status: 500 }
        );
    }
}
