import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET single order
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const isNumeric = /^\d+$/.test(params.id);
        const queryText = `
            SELECT o.*, i.id as invoice_id, i.invoice_number,
                   (i.id IS NOT NULL OR COALESCE(o.invoice_printed, false) = true) AS is_invoice_printed
            FROM orders o
            LEFT JOIN invoices i ON o.id = i.order_id
            WHERE ${isNumeric ? 'o.id = $1' : 'o.order_number = $1'}
        `;
        let result;
        try {
            result = await query(queryText, [isNumeric ? parseInt(params.id, 10) : params.id]);
        } catch (err: any) {
            if (err?.code === '42703') {
                const fallbackText = `
                    SELECT o.*, i.id as invoice_id, i.invoice_number,
                           (i.id IS NOT NULL) AS is_invoice_printed
                    FROM orders o
                    LEFT JOIN invoices i ON o.id = i.order_id
                    WHERE ${isNumeric ? 'o.id = $1' : 'o.order_number = $1'}
                `;
                result = await query(fallbackText, [isNumeric ? parseInt(params.id, 10) : params.id]);
            } else {
                throw err;
            }
        }

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
            split_card,
            invoice_printed
        } = body;

        let driverCommission = null;

        const isNumeric = /^\d+$/.test(params.id);
        const existingCheck = isNumeric
            ? await query('SELECT * FROM orders WHERE id = $1', [parseInt(params.id, 10)])
            : await query('SELECT * FROM orders WHERE order_number = $1', [params.id]);
        if (existingCheck.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }
        const existing = existingCheck.rows[0];
        const effectiveId = existing.id;

        // Guard: Once an invoice is printed/issued, the order CANNOT be cancelled!
        if (order_status === 'cancelled') {
            const invoiceCheckBefore = await query('SELECT id, invoice_number FROM invoices WHERE order_id = $1', [effectiveId]);
            const isAlreadyInvoiced = existing.invoice_printed === true || invoiceCheckBefore.rows.length > 0;
            if (isAlreadyInvoiced) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invoice already printed! This order cannot be cancelled once an invoice has been issued or printed.'
                    },
                    { status: 400 }
                );
            }
        }

        // If invoice_printed flag passed, record it in database
        if (invoice_printed === true) {
            try {
                await query('UPDATE orders SET invoice_printed = true WHERE id = $1', [effectiveId]);
            } catch (err: any) {
                if (err?.code === '42703') {
                    try {
                        await query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_printed BOOLEAN DEFAULT false;');
                        await query('UPDATE orders SET invoice_printed = true WHERE id = $1', [effectiveId]);
                    } catch (migrationErr) {
                        console.warn('Could not add or update invoice_printed column:', migrationErr);
                    }
                }
            }
        }

        // Guard: If order was already settled/paid by cashier, keep cashier's final payment details
        if (existing.payment_status === 'paid' && payment_status === 'paid') {
            return NextResponse.json({
                success: true,
                message: 'Order was already settled by cashier',
                data: existing,
            });
        }

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
            `, [dbId || null, effectiveId]);

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
           items = COALESCE($7::jsonb, items),
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
           invoice_printed = COALESCE($19, invoice_printed),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $20
       RETURNING *`,
            [
                order_status ?? null,
                payment_status ?? null,
                delivery_boy_id ?? null,
                driverCommission ?? null,
                customer_name ?? null,
                customer_phone ?? null,
                items !== undefined && items !== null ? JSON.stringify(items) : null,
                subtotal ?? null,
                tax ?? null,
                discount ?? null,
                total_amount ?? null,
                payment_method ?? null,
                table_number ?? null,
                notes ?? null,
                order_type ?? null,
                split_cash !== undefined ? split_cash : null,
                split_upi !== undefined ? split_upi : null,
                split_card !== undefined ? split_card : null,
                invoice_printed !== undefined ? invoice_printed : null,
                effectiveId
            ]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        // Handle Invoice Generation/Update (when order is paid OR invoice was printed)
        const invoiceCheck = await query('SELECT * FROM invoices WHERE order_id = $1', [effectiveId]);
        let finalInvoiceNumber = invoiceCheck.rows[0]?.invoice_number || null;
        
        if (invoiceCheck.rows.length === 0 && (payment_status === 'paid' || invoice_printed === true)) {
            // Generate invoice if paid or printed and doesn't exist yet
            const updatedOrder = result.rows[0];

            // Get active financial year
            const fyResult = await query('SELECT id, name FROM financial_years WHERE is_active = true');
            let financial_year_id = updatedOrder.financial_year_id || null;
            let fy_name = '';
            if (fyResult.rows.length > 0) {
                if (!financial_year_id) financial_year_id = fyResult.rows[0].id;
                fy_name = fyResult.rows[0].name;
            }

            let invoiceCount = 1;
            let invoiceNumber = '';

            if (financial_year_id && fy_name) {
                const shortFy = fy_name.replace('20', '');
                const prefix = `INV/${shortFy}/`;
                const invoiceMaxResult = await query(
                    `SELECT MAX(invoice_number) as max_val FROM invoices 
                     WHERE invoice_number LIKE $1`, [`${prefix}%`]
                );
                if (invoiceMaxResult.rows[0]?.max_val) {
                    const maxInv = invoiceMaxResult.rows[0].max_val;
                    const lastNum = parseInt(maxInv.split('/').pop() || '0');
                    invoiceCount = lastNum + 1;
                }
                invoiceNumber = `${prefix}${String(invoiceCount).padStart(4, '0')}`;
            } else {
                const invoiceDateStr = new Date().toISOString().split('T')[0];
                const invoiceDate = invoiceDateStr.replace(/-/g, '');
                const prefix = `INV-${invoiceDate}-`;
                const invoiceMaxResult = await query(
                    `SELECT MAX(invoice_number) as max_val FROM invoices 
                     WHERE invoice_number LIKE $1`, [`${prefix}%`]
                );
                if (invoiceMaxResult.rows[0]?.max_val) {
                    const maxInv = invoiceMaxResult.rows[0].max_val;
                    const lastNum = parseInt(maxInv.split('-').pop() || '0');
                    invoiceCount = lastNum + 1;
                }
                invoiceNumber = `${prefix}${String(invoiceCount).padStart(4, '0')}`;
            }

            finalInvoiceNumber = invoiceNumber;

            try {
                await query(
                    `INSERT INTO invoices (order_id, invoice_number, subtotal, tax, discount, total, delivery_charge, financial_year_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (invoice_number) DO NOTHING`,
                    [
                        effectiveId, 
                        invoiceNumber, 
                        subtotal ?? updatedOrder.subtotal ?? 0, 
                        tax ?? updatedOrder.tax ?? 0, 
                        discount ?? updatedOrder.discount ?? 0, 
                        total_amount ?? updatedOrder.total_amount ?? 0,
                        updatedOrder.delivery_charge ?? 0,
                        financial_year_id
                    ]
                );
            } catch (invErr) {
                console.warn('⚠️ Invoice insert skipped or warning:', invErr);
            }
        } else if (invoiceCheck.rows.length > 0 && (discount !== undefined || subtotal !== undefined || tax !== undefined || total_amount !== undefined)) {
            // Update existing invoice
            await query(
                `UPDATE invoices 
                 SET subtotal = COALESCE($1, subtotal),
                 tax = COALESCE($2, tax),
                 discount = COALESCE($3, discount),
                 total = COALESCE($4, total)
                 WHERE order_id = $5`,
                [subtotal ?? null, tax ?? null, discount ?? null, total_amount ?? null, effectiveId]
            );
        }

        const isMarkedPrinted = invoice_printed === true || result.rows[0].invoice_printed === true || Boolean(finalInvoiceNumber);

        return NextResponse.json({
            success: true,
            data: {
                ...result.rows[0],
                invoice_number: finalInvoiceNumber,
                invoice_printed: isMarkedPrinted,
                is_invoice_printed: isMarkedPrinted,
            },
        });
    } catch (error: any) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update order: ' + (error?.message || error) },
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
        const isNumeric = /^\d+$/.test(params.id);
        const orderRes = isNumeric
            ? await query('SELECT id, invoice_printed FROM orders WHERE id = $1', [parseInt(params.id, 10)])
            : await query('SELECT id, invoice_printed FROM orders WHERE order_number = $1', [params.id]);

        if (orderRes.rows.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Order already deleted or not found',
            });
        }
        const effectiveId = orderRes.rows[0].id;
        const invoicePrinted = orderRes.rows[0].invoice_printed;

        const { searchParams } = new URL(request.url);
        const isTableMerge = searchParams.get('is_table_merge') === 'true';

        // Guard: Prevent deletion if invoice has already been issued or printed (unless merging sub-orders into master table bill)
        const checkInvoice = await query('SELECT id, invoice_number FROM invoices WHERE order_id = $1', [effectiveId]);
        if (!isTableMerge && (invoicePrinted || checkInvoice.rows.length > 0)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete order: An invoice has already been issued or printed for this order.'
                },
                { status: 400 }
            );
        }

        // Clean up duplicate invoice record if sub-order was merged into master order
        if (isTableMerge && checkInvoice.rows.length > 0) {
            await query('DELETE FROM invoices WHERE order_id = $1', [effectiveId]);
        }

        // Delete order
        const result = await query(
            'DELETE FROM orders WHERE id = $1 RETURNING id',
            [effectiveId]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Order already deleted or not found',
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete order' },
            { status: 500 }
        );
    }
}
