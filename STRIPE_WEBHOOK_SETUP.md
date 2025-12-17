# Stripe Webhook Setup Guide

## Overview

A new Stripe webhook handler has been created to replace polling-based payment verification. This provides real-time payment event handling directly from Stripe.

## Edge Function

**File**: `supabase/functions/stripe-webhook/index.ts`

**Configuration**: Public (no JWT required) - configured in `supabase/config.toml`

## Required Environment Variable

Add to Supabase Dashboard → Edge Functions → Secrets:

- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret

## Stripe Dashboard Setup

### 1. Create Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://bkyuxvschuwngtcdhsyg.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 2. Get Webhook Signing Secret

1. After creating the webhook, click on it
2. Find **Signing secret** section
3. Click **Reveal** to see the secret
4. Copy the secret (starts with `whsec_`)
5. Add it to Supabase Dashboard → Edge Functions → Secrets as `STRIPE_WEBHOOK_SECRET`

### 3. Test the Webhook

1. In Stripe Dashboard, go to your webhook endpoint
2. Click **Send test webhook**
3. Select `checkout.session.completed`
4. Click **Send test webhook**
5. Check Supabase edge function logs to verify it was received

## What the Webhook Does

### On Successful Payment (`checkout.session.completed`)

1. Extracts `assessment_id` from session metadata
2. Updates `leader_assessments` table:
   - Sets `has_full_diagnostic = true`
   - Updates `updated_at` timestamp
3. Logs conversion analytics event
4. Returns success to Stripe

### On Failed Payment

1. Logs failed payment event to analytics
2. Does not unlock assessment
3. Returns success to Stripe (to acknowledge receipt)

## Benefits Over Polling

- ✅ **Real-time**: Instant payment processing
- ✅ **Reliable**: Stripe retries failed webhooks automatically
- ✅ **Efficient**: No need to poll Stripe API
- ✅ **Comprehensive**: Handles all payment states (success, failure, async payments)

## Migration from Polling

The existing `verify-diagnostic-payment` function can still be used as a fallback, but webhooks are now the primary method. The frontend can continue to call `verify-diagnostic-payment` for immediate feedback, but the webhook ensures the assessment is unlocked even if the user closes the browser.

## Troubleshooting

### Webhook not receiving events

1. Verify webhook URL is correct in Stripe Dashboard
2. Check Supabase edge function logs
3. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
4. Test with Stripe's "Send test webhook" feature

### Signature verification failed

- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
- Check that the webhook endpoint URL matches exactly

### Assessment not unlocking

1. Check edge function logs for errors
2. Verify `assessment_id` is in session metadata when creating payment
3. Check database to see if `has_full_diagnostic` was updated
4. Verify the assessment ID exists in `leader_assessments` table
