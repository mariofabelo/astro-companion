# OAuth Authentication Troubleshooting

## Current Error
```
GET /auth/callback?error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code
```

This error occurs when Supabase cannot exchange the Google OAuth authorization code for a session.

## Step-by-Step Debugging

### 1. Check Environment Variables
Make sure your `.env.local` file has the correct values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: The `NEXT_PUBLIC_SUPABASE_URL` should be your actual Supabase project URL, not a placeholder.

### 2. Verify Google OAuth Configuration in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Edit**
4. Ensure:
   - ✅ **Enabled** is checked
   - ✅ **Client ID** is filled (from Google Cloud Console)
   - ✅ **Client Secret** is filled (from Google Cloud Console)
   - ✅ **Redirect URL** is set to: `http://localhost:3000/auth/callback`

### 3. Check Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. Click **Edit**
6. Under **Authorized redirect URIs**, ensure you have:
   ```
   http://localhost:3000/auth/callback
   https://your-project.supabase.co/auth/v1/callback
   ```

### 4. Test Environment Variables

Add this temporary debug code to your login page to verify the environment variables are loaded:

```tsx
// Add this temporarily to the login page to debug
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
```

### 5. Common Issues and Solutions

#### Issue: "Unable to exchange external code"
**Solution**: This usually means the Google OAuth credentials in Supabase don't match your Google Cloud Console settings.

#### Issue: "Invalid redirect URI"
**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches what's configured in Supabase.

#### Issue: "Client ID not found"
**Solution**: Verify the Client ID in Supabase matches the one from Google Cloud Console.

### 6. Alternative: Use Supabase Auth UI

If the custom implementation continues to fail, you can temporarily use Supabase's built-in Auth UI:

```tsx
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

// Replace the button with this:
<Auth
  supabaseClient={supabase}
  appearance={{ theme: ThemeSupa }}
  providers={['google']}
  redirectTo={`${window.location.origin}/auth/callback`}
/>
```

### 7. Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Auth**
3. Look for recent authentication attempts
4. Check for any error messages related to your login attempts

### 8. Verify Project URL

Make sure you're using the correct Supabase project URL. It should look like:
```
https://abcdefghijklmnop.supabase.co
```

Not:
```
https://supabase.com/dashboard/project/...
```

## Quick Fix Checklist

- [ ] Environment variables are set correctly
- [ ] Google OAuth is enabled in Supabase
- [ ] Client ID and Secret are correct
- [ ] Redirect URIs match in both Google Cloud and Supabase
- [ ] You're using the correct Supabase project URL
- [ ] The app is running on `http://localhost:3000`

## Still Having Issues?

1. Try creating a new Google OAuth client
2. Double-check all URLs for typos
3. Ensure your Supabase project is active (not paused)
4. Check if there are any CORS issues in the browser console
