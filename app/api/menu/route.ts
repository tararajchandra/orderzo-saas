import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all menu items
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const available = searchParams.get('available');

        let queryText = `
            SELECT 
                m.id, 
                m.name, 
                m.description, 
                m.category_id, 
                c.name as category_name,
                m.price, 
                m.gst_rate,
                CASE WHEN m.image_data IS NOT NULL THEN true ELSE false END as has_image,
                m.image_type, 
                m.available, 
                m.created_at, 
                m.updated_at
            FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramCount = 1;

        if (category) {
            queryText += ` AND m.category_id = $${paramCount}`;
            params.push(parseInt(category));
            paramCount++;
        }

        if (available !== null && available !== undefined) {
            queryText += ` AND m.available = $${paramCount}`;
            params.push(available === 'true');
            paramCount++;
        }

        queryText += ' ORDER BY c.sort_order, c.name, m.name';

        const result = await query(queryText, params);

        // Don't convert images to base64 here - too memory intensive
        // Instead, provide image URL endpoint for lazy loading
        const menuItems = result.rows.map(item => ({
            ...item,
            image_url: item.has_image ? `/api/menu/${item.id}/image` : null,
        }));

        return NextResponse.json({
            success: true,
            data: menuItems,
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch menu items' },
            { status: 500 }
        );
    }
}

// POST create new menu item (admin only)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, category_id, price, gst_rate, image_data, image_type, available } = body;

        if (!name || !category_id || !price) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate category_id exists
        const categoryCheck = await query(
            'SELECT id FROM categories WHERE id = $1',
            [category_id]
        );
        if (categoryCheck.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid category_id' },
                { status: 400 }
            );
        }

        // Convert base64 image to buffer if provided
        let imageBuffer = null;
        if (image_data && typeof image_data === 'string') {
            // Remove data URL prefix if present
            const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        }

        const result = await query(
            `INSERT INTO menu_items (name, description, category_id, price, gst_rate, image_data, image_type, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, description, category_id, price, gst_rate, image_type, available, created_at, updated_at`,
            [name, description, category_id, price, gst_rate || 5, imageBuffer, image_type, available ?? true]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error creating menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create menu item' },
            { status: 500 }
        );
    }
}
