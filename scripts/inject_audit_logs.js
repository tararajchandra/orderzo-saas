const fs = require('fs');

// 1. UPDATE LOGIN API
let loginContent = fs.readFileSync('app/api/auth/login/route.ts', 'utf8');
if (!loginContent.includes('logAction')) {
    loginContent = loginContent.replace(/import \{ query \} from '@\/lib\/db';/, "import { query } from '@/lib/db';\nimport { logAction } from '@/lib/audit';");
    
    loginContent = loginContent.replace(
        /const token = Buffer\.from\([^)]+\)\.toString\('base64'\);/,
        "const token = Buffer.from(`${user.id}-${user.email}-${Date.now()}`).toString('base64');\n\n        await logAction(user.id, 'LOGIN', 'auth', null, { role: user.role, email: user.email });"
    );
    fs.writeFileSync('app/api/auth/login/route.ts', loginContent);
}

// 2. UPDATE ATTENDANCE API
let attContent = fs.readFileSync('app/api/attendance/route.ts', 'utf8');
if (!attContent.includes('logAction')) {
    attContent = attContent.replace(/import \{ query \} from '@\/lib\/db';/, "import { query } from '@/lib/db';\nimport { logAction } from '@/lib/audit';");
    
    attContent = attContent.replace(
        /await query\(`UPDATE attendance SET status = 'on_break' WHERE id = \$1`, \[attendanceId\]\);/,
        "await query(`UPDATE attendance SET status = 'on_break' WHERE id = $1`, [attendanceId]);\n            await logAction(userId, 'ATTENDANCE_BREAK_START', 'attendance', attendanceId.toString());"
    );
    
    attContent = attContent.replace(
        /await query\(`UPDATE attendance SET status = 'present' WHERE id = \$1`, \[attendanceId\]\);/,
        "await query(`UPDATE attendance SET status = 'present' WHERE id = $1`, [attendanceId]);\n            await logAction(userId, 'ATTENDANCE_BREAK_END', 'attendance', attendanceId.toString());"
    );
    
    attContent = attContent.replace(
        /return NextResponse\.json\(\{ success: true, message: isAuto \? 'Auto logged out due to geofence' : 'Checked out successfully' \}\);/,
        "await logAction(userId, 'ATTENDANCE_CHECKOUT', 'attendance', attendanceId.toString(), { isAuto });\n            return NextResponse.json({ success: true, message: isAuto ? 'Auto logged out due to geofence' : 'Checked out successfully' });"
    );
    
    fs.writeFileSync('app/api/attendance/route.ts', attContent);
}

// 3. UPDATE SETTINGS API
let setContent = fs.readFileSync('app/api/settings/route.ts', 'utf8');
if (!setContent.includes('logAction')) {
    setContent = setContent.replace(/import \{ query \} from '@\/lib\/db';/, "import { query } from '@/lib/db';\nimport { logAction } from '@/lib/audit';");
    
    setContent = setContent.replace(
        /await Promise\.all\(updates\);/,
        "await Promise.all(updates);\n        await logAction(null, 'SETTINGS_UPDATED', 'settings', null, settings);"
    );
    
    fs.writeFileSync('app/api/settings/route.ts', setContent);
}

// 4. UPDATE ORDERS API
let orderContent = fs.readFileSync('app/api/orders/route.ts', 'utf8');
if (!orderContent.includes('logAction')) {
    orderContent = orderContent.replace(/import \{ getClient \} from '@\/lib\/db';/, "import { getClient, query } from '@/lib/db';\nimport { logAction } from '@/lib/audit';");
    
    orderContent = orderContent.replace(
        /await client\.query\('COMMIT'\);/,
        "await client.query('COMMIT');\n        await logAction(user_id || null, 'ORDER_CREATED', 'order', orderNumber, { total_amount, order_type });"
    );
    
    fs.writeFileSync('app/api/orders/route.ts', orderContent);
}
