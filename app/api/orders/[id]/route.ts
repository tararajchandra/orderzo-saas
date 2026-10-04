import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET single order
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            'SELECT * FROM orders WHERE id = $1',
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch order' },
            { status: 500 }
        );
    }
}

// PUT update order status (admin only)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const {
            order_status,
            payment_status,
            delivery_boy_id,
            // Editable fields
            customer_name,
            customer_phone,
            items,
            subtotal,
            tax,
            discount,
            total_amount,
            payment_method,
            table_number,
            notes,
            order_type,
            split_cash,
            split_upi,
            split_card
        } = body;

        let driverCommission = null;

        // If status is changing to 'delivered', calculate commission with a single JOIN query
        if (order_status === 'delivered') {
            const dbId = delivery_boy_id; // Use provided ID first
            
            const commissionRes = await query(`
                SELECT 
                    o.total_amount, o.delivery_boy_id,
                    u.commission_rate, u.commission_type
                FROM orders o
                LEFT JOIN users u ON u.id = COALESCE($1::int, o.delivery_boy_id)
                WHERE o.id = $2
            `, [dbId || null, params.id]);

            if (commissionRes.rows.length > 0) {
                const row = commissionRes.rows[0];
                const finalTotal = total_amount || row.total_amount;
                if (row.commission_rate) {
                    driverCommission = row.commission_type === 'percent'
                        ? (parseFloat(finalTotal) * parseFloat(row.commission_rate)) / 100
                        : parseFloat(row.commission_rate);
                }
            }
        }

        const result = await query(
            `UPDATE orders 
       SET order_status = COALESCE($1, order_status),
           payment_status = COALESCE($2, payment_status),
           delivery_boy_id = COALESCE($3, delivery_boy_id),
           driver_commission = COALESCE($4, driver_commission),
           customer_name = COALESCE($5, customer_name),
           customer_phone = COALESCE($6, customer_phone),
           items = COALESCE($7, items),
           subtotal = COALESCE($8, subtotal),
           tax = COALESCE($9, tax),
           discount = COALESCE($10, discount),
           total_amount = COALESCE($11, total_amount),
           payment_method = COALESCE($12, payment_method),
           table_number = COALESCE($13, table_number),
           notes = COALESCE($14, notes),
           order_type = COALESCE($15, order_type),
           split_cash = COALESCE($16, split_cash),
           split_upi = COALESCE($17, split_upi),
           split_card = COALESCE($18, split_card),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $19
       RETURNING *`,
            [
                order_status,
                payment_status,
                delivery_boy_id,
                driverCommission,
                customer_name,
                customer_phone,
                items ? JSON.stringify(items) : null,
                subtotal,
                tax,
                discount,
                total_amount,
                payment_method,
                table_number,
                notes,
                order_type,
                split_cash,
                split_upi,
                split_card,
                params.id
            ]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        // Handle Invoice Generation/Update
        const invoiceCheck = await query('SELECT * FROM invoices WHERE order_id = $1', [params.id]);
        
        if (invoiceCheck.rows.length === 0 && payment_status === 'paid') {
            // Generate invoice if paid and doesn't exist yet
            const invoiceDateStr = new Date().toISOString().split('T')[0];
            const invoiceDate = invoiceDateStr.replace(/-/g, '');
            const invoiceCountResult = await query(
                `SELECT COUNT(*) as count FROM invoices 
                 WHERE generated_at >= CURRENT_DATE 
                 AND generated_at < (CURRENT_DATE + INTERVAL '1 day')`
            );
            const invoiceCount = parseInt(invoiceCountResult.rows[0].count) + 1;
            const invoiceNumber = `INV-${invoiceDate}-${String(invoiceCount).padStart(4, '0')}`;
            
            const updatedOrder = result.rows[0];

            await query(
                `INSERT INTO invoices (order_id, invoice_number, subtotal, tax, discount, total)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    params.id, 
                    invoiceNumber, 
                    subtotal ?? updatedOrder.subtotal, 
                    tax ?? updatedOrder.tax ?? 0, 
                    discount ?? updatedOrder.discount ?? 0, 
                    total_amount ?? updatedOrder.total_amount
                ]
            );
        } else if (invoiceCheck.rows.length > 0 && (discount !== undefined || subtotal !== undefined || tax !== undefined || total_amount !== undefined)) {
            // Update existing invoice
            await query(
                `UPDATE invoices 
                 SET subtotal = COALESCE($1, subtotal),
                 tax = COALESCE($2, tax),
                 discount = COALESCE($3, discount),
                 total = COALESCE($4, total)
                 WHERE order_id = $5`,
                [subtotal, tax, discount, total_amount, params.id]
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update order' },
            { status: 500 }
        );
    }
}

// DELETE order (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        // First delete related invoice
        await query('DELETE FROM invoices WHERE order_id = $1', [params.id]);

        // Then delete the order
        const result = await query(
            'DELETE FROM orders WHERE id = $1 RETURNING id',
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Order and related invoice deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete order' },
            { status: 500 }
        );
    }
}
