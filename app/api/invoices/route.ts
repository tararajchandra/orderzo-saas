import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all invoices or by order ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        let queryText = `
            SELECT i.*, o.customer_name, o.customer_phone, o.customer_address, 
                   o.items, o.payment_method, o.payment_status, o.order_type,
                   o.created_at as order_date, o.table_number, o.order_number,
                   o.delivery_charge
            FROM invoices i
            JOIN orders o ON i.order_id = o.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (orderId) {
            queryText += ` AND i.order_id = $1`;
            params.push(orderId);
        }

        queryText += ' ORDER BY i.generated_at DESC';

        const result = await query(queryText, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch invoices' },
            { status: 500 }
        );
    }
}

// POST create invoice manually (if needed)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id } = body;

        if (!order_id) {
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Get order details
        const orderResult = await query(
            'SELECT * FROM orders WHERE id = $1',
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        const order = orderResult.rows[0];

        // Check if invoice already exists
        const existingInvoice = await query(
            'SELECT * FROM invoices WHERE order_id = $1',
            [order_id]
        );

        if (existingInvoice.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Invoice already exists for this order' },
                { status: 400 }
            );
        }

        // Generate invoice number with format INV-YYYYMMDD-XXXX
        const invoiceDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const invoiceCountResult = await query(
            `SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE $1`,
            [`INV-${invoiceDate}-%`]
        );
        const invoiceCount = parseInt(invoiceCountResult.rows[0].count) + 1;
        const invoiceNumber = `INV-${invoiceDate}-${String(invoiceCount).padStart(4, '0')}`;

        // Create invoice
        const result = await query(
            `INSERT INTO invoices (order_id, invoice_number, subtotal, tax, discount, total)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [order_id, invoiceNumber, order.subtotal, order.tax, order.discount, order.total_amount]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create invoice' },
            { status: 500 }
        );
    }
}
