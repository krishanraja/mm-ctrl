# Vercel Environment Variables Setup Guide

## Quick Setup Checklist

1. ✅ Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. ✅ Add the variables below for **all environments** (Production, Preview, Development)
3. ✅ Verify edge function secrets are set in Supabase Dashboard (not Vercel)
4. ✅ Redeploy after adding variables

---

## Required Environment Variables

### Frontend Variables (Vite - Exposed to Browser)

These variables are prefixed with `VITE_` and are bundled into your frontend code.

| Variable Name | Value | Required | Notes |
|---------------|-------|----------|-------|
| `VITE_SUPABASE_URL` | `https://bkyuxvschuwngtcdhsyg.supabase.co` | Optional* | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `[your-anon-key]` | Optional* | Get from Supabase Dashboard → Settings → API |

*Note: The frontend has fallback values in `src/integrations/supabase/client.ts`, but setting these in Vercel is **recommended for production** to ensure consistency.

### Application URLs (If Using Webhooks)

| Variable Name | Value | Required | Notes |
|---------------|-------|----------|-------|
| `APP_URL` | `https://your-domain.vercel.app` | Yes (if using webhooks) | Your production domain |
| `PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Optional | Fallback: `https://themindmaker.ai` |

---

## Edge Function Secrets (Supabase Dashboard)

**IMPORTANT**: Edge functions run on Supabase, NOT Vercel. These secrets must be set in the Supabase Dashboard.

### Location
Supabase Dashboard → Project Settings → Edge Functions → Secrets

### Required Secrets

| Variable Name | Description | Where Used |
|---------------|-------------|------------|
| `SUPABASE_URL` | `https://bkyuxvschuwngtcdhsyg.supabase.co` | All edge functions |
| `SUPABASE_ANON_KEY` | Anonymous/public key | Some edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | Most edge functions |
| `SUPABASE_DB_URL` | Database connection string | Some edge functions |
| `OPENAI_API_KEY` | OpenAI API key | AI functions |
| `GEMINI_API_KEY` | Gemini API key | AI functions |
| `GEMINI_SERVICE_ACCOUNT_KEY` | Service account JSON | Vertex AI functions |
| `RESEND_API_KEY` | Resend API key | Email functions |
| `SEND_CONFIRMATION_EMAIL_HOOK_SECRET` | Webhook secret | Email webhook |
| `STRIPE_SECRET_KEY` | Stripe secret key | Payment functions |
| `TOKEN_ENCRYPTION_KEY` | Encryption key (32 chars) | Google Sheets sync |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID | Google Sheets sync |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret | Google Sheets sync |
| `GOOGLE_OAUTH_CREDENTIALS` | OAuth credentials JSON | Google integrations |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Google Sheets ID | Google Sheets sync |

---

## Variables to Remove

- ❌ `LOVABLE_API_KEY` - No longer needed after migration from Lovable

---

## Step-by-Step Setup

### 1. Add Frontend Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://bkyuxvschuwngtcdhsyg.supabase.co`
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**
6. Repeat for `VITE_SUPABASE_ANON_KEY` (get value from Supabase Dashboard)

### 2. Add App URL (If Needed)

If you're using webhooks or need to reference your domain:

1. Add `APP_URL` with your production domain
2. Add `PUBLIC_SITE_URL` with your production domain
3. Select all environments

### 3. Verify Supabase Edge Function Secrets

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg)
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Verify all secrets listed above are present
4. If any are missing, add them from your original Supabase edge function secrets

### 4. Redeploy

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

---

## Verification

After deployment, verify:

1. ✅ Frontend loads without errors
2. ✅ Supabase connection works (check browser console)
3. ✅ Edge functions can be invoked (test a function call)
4. ✅ No environment variable errors in Vercel logs

---

## Troubleshooting

### "Environment variable not found"
- Ensure variable name is exactly correct (case-sensitive)
- Ensure it's added to the correct environment (Production/Preview/Development)
- Redeploy after adding variables

### "Supabase connection failed"
- Verify `VITE_SUPABASE_URL` matches your project ID
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Check browser console for specific error messages

### "Edge function authentication failed"
- Verify secrets are set in Supabase Dashboard (not Vercel)
- Check edge function logs in Supabase Dashboard

---

## Security Notes

- ✅ `VITE_*` variables are **public** - safe for browser exposure
- ✅ Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel - it's a secret
- ✅ Never add API keys with `VITE_` prefix - they'll be exposed to users
- ✅ Edge function secrets stay in Supabase Dashboard only







