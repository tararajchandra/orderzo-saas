import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET specific invoice by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const invoiceId = params.id;

        const result = await query(
            `SELECT i.*, o.customer_name, o.customer_phone, o.customer_address, 
                    o.items, o.payment_method, o.payment_status, o.order_type,
                    o.order_status, o.notes, o.created_at as order_date
             FROM invoices i
             JOIN orders o ON i.order_id = o.id
             WHERE i.id = $1`,
            [invoiceId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch invoice' },
            { status: 500 }
        );
    }
}

// DELETE invoice (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const invoiceId = params.id;

        const result = await query(
            'DELETE FROM invoices WHERE id = $1 RETURNING *',
            [invoiceId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invoice not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Invoice deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete invoice' },
            { status: 500 }
        );
    }
}
