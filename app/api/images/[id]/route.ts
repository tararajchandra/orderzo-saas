import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET image by ID
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const result = await query(
            'SELECT image_data, image_type FROM images WHERE id = $1',
            [params.id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Image not found' },
                { status: 404 }
            );
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
        return NextResponse.json(
            { success: false, error: 'Failed to fetch image' },
            { status: 500 }
        );
    }
}
