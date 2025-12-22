# Vercel Deployment Setup Guide

## Environment Variables Configuration

### Step 1: Set Frontend Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **all environments** (Production, Preview, Development):

```
VITE_SUPABASE_URL=https://bkyuxvschuwngtcdhsyg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_DDv1GyxEG09utDLjdWWz1A_JN-Z9eTp
```

**Important Notes:**
- These are **public** variables (safe to expose in client-side code)
- The `VITE_` prefix is required for Vite to expose them to the frontend
- The code in `src/integrations/supabase/client.ts` has fallback values, but Vercel env vars will take precedence
- Set these for **all environments** to ensure consistency

### Step 2: Verify Edge Function Secrets in Supabase

**Location**: Supabase Dashboard → Project Settings → Edge Functions → Secrets

**Critical**: Edge functions run on Supabase, NOT Vercel. These must remain in Supabase:

**Core Supabase Secrets:**
```
SUPABASE_URL=https://bkyuxvschuwngtcdhsyg.supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
SUPABASE_DB_URL=[your-db-connection-string]
```

**API Integration Secrets:**
```
RESEND_API_KEY=[your-resend-key]
OPENAI_API_KEY=[your-openai-key]
GEMINI_API_KEY=[your-gemini-key]
GEMINI_SERVICE_ACCOUNT_KEY=[your-service-account-json]
GOOGLE_OAUTH_CLIENT_ID=[your-google-client-id]
GOOGLE_OAUTH_CLIENT_SECRET=[your-google-client-secret]
GOOGLE_OAUTH_CREDENTIALS=[your-google-credentials]
GOOGLE_SHEETS_SPREADSHEET_ID=[your-spreadsheet-id]
STRIPE_SECRET_KEY=[your-stripe-secret]
TOKEN_ENCRYPTION_KEY=[your-encryption-key]
SEND_CONFIRMATION_EMAIL_HOOK_SECRET=[your-webhook-secret]
APP_URL=https://your-vercel-domain.vercel.app
```

**Important**: 
- Update `APP_URL` to point to your Vercel deployment URL
- `LOVABLE_API_KEY` can be removed if no longer needed

### Step 3: Verification

After deployment:

1. **Check Browser Console**:
   - Look for: `✅ Database validated: Using Mindmaker AI (bkyuxvschuwngtcdhsyg)`
   - No errors about missing Supabase URL or key

2. **Test Edge Functions**:
   - Complete an assessment to verify edge functions are called correctly
   - Check Supabase dashboard logs for any errors

3. **Test Authentication**:
   - Sign up/login should work correctly
   - User sessions should persist

## Deployment Checklist

- [ ] Vercel environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Supabase edge function secrets verified
- [ ] APP_URL updated in Supabase secrets to Vercel domain
- [ ] Frontend deployed to Vercel
- [ ] Browser console shows correct database validation
- [ ] Edge functions accessible from frontend
- [ ] Authentication flow works
- [ ] Assessment creation works
- [ ] Payment flow works

## Troubleshooting

### Environment Variables Not Loading
- Ensure variables start with `VITE_` prefix
- Redeploy after adding variables
- Check Vercel build logs for variable injection

### Edge Functions Not Working
- Verify secrets are set in Supabase dashboard (not Vercel)
- Check Supabase edge function logs
- Verify CORS headers are correct

### Database Connection Issues
- Verify SUPABASE_URL matches project ID: `bkyuxvschuwngtcdhsyg`
- Check that anon key is correct format
- Ensure RLS policies allow access if needed


