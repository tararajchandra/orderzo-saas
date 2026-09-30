const fs = require('fs');

let content = fs.readFileSync('app/api/orders/route.ts', 'utf8');

const geofenceLogic = `
        // --- DINE-IN GEOFENCING LOGIC ---
        if (order_type === 'dine_in' && !user_id) { // Not logged in means it's a customer scanning QR
            if (!customer_lat || !customer_lng) {
                return NextResponse.json({ success: false, error: 'GPS Location is required for table orders to prevent spam.' }, { status: 403 });
            }

            const settingsRes = await client.query(\`
                SELECT key, value FROM settings 
                WHERE key IN ('restaurant_lat', 'restaurant_lng', 'customer_radius')
            \`);
            
            let rLat = 0, rLng = 0, cRadius = 100;
            settingsRes.rows.forEach((s: any) => {
                if (s.key === 'restaurant_lat') rLat = parseFloat(s.value);
                if (s.key === 'restaurant_lng') rLng = parseFloat(s.value);
                if (s.key === 'customer_radius') cRadius = parseFloat(s.value);
            });

            if (rLat !== 0 && rLng !== 0) {
                // Haversine formula
                const R = 6371e3;
                const p1 = customer_lat * Math.PI / 180;
                const p2 = rLat * Math.PI / 180;
                const dp = (rLat - customer_lat) * Math.PI / 180;
                const dl = (rLng - customer_lng) * Math.PI / 180;
                const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distanceMeters = R * c;

                if (distanceMeters > cRadius) {
                    return NextResponse.json({ 
                        success: false, 
                        error: \`You are too far from the restaurant (\${Math.round(distanceMeters)}m). You must be within \${cRadius}m to place a table order.\` 
                    }, { status: 403 });
                }
            }
        }
        // --- END GEOFENCING ---
        
        // START TRANSACTION`;

content = content.replace(/\/\/ START TRANSACTION/, geofenceLogic);

fs.writeFileSync('app/api/orders/route.ts', content);
