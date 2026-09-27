import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/login?error=Google auth failed', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=No code provided', request.url));
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            console.error('Failed to get tokens:', tokens);
            return NextResponse.redirect(new URL('/login?error=Failed to get tokens', request.url));
        }

        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();

        // Check if user exists
        let result = await query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleUser.id, googleUser.email]);
        let user = result.rows[0];

        if (user) {
            // Update google_id if missing (e.g. existing email user logging in with Google)
            if (!user.google_id) {
                await query('UPDATE users SET google_id = $1 WHERE id = $2', [googleUser.id, user.id]);
                user.google_id = googleUser.id;
            }
        } else {
            // Create new user
            result = await query(
                `INSERT INTO users (name, email, google_id, role) 
                 VALUES ($1, $2, $3, 'customer') 
                 RETURNING *`,
                [googleUser.name, googleUser.email, googleUser.id]
            );
            user = result.rows[0];
        }

        // Generate session token
        const token = Buffer.from(`${user.id}-${user.email}-${Date.now()}`).toString('base64');

        // Redirect to frontend with token
        // We need to pass the token to the client. 
        // A common way is to redirect to a page that reads the token from URL and saves it.
        // Or set a cookie. But our AuthContext reads from localStorage.
        // So we'll redirect to a special route /auth/callback that handles this.

        const callbackUrl = new URL('/auth/callback', request.url);
        callbackUrl.searchParams.set('token', token);
        callbackUrl.searchParams.set('user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address
        }));

        return NextResponse.redirect(callbackUrl);

    } catch (error) {
        console.error('Google auth error:', error);
        return NextResponse.redirect(new URL('/login?error=Authentication failed', request.url));
    }
}
