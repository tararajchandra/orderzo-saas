import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Sync all invoice totals with their corresponding orders
export async function POST(request: Request) {
    try {
        // Update all invoices to match their order totals
        const result = await query(`
            UPDATE invoices i
            SET total = o.total_amount,
                subtotal = o.subtotal,
                tax = COALESCE(o.tax, 0),
                discount = COALESCE(o.discount, 0)
            FROM orders o
            WHERE i.order_id = o.id
              AND (i.total != o.total_amount 
                   OR i.subtotal != o.subtotal 
                   OR COALESCE(i.tax, 0) != COALESCE(o.tax, 0)
                   OR COALESCE(i.discount, 0) != COALESCE(o.discount, 0))
            RETURNING i.id, i.invoice_number, i.total, o.order_number, o.total_amount
        `);

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${result.rows.length} invoice(s)`,
            updated: result.rows,
        });
    } catch (error) {
        console.error('Error syncing invoices:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to sync invoices' },
            { status: 500 }
        );
    }
}

// GET - Check for mismatched invoices
export async function GET(request: Request) {
    try {
        const result = await query(`
            SELECT 
                o.order_number,
                o.id as order_id,
                o.total_amount as order_total,
                o.subtotal as order_subtotal,
                o.tax as order_tax,
                o.discount as order_discount,
                i.invoice_number,
                i.id as invoice_id,
                i.total as invoice_total,
                i.subtotal as invoice_subtotal,
                i.tax as invoice_tax,
                i.discount as invoice_discount
            FROM orders o
            JOIN invoices i ON i.order_id = o.id
            WHERE i.total != o.total_amount 
               OR i.subtotal != o.subtotal 
               OR COALESCE(i.tax, 0) != COALESCE(o.tax, 0)
               OR COALESCE(i.discount, 0) != COALESCE(o.discount, 0)
            ORDER BY o.created_at DESC
        `);

        return NextResponse.json({
            success: true,
            count: result.rows.length,
            mismatches: result.rows,
        });
    } catch (error) {
        console.error('Error checking invoices:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check invoices' },
            { status: 500 }
        );
    }
}
