import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET single menu item
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            `SELECT DISTINCT ON (m.id)
                m.id, 
                m.name, 
                m.description, 
                m.category_id, 
                c.name as category_name,
                m.price, 
                m.gst_rate,
                m.image_type, 
                m.available, 
                m.created_at, 
                m.updated_at,
                i.id as image_id
            FROM menu_items m
            LEFT JOIN categories c ON m.category_id = c.id
            LEFT JOIN images i ON m.image_data = i.image_data AND m.image_type = i.image_type
            WHERE m.id = $1
            ORDER BY m.id, i.id DESC`,
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Menu item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error fetching menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch menu item' },
            { status: 500 }
        );
    }
}

// PUT update menu item (admin only)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, description, category_id, price, gst_rate, image_data, image_type, available } = body;

        // Validate category_id if provided
        if (category_id !== undefined && category_id !== null) {
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
        }

        // Handle image data if provided (base64 -> buffer)
        let imageBuffer: Buffer | null | undefined = undefined;
        let imageTypeToUse = image_type;

        if (image_data && typeof image_data === 'string') {
            // New image provided - convert base64 to buffer
            const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (image_data === null) {
            // Explicit null to remove image
            imageBuffer = null;
            imageTypeToUse = null;
        }
        // If image_data is undefined, we don't update the image (keep existing)

        // Build dynamic query based on what fields are provided
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }
        if (category_id !== undefined) {
            updates.push(`category_id = $${paramCount}`);
            values.push(category_id);
            paramCount++;
        }
        if (price !== undefined) {
            updates.push(`price = $${paramCount}`);
            values.push(price);
            paramCount++;
        }
        if (gst_rate !== undefined) {
            updates.push(`gst_rate = $${paramCount}`);
            values.push(gst_rate);
            paramCount++;
        }
        if (imageBuffer !== undefined) {
            updates.push(`image_data = $${paramCount}`);
            values.push(imageBuffer);
            paramCount++;
        }
        if (imageTypeToUse !== undefined && imageBuffer !== undefined) {
            updates.push(`image_type = $${paramCount}`);
            values.push(imageTypeToUse);
            paramCount++;
        }
        if (available !== undefined) {
            updates.push(`available = $${paramCount}`);
            values.push(available);
            paramCount++;
        }

        // Always update the timestamp
        updates.push('updated_at = CURRENT_TIMESTAMP');

        // Add the ID parameter
        values.push(params.id);

        const result = await query(
            `UPDATE menu_items 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, description, category_id, price, gst_rate, image_type, available, created_at, updated_at`,
            values
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Menu item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update menu item' },
            { status: 500 }
        );
    }
}

// DELETE menu item (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            'DELETE FROM menu_items WHERE id = $1 RETURNING id',
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Menu item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete menu item' },
            { status: 500 }
        );
    }
}
