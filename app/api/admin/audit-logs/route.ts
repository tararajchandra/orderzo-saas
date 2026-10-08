import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const result = await query(`
            SELECT a.*, u.name as user_name, u.role as user_role 
            FROM audit_logs a 
            LEFT JOIN users u ON a.user_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await query('SELECT COUNT(*) as total FROM audit_logs');
        const total = parseInt(countResult.rows[0].total);

        return NextResponse.json({ 
            success: true, 
            data: result.rows,
            pagination: { total, limit, offset }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }
}
