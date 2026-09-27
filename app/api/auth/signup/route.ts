import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, phone, address } = body;

        if (!name || !email || !password || !phone) {
            return NextResponse.json(
                { success: false, error: 'Name, email, password, and phone are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rowCount && existingUser.rowCount > 0) {
            return NextResponse.json(
                { success: false, error: 'Email already registered' },
                { status: 400 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const result = await query(
            `INSERT INTO users (name, email, password_hash, phone, address, role) 
             VALUES ($1, $2, $3, $4, $5, 'customer') 
             RETURNING id, name, email, role, phone, address`,
            [name, email, passwordHash, phone, address || null]
        );

        const user = result.rows[0];

        // Generate a simple session token (in production use JWT)
        const token = Buffer.from(`${user.id}-${user.email}-${Date.now()}`).toString('base64');

        return NextResponse.json({
            success: true,
            data: {
                user,
                token
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create account' },
            { status: 500 }
        );
    }
}
