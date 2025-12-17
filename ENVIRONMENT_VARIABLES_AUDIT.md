# Environment Variables Audit

## Supabase Edge Function Secrets

All edge functions run on Supabase and require these secrets to be set in the Supabase Dashboard.

### Required Secrets Checklist

#### Core Supabase Configuration
- [x] `SUPABASE_URL` - Must be `https://bkyuxvschuwngtcdhsyg.supabase.co`
- [x] `SUPABASE_ANON_KEY` - Anon/public key for client operations
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS, use carefully)
- [x] `SUPABASE_DB_URL` - Direct database connection string (if needed)

#### Email Service (Resend)
- [x] `RESEND_API_KEY` - Used by:
  - `send-booking-notification`
  - `send-diagnostic-email`
  - `send-confirmation-email`
  - `send-advisory-sprint-notification`
  - `send-weekly-checkin-reminder`

#### AI Services
- [x] `OPENAI_API_KEY` - Used by `ai-generate` (fallback after Gemini)
- [x] `GEMINI_API_KEY` - Used by `ai-generate` (if direct API access needed)
- [x] `GEMINI_SERVICE_ACCOUNT_KEY` - JSON service account for Vertex AI (used by `ai-generate`)

#### Google Services
- [x] `GOOGLE_OAUTH_CLIENT_ID` - Used by `sync-to-google-sheets`
- [x] `GOOGLE_OAUTH_CLIENT_SECRET` - Used by `sync-to-google-sheets`
- [x] `GOOGLE_OAUTH_CREDENTIALS` - Used by `sync-to-google-sheets`
- [x] `GOOGLE_SHEETS_SPREADSHEET_ID` - Target spreadsheet for syncing

#### Payment Processing
- [x] `STRIPE_SECRET_KEY` - Used by:
  - `create-diagnostic-payment`
  - `verify-diagnostic-payment`

#### Security & Encryption
- [x] `TOKEN_ENCRYPTION_KEY` - Used by `sync-to-google-sheets` for encrypting OAuth tokens
- [x] `SEND_CONFIRMATION_EMAIL_HOOK_SECRET` - Webhook secret for email confirmation

#### Application Configuration
- [ ] `APP_URL` - **RECOMMENDED**: Set to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
  - Currently functions use `req.headers.get("origin")` as fallback
  - Setting `APP_URL` provides a reliable fallback for email links and redirects
- [ ] `PUBLIC_SITE_URL` - Alternative name used in some functions (check `send-weekly-checkin-reminder`)

#### Deprecated/Unused
- [ ] `LOVABLE_API_KEY` - **CAN BE REMOVED**: Not found in main codebase (only in `sev` subdirectory)

## Vercel Frontend Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### Required
- [x] `VITE_SUPABASE_URL` - Must be `https://bkyuxvschuwngtcdhsyg.supabase.co`
- [x] `VITE_SUPABASE_ANON_KEY` - Public anon key (safe to expose)

**Note**: These are public variables that will be bundled into the frontend code. They are safe to expose.

## Verification Steps

1. **Supabase Dashboard**:
   - Go to Project Settings → Edge Functions → Secrets
   - Verify all required secrets are present
   - Check that `SUPABASE_URL` matches project ID: `bkyuxvschuwngtcdhsyg`

2. **Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - Ensure they're set for all environments (Production, Preview, Development)

3. **Test Deployment**:
   - Deploy to Vercel
   - Check browser console for database validation message
   - Test edge function calls
   - Verify authentication works

## Migration Notes

When moving from Lovable to Vercel:
- Edge function secrets remain in Supabase (they don't move to Vercel)
- Only frontend environment variables go to Vercel
- Update `APP_URL` in Supabase secrets to point to Vercel domain
- Remove `LOVABLE_API_KEY` if not needed
