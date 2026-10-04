import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS split_cash DECIMAL(10,2) DEFAULT 0');
        await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS split_upi DECIMAL(10,2) DEFAULT 0');
        await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS split_card DECIMAL(10,2) DEFAULT 0');
        
        return NextResponse.json({
            success: true,
            message: 'Split payment columns added successfully.'
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
