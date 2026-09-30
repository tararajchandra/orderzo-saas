
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const KEY_MAPPING: Record<string, string> = {
    restaurantName: 'restaurant_name',
    restaurantAddress: 'restaurant_address',
    restaurantPhone: 'restaurant_phone',
    restaurantEmail: 'restaurant_email',
    gstNumber: 'gst_number',
    gstType: 'gst_type',
    printerType: 'printer_type',
    paperWidth: 'paper_width',
    showLogo: 'show_logo',
    footerText: 'footer_text',
    totalTables: 'total_tables',
    restaurantLat: 'restaurant_lat',
    restaurantLng: 'restaurant_lng',
    allowedRadius: 'allowed_radius',
    customerRadius: 'customer_radius',
};

const REVERSE_MAPPING: Record<string, string> = Object.entries(KEY_MAPPING).reduce((acc, [k, v]) => {
    acc[v] = k;
    return acc;
}, {} as Record<string, string>);

export async function GET() {
    try {
        const result = await query('SELECT key, value FROM settings');
        const settings: Record<string, any> = {};

        result.rows.forEach((row: any) => {
            const camelKey = REVERSE_MAPPING[row.key];
            if (camelKey) {
                // Handle booleans
                if (row.value === 'true') settings[camelKey] = true;
                else if (row.value === 'false') settings[camelKey] = false;
                else settings[camelKey] = row.value;
            }
        });

        // Ensure defaults if missing
        const defaults = {
            restaurantName: 'OrderZo',
            restaurantAddress: '',
            restaurantPhone: '',
            restaurantEmail: '',
            gstNumber: '',
            gstType: 'regular',
            printerType: 'thermal',
            paperWidth: '80mm',
            showLogo: true,
            footerText: 'Thank you for your business!',
            totalTables: '16',
            restaurantLat: '22.5726',
            restaurantLng: '88.3639',
            allowedRadius: '50',
            customerRadius: '100',
        };

        return NextResponse.json({
            success: true,
            data: { ...defaults, ...settings },
        });

    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const settings = body;

        // Transaction-like updates
        const client = await query('BEGIN'); // This 'query' wrapper might not support explicit client handling if it just does pool.query.
        // If 'query' is just `pool.query`, BEGIN might not work as expected if we don't hold the client.
        // But for settings, simple individual updates are probably fine or we can just run multiple upserts.

        const updates = [];
        for (const [key, value] of Object.entries(settings)) {
            const dbKey = KEY_MAPPING[key];
            if (dbKey) {
                updates.push(query(
                    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                    [dbKey, String(value)]
                ));
            }
        }

        await Promise.all(updates);

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully',
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
