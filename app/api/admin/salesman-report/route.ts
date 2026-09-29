import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7days';

        // Calculate date range
        let intervalSql = "CURRENT_DATE - INTERVAL '7 days'";
        if (range === 'today') intervalSql = "CURRENT_DATE";
        else if (range === '30days') intervalSql = "CURRENT_DATE - INTERVAL '30 days'";
        else if (range === '90days') intervalSql = "CURRENT_DATE - INTERVAL '90 days'";
        else if (range === 'year') intervalSql = "CURRENT_DATE - INTERVAL '1 year'";
        else if (range === 'all') intervalSql = "'1970-01-01'::date";

        // Query to get sales by salesman
        const result = await query(`
            SELECT 
                u.id as salesman_id,
                u.name as salesman_name,
                COUNT(o.id)::int as total_orders,
                COALESCE(SUM(o.total_amount), 0)::float as total_revenue
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id 
                AND o.created_at >= ${intervalSql}
                AND o.order_status != 'cancelled'
            WHERE u.role = 'salesman'
            GROUP BY u.id, u.name
            ORDER BY total_revenue DESC, total_orders DESC
        `);

        return NextResponse.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error generating salesman report:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}
