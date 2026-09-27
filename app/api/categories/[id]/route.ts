import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT update category
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, description, sort_order } = body;

        const result = await query(
            `UPDATE categories 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 sort_order = COALESCE($3, sort_order),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [name, description, sort_order, params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error updating category:', error);
        if ((error as any).code === '23505') {
            return NextResponse.json(
                { success: false, error: 'Category name already exists' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to update category' },
            { status: 500 }
        );
    }
}

// DELETE category
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            'DELETE FROM categories WHERE id = $1 RETURNING id',
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete category' },
            { status: 500 }
        );
    }
}
