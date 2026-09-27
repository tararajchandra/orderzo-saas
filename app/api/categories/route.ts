import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all categories
export async function GET() {
    try {
        const result = await query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
        return NextResponse.json({
            success: true,
            data: result.rows,
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

// POST create new category
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, sort_order } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            );
        }

        const result = await query(
            'INSERT INTO categories (name, description, sort_order) VALUES ($1, $2, $3) RETURNING *',
            [name, description, sort_order || 0]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
        });
    } catch (error) {
        console.error('Error creating category:', error);
        // Check for unique constraint violation
        if ((error as any).code === '23505') {
            return NextResponse.json(
                { success: false, error: 'Category already exists' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { success: false, error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
