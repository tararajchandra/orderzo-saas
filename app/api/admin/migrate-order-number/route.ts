import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// This is a one-time migration endpoint
// Access: /api/admin/migrate-order-number
export async function POST(request: Request) {
    try {
        console.log('🚀 Starting order_number migration...');

        // Step 1: Add order_number column
        console.log('📝 Step 1: Adding order_number column...');
        await query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE
        `);
        console.log('✅ Column added');

        // Step 2: Create index
        console.log('📝 Step 2: Creating index...');
        await query(`
            CREATE INDEX IF NOT EXISTS idx_orders_order_number 
            ON orders(order_number)
        `);
        console.log('✅ Index created');

        // Step 3: Update existing orders with sequential numbers
        console.log('📝 Step 3: Updating existing orders...');
        const updateResult = await query(`
            WITH numbered_orders AS (
                SELECT 
                    id,
                    TO_CHAR(created_at, 'YYYYMMDD') as date_prefix,
                    ROW_NUMBER() OVER (
                        PARTITION BY DATE(created_at) 
                        ORDER BY created_at
                    ) as daily_seq
                FROM orders
                WHERE order_number IS NULL
            )
            UPDATE orders o
            SET order_number = n.date_prefix || '-' || LPAD(n.daily_seq::text, 3, '0')
            FROM numbered_orders n
            WHERE o.id = n.id
        `);
        console.log(`✅ Updated ${updateResult.rowCount} orders`);

        // Step 4: Verify
        const sampleOrders = await query(`
            SELECT id, order_number, customer_name, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 5
        `);

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully',
            stats: {
                ordersUpdated: updateResult.rowCount,
                sampleOrders: sampleOrders.rows
            }
        });

    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Migration failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}
