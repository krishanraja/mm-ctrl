# Resend Webhook Setup Guide

## Overview

A Resend webhook handler has been created to track email events (sent, delivered, opened, clicked, bounced, complained) and store analytics in Supabase.

## Edge Function

**File**: `supabase/functions/resend-webhook/index.ts`

**Configuration**: Public (no JWT required) - configured in `supabase/config.toml`

## Resend Dashboard Setup

### 1. Create Webhook Endpoint

1. Go to [Resend Dashboard](https://resend.com/webhooks)
2. Click **Add webhook**
3. Enter endpoint URL:
   ```
   https://bkyuxvschuwngtcdhsyg.supabase.co/functions/v1/resend-webhook
   ```
4. Select events to listen for:
   - ✅ `email.sent`
   - ✅ `email.delivered`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.complained`
   - ✅ `email.unsubscribed`

### 2. Test the Webhook

1. In Resend Dashboard, go to your webhook endpoint
2. Click **Send test event**
3. Select an event type (e.g., `email.opened`)
4. Click **Send test event**
5. Check Supabase edge function logs to verify it was received
6. Check `email_analytics` table in Supabase to verify data was stored

## What the Webhook Does

### Event Tracking

The webhook receives Resend events and stores them in the `email_analytics` table:

- **sent**: Email was sent
- **delivered**: Email was delivered to recipient
- **opened**: Recipient opened the email
- **clicked**: Recipient clicked a link in the email
- **bounced**: Email bounced (hard or soft)
- **complained**: Recipient marked email as spam
- **unsubscribed**: Recipient unsubscribed

### Data Stored

For each event, the following data is stored:

- Email ID (Resend email ID)
- Recipient email
- Email type (confirmation, booking, diagnostic, etc.)
- Subject
- Event type
- Event timestamp
- Click URL (for clicked events)
- Bounce/complaint details (if applicable)
- User ID (if user exists)
- Session ID (if provided in metadata)
- Assessment ID (if provided in metadata)
- Additional metadata

## Using Email Tracking

### When Sending Emails

Include metadata in your email sending code:

```typescript
import { sendEmail } from '../_shared/email-utils.ts';

const result = await sendEmail({
  from: 'MindMaker <noreply@themindmaker.ai>',
  to: user.email,
  subject: 'Your Assessment Results',
  html: emailHtml,
  emailType: 'diagnostic', // Required for tracking
  metadata: {
    user_id: userId,
    session_id: sessionId,
    assessment_id: assessmentId,
  },
});
```

### Querying Email Analytics

Use the `get_email_statistics` function:

```sql
-- Get statistics for all emails
SELECT * FROM get_email_statistics();

-- Get statistics for diagnostic emails
SELECT * FROM get_email_statistics('diagnostic');

-- Get statistics for a date range
SELECT * FROM get_email_statistics(
  NULL,
  '2025-01-01'::timestamp,
  '2025-01-31'::timestamp
);
```

### Viewing Analytics in Code

```typescript
const { data, error } = await supabase
  .from('email_analytics')
  .select('*')
  .eq('email_type', 'diagnostic')
  .eq('event_type', 'opened')
  .order('event_timestamp', { ascending: false });
```

## Benefits

- ✅ **Real-time Tracking**: Instant updates when emails are opened/clicked
- ✅ **Comprehensive Analytics**: Track all email engagement metrics
- ✅ **User Linking**: Automatically links events to users when possible
- ✅ **Conversion Tracking**: Link email opens/clicks to assessments and sessions
- ✅ **Bounce Management**: Track and handle bounces automatically

## Troubleshooting

### Webhook not receiving events

1. Verify webhook URL is correct in Resend Dashboard
2. Check Supabase edge function logs
3. Test with Resend's "Send test event" feature
4. Verify webhook is enabled in Resend Dashboard

### Events not being stored

1. Check edge function logs for errors
2. Verify `email_analytics` table exists
3. Check that required fields (email_id, recipient_email) are present
4. Verify service role key has permissions

### Missing user_id in analytics

- User ID is automatically looked up by email
- If user doesn't exist, user_id will be null
- You can manually provide user_id in metadata when sending







