# Quick Setup Guide - Deep Context & Meeting Prep

## Prerequisites

You need:
- `STRIPE_SECRET_KEY` (from Stripe Dashboard → API Keys)
- `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API → service_role key)

## Option 1: Automated Setup (Recommended)

Run this script with your keys:

```bash
# Windows PowerShell
$env:STRIPE_SECRET_KEY="sk_live_..."
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
deno run --allow-env --allow-net --allow-read --allow-write scripts/setup-complete.ts
```

Or on Linux/Mac:
```bash
STRIPE_SECRET_KEY=sk_live_... SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... deno run --allow-env --allow-net --allow-read --allow-write scripts/setup-complete.ts
```

This will:
1. ✅ Create Stripe prices ($29 Deep Context, $69 Bundle)
2. ✅ Create Supabase storage bucket `documents`
3. ✅ Update price IDs in code automatically

## Option 2: Manual Setup

### Step 1: Create Stripe Prices

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **Add product**

**Deep Context:**
- Name: `Deep Context Upgrade`
- Price: `$29.00 USD` (one-time)
- Copy the Price ID

**Bundle:**
- Name: `Full Diagnostic + Deep Context Bundle`
- Price: `$69.00 USD` (one-time)
- Copy the Price ID

3. Update `supabase/functions/create-diagnostic-payment/index.ts`:
```typescript
const DEEP_CONTEXT_PRICE_ID = "price_YOUR_ID_HERE";
const BUNDLE_PRICE_ID = "price_YOUR_ID_HERE";
```

### Step 2: Create Storage Bucket

1. Go to [Supabase Dashboard → Storage](https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/storage/buckets)
2. Click **New bucket**
3. Name: `documents`
4. Public: ❌ (unchecked)
5. File size limit: `50 MB`
6. Allowed MIME types: `application/pdf`

### Step 3: Set Storage Policies

Run this SQL in Supabase SQL Editor (see SETUP_INSTRUCTIONS.md section 2, Step 2)

## Option 3: Deploy Edge Function First

If you prefer to use the edge function:

1. Deploy the function:
```bash
supabase functions deploy create-stripe-prices
```

2. Call it:
```bash
curl -X POST "https://bkyuxvschuwngtcdhsyg.supabase.co/functions/v1/create-stripe-prices" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

3. Then run the storage bucket creation part of `setup-complete.ts`
