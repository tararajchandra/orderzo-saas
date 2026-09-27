# Quick Fix: Google Sign-Up Not Working

## The Problem
Google OAuth credentials are missing from your environment variables.

## Quick Solution

### 1. Get Google Credentials (5 minutes)
1. Go to https://console.cloud.google.com/
2. Create/select a project
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Add redirect URI: `http://localhost:3000/api/auth/google/callback`
6. Copy the Client ID and Client Secret

### 2. Add to .env file
Open `.env` or `.env.local` and add:
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### 3. Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 4. Test
- Go to http://localhost:3000/signup
- Click "Sign up with Google"
- Should now redirect to Google login

## What Was Fixed
✅ Added error messages when Google OAuth is not configured
✅ Added loading states for better UX
✅ Updated both login and signup pages
✅ Added environment variable template

## Full Documentation
See `GOOGLE_OAUTH_SETUP.md` for detailed instructions.
