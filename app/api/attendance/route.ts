import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        const attendanceRes = await query(`
            SELECT * FROM attendance WHERE user_id = $1 AND date = $2
        `, [userId, today]);

        if (attendanceRes.rowCount === 0) {
            return NextResponse.json({ success: true, data: { status: 'not_checked_in' } });
        }

        const attendance = attendanceRes.rows[0];

        // Fetch settings for Geofencing logic in frontend
        const settingsRes = await query(`
            SELECT key, value FROM settings 
            WHERE key IN ('restaurant_lat', 'restaurant_lng', 'allowed_radius')
        `);
        let settings: any = {};
        settingsRes.rows.forEach((s: any) => settings[s.key] = s.value);

        return NextResponse.json({
            success: true,
            data: {
                attendance,
                settings
            }
        });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch attendance' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, action, isAuto } = body; // action: 'start_break', 'end_break', 'check_out'

        if (!userId || !action) {
            return NextResponse.json({ success: false, error: 'userId and action are required' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];
        const attendanceRes = await query(`SELECT * FROM attendance WHERE user_id = $1 AND date = $2`, [userId, today]);

        if (attendanceRes.rowCount === 0) {
            return NextResponse.json({ success: false, error: 'No active attendance found for today' }, { status: 400 });
        }

        const attendanceId = attendanceRes.rows[0].id;
        const currentStatus = attendanceRes.rows[0].status;

        if (action === 'start_break') {
            if (currentStatus !== 'present') return NextResponse.json({ success: false, error: 'Must be present to start break' }, { status: 400 });
            
            await query(`INSERT INTO attendance_breaks (attendance_id, break_start) VALUES ($1, CURRENT_TIMESTAMP)`, [attendanceId]);
            await query(`UPDATE attendance SET status = 'on_break' WHERE id = $1`, [attendanceId]);
            
            return NextResponse.json({ success: true, message: 'Break started' });
        } 
        else if (action === 'end_break') {
            if (currentStatus !== 'on_break') return NextResponse.json({ success: false, error: 'Must be on break to end break' }, { status: 400 });
            
            // Find active break
            const activeBreakRes = await query(`SELECT * FROM attendance_breaks WHERE attendance_id = $1 AND break_end IS NULL ORDER BY break_start DESC LIMIT 1`, [attendanceId]);
            
            if (activeBreakRes.rowCount > 0) {
                const breakId = activeBreakRes.rows[0].id;
                await query(`
                    UPDATE attendance_breaks 
                    SET break_end = CURRENT_TIMESTAMP, 
                        duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - break_start)) / 60
                    WHERE id = $1
                `, [breakId]);
            }
            
            await query(`UPDATE attendance SET status = 'present' WHERE id = $1`, [attendanceId]);
            
            return NextResponse.json({ success: true, message: 'Break ended' });
        }
        else if (action === 'check_out') {
            if (currentStatus === 'checked_out') return NextResponse.json({ success: false, error: 'Already checked out' }, { status: 400 });

            // If on break, end break first
            if (currentStatus === 'on_break') {
                const activeBreakRes = await query(`SELECT * FROM attendance_breaks WHERE attendance_id = $1 AND break_end IS NULL ORDER BY break_start DESC LIMIT 1`, [attendanceId]);
                if (activeBreakRes.rowCount > 0) {
                    await query(`
                        UPDATE attendance_breaks 
                        SET break_end = CURRENT_TIMESTAMP, 
                            duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - break_start)) / 60
                        WHERE id = $1
                    `, [activeBreakRes.rows[0].id]);
                }
            }

            // Calculate total working hours
            // Total hours = (Checkout - Checkin) - (Sum of breaks)
            await query(`
                UPDATE attendance 
                SET check_out_time = CURRENT_TIMESTAMP, 
                    status = 'checked_out',
                    total_working_hours = (
                        SELECT (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - check_in_time)) / 3600.0) - COALESCE(
                            (SELECT SUM(duration_minutes) / 60.0 FROM attendance_breaks WHERE attendance_id = $1)
                        , 0)
                        FROM attendance WHERE id = $1
                    )
                WHERE id = $1
            `, [attendanceId]);
            
            return NextResponse.json({ success: true, message: isAuto ? 'Auto logged out due to geofence' : 'Checked out successfully' });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error updating attendance:', error);
        return NextResponse.json({ success: false, error: 'Failed to update attendance' }, { status: 500 });
    }
}
