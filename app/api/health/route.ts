import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check database connection
        const result = await query('SELECT 1 as health');

        if (result.rows.length > 0) {
            return NextResponse.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                uptime: process.uptime()
            });
        }

        return NextResponse.json({
            status: 'unhealthy',
            database: 'disconnected'
        }, { status: 503 });

    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json({
            status: 'unhealthy',
            error: 'Database connection failed'
        }, { status: 503 });
    }
}
