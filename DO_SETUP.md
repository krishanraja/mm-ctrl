# Execute Setup - Deep Context & Meeting Prep

## Quick Run

Run this command with your keys:

```powershell
# PowerShell
$env:STRIPE_SECRET_KEY="sk_live_..."
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
node scripts/setup-simple.js
```

Or on Linux/Mac:
```bash
STRIPE_SECRET_KEY=sk_live_... SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... node scripts/setup-simple.js
```

## What It Does

1. ✅ Creates Stripe prices ($29 Deep Context, $69 Bundle)
2. ✅ Creates Supabase storage bucket `documents`
3. ✅ Updates price IDs in `create-diagnostic-payment/index.ts` automatically

## Get Your Keys

- **STRIPE_SECRET_KEY**: https://dashboard.stripe.com/apikeys (use the Secret key, starts with `sk_live_` or `sk_test_`)
- **SUPABASE_SERVICE_ROLE_KEY**: https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/settings/api (scroll to "service_role" key)

## After Running

1. Run the storage policies SQL from `SETUP_INSTRUCTIONS.md` (section 2, Step 2)
2. Verify price IDs were updated in the code
3. Test the payment flow
