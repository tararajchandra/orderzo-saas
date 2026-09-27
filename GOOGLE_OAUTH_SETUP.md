# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Ruchi application.

## Problem
The "Sign up with Google" and "Sign in with Google" buttons are not working because Google OAuth credentials are not configured in your environment variables.

## Solution

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Either select an existing project or click "New Project"
   - Give your project a name (e.g., "Ruchi Restaurant App")
   - Click "Create"

3. **Enable Google+ API**
   - In the left sidebar, go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click on it and press "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" user type (unless you have a Google Workspace)
   - Click "Create"
   - Fill in the required fields:
     - **App name**: Ruchi Restaurant
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click "Save and Continue"
   - On the Scopes page, click "Save and Continue" (default scopes are fine)
   - On the Test users page, add your email as a test user
   - Click "Save and Continue"

5. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application" as the application type
   - Give it a name (e.g., "Ruchi Web Client")
   - Under "Authorized redirect URIs", add:
     - For local development: `http://localhost:3000/api/auth/google/callback`
     - For production: `https://yourdomain.com/api/auth/google/callback`
   - Click "Create"
   - **IMPORTANT**: Copy the **Client ID** and **Client Secret** that appear

### Step 2: Configure Environment Variables

1. **Open your `.env` or `.env.local` file** in the project root
   
2. **Add the following lines** (replace with your actual credentials):
   ```env
   GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
   ```

3. **Save the file**

### Step 3: Restart Your Development Server

1. **Stop the current server** (press `Ctrl+C` in the terminal)

2. **Start the server again**:
   ```bash
   npm run dev
   ```

### Step 4: Test Google Sign-In

1. Navigate to the signup page: `http://localhost:3000/signup`
2. Click "Sign up with Google"
3. You should be redirected to Google's login page
4. After signing in, you'll be redirected back to your app and logged in

## What Changed

### Improved Error Handling
- Both login and signup pages now show clear error messages if Google OAuth is not configured
- Loading states are displayed when connecting to Google
- Better user feedback throughout the authentication process

### Files Modified
1. **`.env.example`** - Added Google OAuth environment variables template
2. **`app/signup/page.tsx`** - Added error handling and loading state for Google sign-up
3. **`app/login/page.tsx`** - Added error handling and loading state for Google sign-in

## Troubleshooting

### Error: "Google Client ID not configured"
- Make sure you've added `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env` file
- Restart your development server after adding the variables

### Error: "redirect_uri_mismatch"
- The redirect URI in Google Cloud Console must exactly match: `http://localhost:3000/api/auth/google/callback`
- Make sure there are no trailing slashes or typos

### Error: "Access blocked: This app's request is invalid"
- Make sure you've configured the OAuth consent screen
- Add your email as a test user in the OAuth consent screen settings

### Users can't sign in (app is in testing mode)
- In Google Cloud Console, go to "OAuth consent screen"
- Add users to the "Test users" list
- Or publish your app (requires verification for production use)

## Production Deployment

When deploying to production:

1. Add your production domain's redirect URI to Google Cloud Console:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

2. Update your production environment variables:
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

3. If you want to allow any user to sign in (not just test users), you'll need to:
   - Complete the OAuth consent screen verification process
   - Publish your app in Google Cloud Console

## Security Notes

- **Never commit** your `.env` file to version control
- Keep your `GOOGLE_CLIENT_SECRET` secure
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Use different OAuth credentials for development and production environments

## Need Help?

If you're still experiencing issues:
1. Check the browser console for error messages
2. Check the terminal/server logs for backend errors
3. Verify all environment variables are set correctly
4. Make sure your Google Cloud project has the Google+ API enabled
