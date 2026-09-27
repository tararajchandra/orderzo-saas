import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        const result = await query(
            'SELECT image_data, image_type FROM menu_items WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0 || !result.rows[0].image_data) {
            return new NextResponse('Image not found', { status: 404 });
        }

        const { image_data, image_type } = result.rows[0];

        return new NextResponse(image_data, {
            headers: {
                'Content-Type': image_type || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error fetching image:', error);
        return new NextResponse('Error fetching image', { status: 500 });
    }
}
