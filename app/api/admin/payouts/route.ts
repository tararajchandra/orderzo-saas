
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, amount, payout_date, payment_method, notes } = body;

        if (!user_id || !amount) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Detect which column name to use (delivery_boy_id for local, user_id for Railway)
        const columnCheck = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'payouts' 
            AND column_name IN ('delivery_boy_id', 'user_id')
        `);

        const userColumn = columnCheck.rows[0]?.column_name || 'user_id';
        const dateColumn = columnCheck.rows.some((r: any) => r.column_name === 'payment_date') ? 'payment_date' : 'payout_date';

        // Create Payout Record with dynamic column names
        const payoutRes = await query(
            `INSERT INTO payouts (${userColumn}, amount, ${dateColumn}, notes) VALUES ($1, $2, $3, $4) RETURNING id`,
            [user_id, amount, payout_date || new Date().toISOString().split('T')[0], notes]
        );
        const payoutId = payoutRes.rows[0].id;

        return NextResponse.json({ success: true, message: 'Payout recorded successfully', payout_id: payoutId });

    } catch (error) {
        console.error('Error creating payout:', error);
        return NextResponse.json({ success: false, error: 'Failed to process payout' }, { status: 500 });
    }
}

export async function GET() {
    try {
        // Detect which column name to use
        const columnCheck = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'payouts' 
            AND column_name IN ('delivery_boy_id', 'user_id')
        `);

        const userColumn = columnCheck.rows[0]?.column_name || 'user_id';

        // Report: Delivery Boy Wise Payable
        const reportQuery = `
            SELECT 
                u.id, 
                u.name, 
                u.phone,
                u.commission_rate,
                u.commission_type,
                COALESCE(SUM(o.driver_commission), 0) as total_earned,
                COALESCE(SUM(p.amount), 0) as total_paid
            FROM users u
            LEFT JOIN orders o ON u.id = o.delivery_boy_id AND o.order_status = 'delivered'
            LEFT JOIN payouts p ON u.id = p.${userColumn}
            WHERE u.role = 'delivery_boy'
            GROUP BY u.id, u.name, u.phone, u.commission_rate, u.commission_type
        `;

        const result = await query(reportQuery);

        const data = result.rows.map(row => ({
            ...row,
            due_amount: (parseFloat(row.total_earned) - parseFloat(row.total_paid)).toFixed(2)
        }));

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Error fetching payout report:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint
        });
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch report',
            details: error.message
        }, { status: 500 });
    }
}
