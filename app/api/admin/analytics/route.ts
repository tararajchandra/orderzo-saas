import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7days';

        // Calculate date range
        let intervalSql = "CURRENT_DATE - INTERVAL '7 days'";
        if (range === '30days') intervalSql = "CURRENT_DATE - INTERVAL '30 days'";
        else if (range === '90days') intervalSql = "CURRENT_DATE - INTERVAL '90 days'";
        else if (range === 'year') intervalSql = "CURRENT_DATE - INTERVAL '1 year'";
        else if (range === 'all') intervalSql = "'1970-01-01'::date";

        // 1. Totals
        const totalsResult = await query(`
            SELECT
                COUNT(*)::int AS total_orders,
                COALESCE(SUM(total_amount), 0)::float AS total_revenue,
                COALESCE(AVG(total_amount), 0)::float AS avg_order_value
            FROM orders
            WHERE created_at >= ${intervalSql}
        `);

        // 2. Revenue by day
        const revenueByDayResult = await query(`
            SELECT
                DATE(created_at) AS date,
                COALESCE(SUM(total_amount), 0)::float AS revenue,
                COUNT(*)::int AS orders
            FROM orders
            WHERE created_at >= ${intervalSql}
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // 3. Orders by status
        const ordersByStatusResult = await query(`
            SELECT
                order_status AS status,
                COUNT(*)::int AS count
            FROM orders
            WHERE created_at >= ${intervalSql}
            GROUP BY order_status
        `);

        // 4. Payment methods
        const paymentMethodsResult = await query(`
            SELECT
                payment_method AS method,
                COUNT(*)::int AS count,
                COALESCE(SUM(total_amount), 0)::float AS amount
            FROM orders
            WHERE created_at >= ${intervalSql}
            GROUP BY payment_method
            ORDER BY amount DESC
        `);

        // 5. Top selling items & category revenue — need items JSONB
        // We fetch only the items column (not o.*) for the date range only
        const itemsResult = await query(`
            SELECT items
            FROM orders
            WHERE created_at >= ${intervalSql}
              AND items IS NOT NULL
        `);

        // Process items in JS (only for the filtered date range, not all time)
        const itemsMap = new Map<string, { quantity: number; revenue: number }>();
        const categoryMap = new Map<string, number>();

        itemsResult.rows.forEach((row: any) => {
            let parsedItems = row.items;
            if (typeof parsedItems === 'string') {
                try { parsedItems = JSON.parse(parsedItems); } catch { return; }
            }
            if (!Array.isArray(parsedItems)) return;

            parsedItems.forEach((item: any) => {
                const name = item?.menuItem?.name;
                const price = parseFloat(item?.menuItem?.price || 0);
                const qty = parseInt(item?.quantity || 0);
                const category = item?.menuItem?.category_name || 'Uncategorized';
                const revenue = price * qty;

                if (name) {
                    const existing = itemsMap.get(name);
                    if (existing) {
                        existing.quantity += qty;
                        existing.revenue += revenue;
                    } else {
                        itemsMap.set(name, { quantity: qty, revenue });
                    }
                }

                categoryMap.set(category, (categoryMap.get(category) || 0) + revenue);
            });
        });

        const topSellingItems = Array.from(itemsMap.entries())
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const categoryRevenue = Array.from(categoryMap.entries())
            .map(([category, revenue]) => ({ category, revenue }))
            .sort((a, b) => b.revenue - a.revenue);

        const totals = totalsResult.rows[0];

        return NextResponse.json({
            success: true,
            data: {
                totalRevenue: totals.total_revenue,
                totalOrders: totals.total_orders,
                averageOrderValue: totals.avg_order_value,
                revenueByDay: revenueByDayResult.rows,
                ordersByStatus: ordersByStatusResult.rows,
                paymentMethods: paymentMethodsResult.rows,
                topSellingItems,
                categoryRevenue,
            }
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
