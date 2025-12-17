# Row Level Security (RLS) Audit Report

## Summary

This audit reviews all database tables to ensure proper Row Level Security (RLS) policies are in place for data protection.

## Tables with RLS Enabled

### ✅ Assessment Tables (Public Read Access)
These tables have RLS enabled with public read access (anyone with assessment ID can read):

- `leader_assessments` - ✅ RLS enabled, public read
- `leader_dimension_scores` - ✅ RLS enabled, public read
- `leader_risk_signals` - ✅ RLS enabled, public read
- `leader_tensions` - ✅ RLS enabled, public read
- `leader_org_scenarios` - ✅ RLS enabled, public read
- `leader_first_moves` - ✅ RLS enabled, public read
- `leader_prompt_sets` - ✅ RLS enabled, public read

**Note**: Public read access is intentional - assessment data is shareable via assessment ID. However, **INSERT/UPDATE/DELETE policies are missing** and should be restricted to service role or assessment owners.

### ✅ User-Specific Tables (User-Based Access)
These tables have RLS enabled with user-based access control:

- `conversation_sessions` - ✅ RLS enabled, users can only access their own
- `chat_messages` - ✅ RLS enabled, users can only access their session messages
- `ai_conversations` - ✅ RLS enabled, users can only access their own
- `user_business_context` - ✅ RLS enabled
- `security_audit_log` - ✅ RLS enabled
- `assessment_events` - ✅ RLS enabled, users can view their own
- `assessment_behavioral_adjustments` - ✅ RLS enabled, users can view their own
- `assessment_questions` - ✅ RLS enabled, public read for active questions

### ✅ Service-Only Tables
These tables have RLS enabled with service role only access:

- `company_identifier_salt` - ✅ RLS enabled, service role only (all operations blocked for public)

### ⚠️ Tables Needing RLS Review

The following tables may need RLS policies added:

1. **`leaders`** - User profile table
   - **Recommendation**: Enable RLS, allow users to read/update their own profile
   - **Risk**: Medium - contains user PII

2. **`leader_insights`** - AI-generated insights
   - **Recommendation**: Enable RLS, public read (like other assessment tables)
   - **Risk**: Low - already public via assessment ID

3. **`booking_requests`** - Booking request records
   - **Status**: Has RLS policies (from migration 20250917221944)
   - **Recommendation**: Verify policies are correct

4. **`google_sheets_sync_log`** - Sync operation logs
   - **Recommendation**: Enable RLS, service role only or user-specific
   - **Risk**: Low - operational data

5. **`index_participant_data`** - Anonymized index data
   - **Status**: Should have RLS (check migration 20251108164332)
   - **Recommendation**: Verify policies restrict access appropriately

## Security Recommendations

### High Priority

1. **Add INSERT/UPDATE/DELETE policies for assessment tables**
   - Currently only SELECT is public
   - Restrict INSERT/UPDATE/DELETE to service role or assessment owners
   - Prevents unauthorized modification of assessment data

2. **Enable RLS on `leaders` table**
   - Contains user PII (email, name, company)
   - Users should only access their own profile
   - Service role can access all for operations

3. **Review and restrict `leader_insights` table**
   - Enable RLS if not already enabled
   - Apply same public read policy as other assessment tables

### Medium Priority

4. **Audit service role usage**
   - Ensure service role key is only used in edge functions
   - Never expose service role key to frontend
   - Verify edge functions use service role appropriately

5. **Add RLS to operational tables**
   - `google_sheets_sync_log` - Service role only
   - Other logging/audit tables - Appropriate access control

### Low Priority

6. **Review public read policies**
   - Consider if assessment data should be truly public
   - May want to add optional authentication requirement
   - Consider adding rate limiting for public access

## Migration Needed

Create a new migration to:
1. Enable RLS on `leaders` table
2. Add INSERT/UPDATE/DELETE policies to assessment tables
3. Enable RLS on `leader_insights` if not already enabled
4. Add RLS to `google_sheets_sync_log` and other operational tables

## Current RLS Policy Status

| Table | RLS Enabled | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy | Status |
|-------|-------------|---------------|---------------|---------------|---------------|--------|
| leader_assessments | ✅ | Public | ❌ Missing | ❌ Missing | ❌ Missing | ⚠️ Needs policies |
| leader_dimension_scores | ✅ | Public | ❌ Missing | ❌ Missing | ❌ Missing | ⚠️ Needs policies |
| leader_risk_signals | ✅ | Public | ❌ Missing | ❌ Missing | ❌ Missing | ⚠️ Needs policies |
| leader_tensions | ✅ | Public | ❌ Missing | ❌ Missing | ❌ Missing | ⚠️ Needs policies |
| leader_org_scenarios | ✅ | Public | ❌ Missing | ❌ Missing | ❌ Missing | ⚠️ Needs policies |
| leader_first_moves | ✅ | Public | ❌ Missing | ❌ Missing | ❌ Missing | ⚠️ Needs policies |
| leader_prompt_sets | ✅ | Public | ❌ Missing | ❌ Missing | ❌ Missing | ⚠️ Needs policies |
| leaders | ❌ | N/A | N/A | N/A | N/A | 🔴 **CRITICAL: Enable RLS** |
| leader_insights | ❓ | Unknown | Unknown | Unknown | Unknown | ⚠️ Needs audit |
| conversation_sessions | ✅ | User-based | User-based | User-based | ❌ Missing | ✅ Mostly secure |
| chat_messages | ✅ | User-based | User-based | ❌ Missing | ❌ Missing | ✅ Mostly secure |
| assessment_events | ✅ | User-based | Service | ❌ Missing | ❌ Missing | ✅ Mostly secure |
| company_identifier_salt | ✅ | Service only | Service only | Service only | Service only | ✅ Secure |

## Next Steps

1. Create migration to add missing RLS policies
2. Test RLS policies with authenticated and unauthenticated users
3. Verify service role can still perform necessary operations
4. Document any exceptions or special cases
