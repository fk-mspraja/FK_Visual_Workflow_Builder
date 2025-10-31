# Google OAuth Setup for FourKites Workflow Builder

This guide will help you set up Google OAuth authentication for the workflow builder.

## Prerequisites
- Google Cloud Platform account
- Admin access to create OAuth credentials

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it "FourKites Workflow Builder" (or similar)

## Step 2: Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (for FourKites domain only)
3. Fill in the application details:
   - **App name**: FourKites Workflow Builder
   - **User support email**: your-email@fourkites.com
   - **Developer contact**: your-email@fourkites.com
4. Click **Save and Continue**
5. Skip **Scopes** (default scopes are sufficient)
6. Click **Save and Continue**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. **Name**: FourKites Workflow Builder
5. **Authorized JavaScript origins**:
   - `http://localhost:3003`
   - (Add production URL when deploying)
6. **Authorized redirect URIs**:
   - `http://localhost:3003/api/auth/callback/google`
   - (Add production callback URL when deploying)
7. Click **CREATE**
8. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   # Generate a random secret key
   AUTH_SECRET=your-secret-key-here

   # From Google Cloud Console
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here

   # App URL
   NEXTAUTH_URL=http://localhost:3003
   ```

3. Generate `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

## Step 6: Restart Development Server

```bash
npm run dev
```

## Step 7: Test Login

1. Open http://localhost:3003
2. You should be redirected to the login page
3. Click "Sign in with Google"
4. Sign in with your **@fourkites.com** email
5. You'll be redirected to the workflow builder

## Domain Restriction

The app is configured to **only allow @fourkites.com email addresses**.

If a user tries to log in with a non-FourKites email, they will see an "Access Denied" error message.

This is enforced in two places:
1. **OAuth configuration** (`hd: "fourkites.com"` parameter)
2. **SignIn callback** (checks `email.endsWith('@fourkites.com')`)

## Troubleshooting

### Error: "Invalid redirect_uri"
- Make sure the redirect URI in Google Cloud Console exactly matches:
  `http://localhost:3003/api/auth/callback/google`

### Error: "Access Denied"
- Only @fourkites.com emails are allowed
- Check that you're signing in with a FourKites account

### Error: "Configuration error"
- Verify all environment variables are set in `.env.local`
- Make sure `AUTH_SECRET` is generated
- Restart the dev server after changing `.env.local`

## Production Deployment

When deploying to production:

1. Add production URLs to Google Cloud Console:
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`

2. Update `.env.local` (or environment variables in your hosting platform):
   ```env
   NEXTAUTH_URL=https://your-domain.com
   ```

3. Keep `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` secret!

## Security Notes

- Never commit `.env.local` to version control
- The `.env.local.example` file is safe to commit (it contains no secrets)
- Rotate `AUTH_SECRET` periodically
- Use environment variables in production (not `.env.local` files)
