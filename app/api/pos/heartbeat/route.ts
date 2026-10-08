import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Check if POS counter is currently online
export async function GET() {
    try {
        const res = await query(
            `SELECT value FROM settings WHERE key = 'pos_last_heartbeat'`
        );

        let isOnline = false;
        let lastSeenTimestamp: number | null = null;
        let elapsedSeconds = 999999;

        if (res.rows.length > 0 && res.rows[0].value) {
            lastSeenTimestamp = parseInt(res.rows[0].value, 10);
            if (!isNaN(lastSeenTimestamp)) {
                elapsedSeconds = Math.max(0, Math.round((Date.now() - lastSeenTimestamp) / 1000));
                // POS is considered online if heartbeat was received within last 45 seconds
                isOnline = elapsedSeconds <= 45;
            }
        }

        return NextResponse.json({
            success: true,
            is_pos_online: isOnline,
            last_seen_seconds_ago: elapsedSeconds,
            last_seen_timestamp: lastSeenTimestamp,
        });
    } catch (error: any) {
        console.error('Error checking POS heartbeat:', error);
        return NextResponse.json(
            { success: false, error: error.message, is_pos_online: false },
            { status: 500 }
        );
    }
}

// POST: POS Counter sends heartbeat ping
export async function POST(request: Request) {
    try {
        let body: any = {};
        try {
            body = await request.json();
        } catch {
            // body is optional
        }

        const now = Date.now().toString();

        await query(
            `INSERT INTO settings (key, value)
             VALUES ('pos_last_heartbeat', $1)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
            [now]
        );

        return NextResponse.json({
            success: true,
            timestamp: now,
            message: 'Heartbeat recorded successfully',
        });
    } catch (error: any) {
        console.error('Error saving POS heartbeat:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
