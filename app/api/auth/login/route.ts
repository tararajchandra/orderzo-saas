import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { logAction } from '@/lib/audit';

// Haversine formula to calculate distance between two coordinates in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
        Math.cos(p1) * Math.cos(p2) *
        Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, lat, lng } = body;

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
        }

        // Check database for user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rowCount === 0) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result.rows[0];

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
        }

        // --- GEOFENCING & ATTENDANCE LOGIC FOR STAFF ---
        if (user.role === 'salesman' || user.role === 'kitchen_staff' || user.role === 'kitchen' || user.role === 'cashier') {
            
            // GPS check only for salesman and kitchen staff
            if (user.role !== 'cashier') {
                if (!lat || !lng) {
                    return NextResponse.json({ 
                        success: false, 
                        requireLocation: true, 
                        error: 'GPS Location required for staff login. Please allow location access.' 
                    }, { status: 403 });
                }

                // Fetch settings
                const settingsRes = await query(`
                    SELECT key, value FROM settings 
                    WHERE key IN ('restaurant_lat', 'restaurant_lng', 'allowed_radius')
                `);
                
                let rLat = 0, rLng = 0, radius = 50;
                settingsRes.rows.forEach((s: any) => {
                    if (s.key === 'restaurant_lat') rLat = parseFloat(s.value);
                    if (s.key === 'restaurant_lng') rLng = parseFloat(s.value);
                    if (s.key === 'allowed_radius') radius = parseFloat(s.value);
                });

                if (rLat !== 0 && rLng !== 0) {
                    const distance = getDistanceInMeters(lat, lng, rLat, rLng);
                    if (distance > radius) {
                        return NextResponse.json({ 
                            success: false, 
                            error: `You are too far from the restaurant (${Math.round(distance)}m). You must be within ${radius}m to login.` 
                        }, { status: 403 });
                    }
                }
            }

            // Record Check-in Attendance for all staff including cashier
            // Use IST (Asia/Kolkata) timezone for the date
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            
            // Check if there is an existing checked_out record for today
            const checkRes = await query('SELECT status FROM attendance WHERE user_id = $1 AND date = $2', [user.id, today]);
            if (checkRes.rowCount > 0 && checkRes.rows[0].status === 'checked_out') {
                // If they checked out and log in again on the same day, we shouldn't reset it to present unless they explicitly check-in.
                // But wait, if they log in again, maybe they meant to check in again? 
                // Let's just update it to present!
                await query(`
                    UPDATE attendance 
                    SET status = 'present', check_in_time = CURRENT_TIMESTAMP, check_out_time = NULL 
                    WHERE user_id = $1 AND date = $2
                `, [user.id, today]);
            } else {
                await query(`
                    INSERT INTO attendance (user_id, user_role, date, check_in_time, status)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'present')
                    ON CONFLICT (user_id, date) DO NOTHING
                `, [user.id, user.role, today]);
            }
        }
        // --- END GEOFENCING ---

        delete user.password_hash;
        const token = Buffer.from(`${user.id}-${user.email}-${Date.now()}`).toString('base64');

        return NextResponse.json({
            success: true,
            data: { user, token },
        });

    } catch (error) {
        console.error('Error during login:', error);
        return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
    }
}
