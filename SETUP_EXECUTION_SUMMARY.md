# Setup Execution Summary

## ✅ Completed

1. **Database Migration (#4)** - You've already run this ✅

2. **Scripts Created**:
   - `scripts/setup-simple.js` - Node.js script (uses fetch, no extra deps)
   - `scripts/setup-complete.js` - Node.js script (uses Stripe SDK)
   - `scripts/setup-complete.ts` - Deno script
   - `scripts/setup-complete.ps1` - PowerShell script
   - `supabase/functions/create-stripe-prices/index.ts` - Edge function (needs deployment)

## 🚀 To Execute #1 and #2

### Option A: Run Node.js Script (Easiest)

```powershell
# Set your keys
$env:STRIPE_SECRET_KEY="sk_live_YOUR_KEY"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGc...YOUR_SERVICE_ROLE_KEY"

# Run the script
node scripts/setup-simple.js
```

**Get your keys:**
- Stripe: https://dashboard.stripe.com/apikeys → Secret key
- Supabase: https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/settings/api → service_role key

### Option B: Deploy Edge Function First

1. Deploy the edge function:
```bash
supabase functions deploy create-stripe-prices
```

2. Call it:
```powershell
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreXV4dnNjaHV3bmd0Y2Roc3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDE2NzgsImV4cCI6MjA2NzU3NzY3OH0.XmOP_W7gUdBuP23p4lH-iryMXPXMI69ZshU8Dwm6ujo"
    "Content-Type" = "application/json"
}
$response = Invoke-WebRequest -Uri "https://bkyuxvschuwngtcdhsyg.supabase.co/functions/v1/create-stripe-prices" -Method POST -Headers $headers
$response.Content
```

3. Then create storage bucket separately using the Supabase client or dashboard

## 📋 What the Scripts Do

1. **Create Stripe Prices**:
   - "Deep Context Upgrade" product → $29 price
   - "Full Diagnostic + Deep Context Bundle" product → $69 price
   - Returns price IDs

2. **Create Storage Bucket**:
   - Creates `documents` bucket (private, 50MB limit, PDF only)

3. **Update Code**:
   - Automatically updates `DEEP_CONTEXT_PRICE_ID` and `BUNDLE_PRICE_ID` in `create-diagnostic-payment/index.ts`

## 📝 Remaining Steps

After running the script:

1. **Storage Policies** - Run the SQL from `SETUP_INSTRUCTIONS.md` section 2, Step 2
2. **Verify** - Check that price IDs were updated correctly
3. **Test** - Test the payment flow

## Files Created

- `scripts/setup-simple.js` - Main setup script (Node.js, no deps)
- `scripts/setup-complete.js` - Alternative (uses Stripe SDK)
- `scripts/setup-complete.ts` - Deno version
- `scripts/setup-complete.ps1` - PowerShell version
- `supabase/functions/create-stripe-prices/index.ts` - Edge function
- `QUICK_SETUP.md` - Quick reference
- `DO_SETUP.md` - Execution instructions
- `MIGRATION_SQL.sql` - Database migration (already run ✅)
