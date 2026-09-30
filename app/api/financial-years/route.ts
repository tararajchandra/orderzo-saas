import { NextResponse } from 'next/server';
import client from '@/lib/db';

export async function GET() {
    try {
        const result = await client.query('SELECT * FROM financial_years ORDER BY start_date DESC');
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        if (error.code === '42P01') {
            return NextResponse.json({ success: true, data: [] });
        }
        console.error('Error fetching financial years:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch financial years' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, start_date, end_date } = body;

        if (!name || !start_date || !end_date) {
            return NextResponse.json({ success: false, error: 'Name, start_date, and end_date are required' }, { status: 400 });
        }

        const result = await client.query(
            `INSERT INTO financial_years (name, start_date, end_date, is_active) 
             VALUES ($1, $2, $3, false) RETURNING *`,
            [name, start_date, end_date]
        );

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
        console.error('Error creating financial year:', error);
        if (error.code === '23505') {
            return NextResponse.json({ success: false, error: 'A Financial Year with this name already exists.' }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Failed to create financial year' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, is_active } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        if (is_active) {
            // Start transaction to deactivate others and activate the chosen one
            await client.query('BEGIN');
            await client.query('UPDATE financial_years SET is_active = false');
            const result = await client.query(
                'UPDATE financial_years SET is_active = true WHERE id = $1 RETURNING *',
                [id]
            );
            await client.query('COMMIT');
            return NextResponse.json({ success: true, data: result.rows[0] });
        }

        return NextResponse.json({ success: true, message: 'Nothing to update' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating financial year:', error);
        return NextResponse.json({ success: false, error: 'Failed to update financial year' }, { status: 500 });
    }
}
