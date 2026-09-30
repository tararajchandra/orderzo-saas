import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        
        let sql = `
            SELECT a.*, u.name as user_name, u.email as user_email,
            (SELECT COUNT(*) FROM attendance_breaks ab WHERE ab.attendance_id = a.id) as break_count,
            (SELECT SUM(duration_minutes) FROM attendance_breaks ab WHERE ab.attendance_id = a.id) as total_break_minutes
            FROM attendance a
            JOIN users u ON a.user_id = u.id
        `;
        const params: any[] = [];
        
        if (date) {
            sql += ` WHERE a.date = $1`;
            params.push(date);
        }
        
        sql += ` ORDER BY a.check_in_time DESC`;

        const result = await query(sql, params);
        
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching admin attendance:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch attendance records' }, { status: 500 });
    }
}
