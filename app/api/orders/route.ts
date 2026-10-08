import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';
import { logAction } from '@/lib/audit';

export const dynamic = 'force-dynamic';


// GET all orders or user-specific orders
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        const orderType = searchParams.get('type');
        const paymentStatus = searchParams.get('payment_status');
        const dateParam = searchParams.get('date'); // 'today' or ISO date string
        const since = searchParams.get('since');
        const fy_id = searchParams.get('fy_id'); // ISO timestamp for polling
        const includeItems = searchParams.get('include_items') === 'true';
        const limit = parseInt(searchParams.get('limit') || '500');

        // Select specific columns (avoid sending heavy JSONB items in list views)
        const itemsCol = includeItems ? 'o.items,' : '';
        let queryText = `
            SELECT 
                o.id, o.order_number, o.user_id, o.salesman_id,
                o.customer_name, o.customer_phone, o.customer_address,
                o.order_type, o.table_number,
                o.subtotal, o.tax, o.discount, o.delivery_charge, o.total_amount,
                o.split_cash, o.split_upi, o.split_card,
                o.payment_method, o.payment_status, o.order_status,
                o.delivery_boy_id, o.driver_commission,
                o.notes, o.created_at, o.updated_at,
                ${itemsCol}
                dl.location_name as delivery_location_name
            FROM orders o
            LEFT JOIN delivery_locations dl ON o.delivery_location_id = dl.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 1;

        if (fy_id) {
            queryText += ` AND o.financial_year_id = $${paramCount}`;
            params.push(fy_id);
            paramCount++;
        }

        if (userId) {
            queryText += ` AND o.user_id = $${paramCount}`;
            params.push(userId);
            paramCount++;
        }

        if (status) {
            queryText += ` AND o.order_status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (orderType) {
            queryText += ` AND o.order_type = $${paramCount}`;
            params.push(orderType);
            paramCount++;
        }

        if (paymentStatus) {
            queryText += ` AND o.payment_status = $${paramCount}`;
            params.push(paymentStatus);
            paramCount++;
        }

        if (dateParam === 'today') {
            queryText += ` AND (
                (o.created_at >= CURRENT_DATE AND o.created_at < (CURRENT_DATE + INTERVAL '1 day'))
                OR (o.created_at >= NOW() - INTERVAL '24 hours')
                OR o.payment_status = 'pending'
                OR (o.order_status NOT IN ('delivered', 'cancelled'))
            )`;
        } else if (since) {
            queryText += ` AND o.created_at > $${paramCount}`;
            params.push(since);
            paramCount++;
        }

        queryText += ` ORDER BY o.created_at DESC LIMIT $${paramCount}`;
        params.push(limit);

        const result = await query(queryText, params);

        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}

// POST create new order
export async function POST(request: Request) {
    const client = await getClient();
    try {
        const body = await request.json();
        const {
            user_id,
            salesman_id,
            prefix: requestedPrefix,
            order_number: requestedOrderNumber,
            customer_name,
            customer_phone,
            customer_address,
            order_type,
            items,
            subtotal,
            tax,
            discount,
            delivery_location_id,
            delivery_charge,
            total_amount,
            payment_method,

            customer_lat,
            customer_lng,
            distance,

            notes,
            table_number,
            order_status,
            payment_status,
        } = body;

        // Validate required fields
        if (!items || total_amount === undefined || total_amount === null || !payment_method) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // For delivery orders, customer details and address are required
        if (order_type === 'delivery') {
            if (!customer_name || !customer_phone) {
                return NextResponse.json(
                    { success: false, error: 'Customer name and phone are required for delivery orders' },
                    { status: 400 }
                );
            }
            if (!customer_address) {
                return NextResponse.json(
                    { success: false, error: 'Address is required for delivery orders' },
                    { status: 400 }
                );
            }
        }

        
        // --- DINE-IN GEOFENCING LOGIC ---
        if (order_type === 'dine_in' && !user_id) { // Not logged in means it's a customer scanning QR
            if (!customer_lat || !customer_lng) {
                return NextResponse.json({ success: false, error: 'GPS Location is required for table orders to prevent spam.' }, { status: 403 });
            }

            const settingsRes = await client.query(`
                SELECT key, value FROM settings 
                WHERE key IN ('restaurant_lat', 'restaurant_lng', 'customer_radius')
            `);
            
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
                        error: `You are too far from the restaurant (${Math.round(distanceMeters)}m). You must be within ${cRadius}m to place a table order.` 
                    }, { status: 403 });
                }
            }
        }
        // --- END GEOFENCING ---

        // --- QR TABLE ORDER POS LIVENESS CHECK ---
        if (order_type === 'dine_in' && (!user_id || requestedPrefix === 'QR')) {
            const heartbeatRes = await client.query(
                `SELECT value FROM settings WHERE key = 'pos_last_heartbeat'`
            );
            let isPosLive = false;
            if (heartbeatRes.rows.length > 0 && heartbeatRes.rows[0].value) {
                const lastSeen = parseInt(heartbeatRes.rows[0].value, 10);
                if (!isNaN(lastSeen) && (Date.now() - lastSeen) <= 45000) {
                    isPosLive = true;
                }
            }

            if (!isPosLive) {
                return NextResponse.json({ 
                    success: false, 
                    error: "Restaurant counter is currently offline. Please place your order directly with our waiter / salesman.\n\nরেস্তোরাঁর কাউন্টারে বর্তমানে ইন্টারনেট সুবিধা নেই। অনুগ্রহ করে আপনার অর্ডারটি সরাসরি ওয়েটার/সেলসম্যানকে দিন।\n\nरेस्तरां काउंटर पर वर्तमान में इंटरनेट सुविधा नहीं है। कृपया अपना ऑर्डर सीधे हमारे वेटर/सेल्समैन को दें।",
                    pos_offline: true,
                }, { status: 503 });
            }
        }
        // --- END QR POS LIVENESS CHECK ---
        
        // START TRANSACTION
        await client.query('BEGIN');
        
        // Get active financial year
        const fyResult = await client.query('SELECT id, name FROM financial_years WHERE is_active = true');
        let financial_year_id = null;
        let fy_name = '';
        if (fyResult.rows.length > 0) {
            financial_year_id = fyResult.rows[0].id;
            fy_name = fyResult.rows[0].name; // e.g., '2024-25'
        }

        // 1. Determine prefix and effective salesman ID
        let effectiveSalesmanId = salesman_id || null;
        let validUserId: number | null = null;
        let prefix: string = (requestedPrefix ? String(requestedPrefix).trim() : '').toUpperCase();

        if (user_id) {
            const userRes = await client.query('SELECT id, role FROM users WHERE id = $1', [user_id]);
            if (userRes.rows.length > 0) {
                validUserId = userRes.rows[0].id;
                const userRole = userRes.rows[0].role;
                if (!prefix) {
                    if (userRole === 'salesman') {
                        effectiveSalesmanId = user_id;
                        prefix = `S${user_id}`;
                    } else if (userRole === 'cashier' || userRole === 'admin') {
                        prefix = 'POS';
                    } else if (order_type === 'dine_in') {
                        prefix = 'QR';
                    } else {
                        prefix = 'WEB';
                    }
                } else if (userRole === 'salesman' && !effectiveSalesmanId) {
                    effectiveSalesmanId = user_id;
                }
            }
        }

        if (effectiveSalesmanId) {
            const smCheck = await client.query('SELECT id FROM users WHERE id = $1', [effectiveSalesmanId]);
            if (smCheck.rows.length === 0) {
                effectiveSalesmanId = null;
            }
        }

        if (!prefix) {
            if (effectiveSalesmanId) {
                prefix = `S${effectiveSalesmanId}`;
            } else if (order_type === 'dine_in') {
                prefix = 'QR';
            } else {
                prefix = 'POS';
            }
        }

        let validLocationId: number | null = null;
        if (delivery_location_id) {
            const locCheck = await client.query('SELECT id FROM delivery_locations WHERE id = $1', [delivery_location_id]);
            if (locCheck.rows.length > 0) {
                validLocationId = delivery_location_id;
            }
        }

        // 2. Generate daily sequential order number with prefix
        const today = new Date();
        const datePrefix = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
        let orderNumber = requestedOrderNumber ? String(requestedOrderNumber).trim() : null;

        // If client passed an order number (e.g. offline queue), verify it does not already exist
        if (orderNumber) {
            const checkExisting = await client.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber]);
            if (checkExisting.rows.length > 0) {
                const existing = checkExisting.rows[0];
                // If newer data (items or total_amount) is supplied from offline queue, update the existing order
                if (items && Array.isArray(items)) {
                    await client.query(
                        `UPDATE orders 
                         SET items = $1, subtotal = $2, tax = $3, discount = $4, total_amount = $5, updated_at = CURRENT_TIMESTAMP
                         WHERE id = $6`,
                        [
                            JSON.stringify(items),
                            subtotal ?? existing.subtotal,
                            tax ?? existing.tax,
                            discount ?? existing.discount,
                            total_amount ?? existing.total_amount,
                            existing.id
                        ]
                    );
                    const updated = await client.query('SELECT * FROM orders WHERE id = $1', [existing.id]);
                    await client.query('COMMIT');
                    return NextResponse.json({
                        success: true,
                        data: updated.rows[0],
                        message: 'Existing offline order updated',
                    });
                }
                await client.query('COMMIT');
                return NextResponse.json({
                    success: true,
                    data: existing,
                    message: 'Order already exists',
                });
            }
        }

        if (!orderNumber) {
            const searchPattern = `${prefix}-${datePrefix}-%`;
            const maxOrderResult = await client.query(
                `SELECT MAX(order_number) as max_val FROM orders 
                 WHERE order_number LIKE $1`,
                [searchPattern]
            );
            let orderCount = 1;
            if (maxOrderResult.rows[0]?.max_val) {
                const maxOrder = maxOrderResult.rows[0].max_val;
                const parts = maxOrder.split('-');
                const lastNum = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(lastNum)) {
                    orderCount = lastNum + 1;
                }
            }
            orderNumber = `${prefix}-${datePrefix}-${String(orderCount).padStart(3, '0')}`;
        }

        let orderResult;
        try {
            // Use a SAVEPOINT to handle potential column-missing errors without aborting the whole transaction
            await client.query('SAVEPOINT order_insert_probe');
            
            // Attempt to insert with geolocation, distance, and salesman_id columns
            orderResult = await client.query(
                `INSERT INTO orders (order_number, user_id, customer_name, customer_phone, customer_address, order_type, items, subtotal, tax, discount, delivery_location_id, delivery_charge, total_amount, payment_method, notes, table_number, order_status, payment_status, customer_lat, customer_lng, distance, financial_year_id, salesman_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
           RETURNING *`,
                [
                    orderNumber, validUserId, customer_name || 'Walk-in Customer', customer_phone || 'N/A', customer_address || null,
                    order_type || 'delivery', JSON.stringify(items), subtotal, tax || 0, discount || 0,
                    validLocationId, delivery_charge || 0, total_amount, payment_method,
                    notes || null, table_number || null, order_status || 'pending', payment_status || 'pending',
                    customer_lat || null, customer_lng || null, distance || null, financial_year_id, effectiveSalesmanId,
                ]
            );
            
            await client.query('RELEASE SAVEPOINT order_insert_probe');
        } catch (err: any) {
            // If columns don't exist (ERROR 42703), fallback to legacy insert
            if (err.code === '42703') {
                console.warn('⚠️ Orders table missing newer columns. Falling back to basic insert.');
                
                // Rollback to before the failed query to clear the transaction state
                await client.query('ROLLBACK TO SAVEPOINT order_insert_probe');
                
                try {
                    orderResult = await client.query(
                        `INSERT INTO orders (order_number, user_id, customer_name, customer_phone, customer_address, order_type, items, subtotal, tax, discount, delivery_location_id, delivery_charge, total_amount, payment_method, notes, table_number, order_status, payment_status, financial_year_id, salesman_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                   RETURNING *`,
                        [
                            orderNumber, validUserId, customer_name || 'Walk-in Customer', customer_phone || 'N/A', customer_address || null,
                            order_type || 'delivery', JSON.stringify(items), subtotal, tax || 0, discount || 0,
                            validLocationId, delivery_charge || 0, total_amount, payment_method,
                            notes || null, table_number || null, order_status || 'pending', payment_status || 'pending', financial_year_id, effectiveSalesmanId,
                        ]
                    );
                } catch (fallbackErr: any) {
                    if (fallbackErr.code === '42703') {
                        // Even salesman_id is missing, fallback without salesman_id
                        await client.query('ROLLBACK TO SAVEPOINT order_insert_probe');
                        orderResult = await client.query(
                            `INSERT INTO orders (order_number, user_id, customer_name, customer_phone, customer_address, order_type, items, subtotal, tax, discount, delivery_location_id, delivery_charge, total_amount, payment_method, notes, table_number, order_status, payment_status, financial_year_id)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                       RETURNING *`,
                            [
                                orderNumber, validUserId, customer_name || 'Walk-in Customer', customer_phone || 'N/A', customer_address || null,
                                order_type || 'delivery', JSON.stringify(items), subtotal, tax || 0, discount || 0,
                                validLocationId, delivery_charge || 0, total_amount, payment_method,
                                notes || null, table_number || null, order_status || 'pending', payment_status || 'pending', financial_year_id,
                            ]
                        );
                    } else {
                        throw fallbackErr;
                    }
                }
            } else {
                throw err;
            }
        }

        // Auto-generate invoice only if paid
        const order = orderResult.rows[0];
        let invoiceNumber = null;
        
        if (payment_status === 'paid') {
            let invoiceCount = 1;
            
            if (financial_year_id && fy_name) {
                const shortFy = fy_name.replace('20', ''); // 2024-25 -> 24-25
                const prefix = `INV/${shortFy}/`;
                const invoiceMaxResult = await client.query(
                    `SELECT MAX(invoice_number) as max_val FROM invoices 
                     WHERE invoice_number LIKE $1`, [`${prefix}%`]
                );
                
                if (invoiceMaxResult.rows[0].max_val) {
                    const maxInv = invoiceMaxResult.rows[0].max_val;
                    const lastNum = parseInt(maxInv.split('/').pop() || '0');
                    invoiceCount = lastNum + 1;
                }
                invoiceNumber = `${prefix}${String(invoiceCount).padStart(4, '0')}`;
            } else {
                // Fallback
                const invoiceDateStr = new Date().toISOString().split('T')[0];
                const invoiceDate = invoiceDateStr.replace(/-/g, '');
                const prefix = `INV-${invoiceDate}-`;
                const invoiceMaxResult = await client.query(
                    `SELECT MAX(invoice_number) as max_val FROM invoices 
                     WHERE invoice_number LIKE $1`, [`${prefix}%`]
                );
                
                if (invoiceMaxResult.rows[0].max_val) {
                    const maxInv = invoiceMaxResult.rows[0].max_val;
                    const lastNum = parseInt(maxInv.split('-').pop() || '0');
                    invoiceCount = lastNum + 1;
                }
                invoiceNumber = `${prefix}${String(invoiceCount).padStart(4, '0')}`;
            }

            try {
                await client.query('SAVEPOINT invoice_insert_probe');
                await client.query(
                    `INSERT INTO invoices (order_id, invoice_number, subtotal, tax, discount, total, delivery_charge, financial_year_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                     ON CONFLICT (invoice_number) DO NOTHING`,
                    [order.id, invoiceNumber, subtotal, tax || 0, discount || 0, total_amount, delivery_charge || 0, financial_year_id]
                );
                await client.query('RELEASE SAVEPOINT invoice_insert_probe');
            } catch (invErr) {
                await client.query('ROLLBACK TO SAVEPOINT invoice_insert_probe');
                console.warn('⚠️ Invoice insert skipped or warning:', invErr);
            }
        }

        // COMMIT TRANSACTION
        await client.query('COMMIT');
        await logAction(user_id || null, 'ORDER_CREATED', 'order', orderNumber, { total_amount, order_type });

        return NextResponse.json({
            success: true,
            data: { ...order, invoice_number: invoiceNumber },
        });
    } catch (error: any) {
        // ROLLBACK TRANSACTION on error
        await client.query('ROLLBACK');
        console.error('❌ Error creating order:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create order',
                details: error.message
            },
            { status: 500 }
        );
    } finally {
        // Release client back to pool
        client.release();
    }
}
