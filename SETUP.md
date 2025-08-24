# Astro Research Companion - Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Google OAuth Setup

1. **In Supabase Dashboard:**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials (Client ID and Client Secret)
   - Set the redirect URL to: `http://localhost:3000/auth/callback`

2. **In Google Cloud Console:**
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback` (for production)

## Running the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000

## Features Implemented

- ✅ Google OAuth authentication
- ✅ Protected routes with AuthGate
- ✅ Sign out functionality
- ✅ Auth callback handling
- ✅ Error handling for auth failures
- ✅ Responsive login page with Google button
- ✅ Modern UI with Tailwind CSS

## Next Steps

1. Configure your environment variables
2. Set up Google OAuth in Supabase
3. Test the authentication flow
4. Start building the PDF upload and RAG features
