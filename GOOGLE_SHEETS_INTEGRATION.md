# Google Sheets Integration Status

## Current Implementation

The Google Sheets integration in `supabase/functions/sync-to-google-sheets/index.ts` is **mostly complete** with service account authentication.

### ✅ What's Working

1. **Service Account Authentication**
   - Uses `GOOGLE_OAUTH_CREDENTIALS` environment variable (JSON service account key)
   - Implements JWT-based OAuth 2.0 flow for server-to-server authentication
   - Requests `https://www.googleapis.com/auth/spreadsheets` scope
   - Token generation similar to Vertex AI implementation

2. **Fallback Mechanism**
   - Falls back to OAuth client credentials if service account not available
   - Gracefully handles missing credentials

3. **Data Formatting**
   - Formats booking data, analytics, and lead scores
   - Creates sync logs in database

### ⚠️ What Needs Attention

1. **Environment Variables**
   - Ensure `GOOGLE_OAUTH_CREDENTIALS` is set with valid service account JSON
   - Service account must have access to target Google Sheet
   - Share the Google Sheet with the service account email

2. **OAuth Client Flow** (if needed for user-initiated syncs)
   - Currently returns test token
   - Would need refresh token storage in database
   - Only needed if users need to authorize their own Google accounts

3. **Error Handling**
   - Currently uses test tokens on error
   - Should implement proper retry logic
   - Should log errors to monitoring system

## Setup Instructions

### 1. Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create a service account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Grant "Editor" role (or custom role with Sheets access)
   - Create and download JSON key

### 2. Share Google Sheet

1. Open your target Google Sheet
2. Click "Share" button
3. Add the service account email (from JSON key: `client_email`)
4. Grant "Editor" access

### 3. Set Environment Variable

In Supabase Dashboard → Edge Functions → Secrets:

```
GOOGLE_OAUTH_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important**: The entire JSON must be on a single line as a string value.

### 4. Set Spreadsheet ID

```
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-here
```

Find this in the Google Sheet URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

## Testing

1. Trigger sync via edge function:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/sync-to-google-sheets \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type": "booking", "data": {...}}'
   ```

2. Check sync logs in `google_sheets_sync_log` table
3. Verify data appears in Google Sheet

## Troubleshooting

### "Service account OAuth failed"
- Verify JSON is valid and properly escaped
- Check service account has Sheets API enabled
- Ensure service account email has access to the sheet

### "Permission denied"
- Share the Google Sheet with service account email
- Verify service account has correct permissions in Google Cloud

### "Invalid credentials"
- Check JSON format (must be single-line string)
- Verify all required fields present in service account JSON

## Future Enhancements

1. **Refresh Token Storage**: For user-initiated OAuth flows
2. **Retry Logic**: Automatic retry on transient failures
3. **Batch Operations**: More efficient for large datasets
4. **Incremental Sync**: Only sync changed records
5. **Webhook Integration**: Real-time sync on data changes
