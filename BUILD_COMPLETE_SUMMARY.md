# Build Complete Summary

## ✅ Completed Tasks

### 1. Node.js Version Pinning
- **Created `.nvmrc`** with Node.js version `22` to ensure consistent local development environment
- Addresses Rollup build issues on Windows

### 2. Baseline RLS Security Fix
- **Migration**: `20251216200000_fix_baseline_rls_owner_user_id.sql`
  - Added `owner_user_id` column to `leader_assessments` table
  - Updated RLS policies to restrict access to `auth.uid()` only
  - Maintains backward compatibility with legacy `session_id`-based access
  - Updated all related tables (dimension_scores, risk_signals, tensions, org_scenarios, first_moves, prompt_sets) with secure RLS policies

- **Updated `create-leader-assessment` edge function**:
  - Now extracts `auth.uid()` from Authorization header
  - Sets `owner_user_id` when creating assessments
  - Handles empty/invalid emails by generating pseudo-email for anonymous users (`anon+{userId}@anon.local`)
  - Ensures all baseline data is properly scoped to authenticated users (including anonymous)

### 3. Weekly Action Generation
- **Edge Function**: `get-or-generate-weekly-action`
  - Checks for existing weekly action, generates if missing
  - Uses Lovable AI Gateway (Gemini 2.5 Flash) with deterministic fallback
  - Accepts baseline context for personalized actions
  - Returns one actionable item per week

- **Updated `Today.tsx`**:
  - Now calls `get-or-generate-weekly-action` edge function instead of direct DB query
  - Passes baseline context for better action generation
  - Gracefully handles errors

### 4. Drift Detection
- **Edge Function**: `compute-drift`
  - Analyzes user activity over last 3 weeks
  - Flags users as "ok", "drifting", or "stale"
  - Stores drift flags in `leader_drift_flags` table
  - Provides actionable messages to nudge users back

### 5. Peer Tension Matching
- **Migration**: `20251216201000_add_peer_snippets.sql`
  - Created `leader_peer_snippets` table for anonymous, curated insights
  - Created `leader_sharing_consent` table for user consent management
  - Implements k-anonymity (requires at least 3 peers in cohort)
  - RLS policies ensure users can only access their own snippets

- **Edge Functions**:
  - `get-peer-snippets`: Retrieves matching peer snippets based on tension/dimension
  - `upsert-sharing-consent`: Manages user consent for sharing

### 6. Claim History (Anonymous → Authenticated Upgrade)
- **Migration**: `20251216202000_add_claim_history_rpc.sql`
  - Created RPC function `claim_user_history` to merge anonymous user data with authenticated account
  - Validates table names to prevent SQL injection
  - Updates user_id references across all longitudinal tables

- **Edge Function**: `claim-history`
  - Allows users to claim their anonymous history when upgrading to authenticated account
  - Uses service role for secure data migration

## 📁 Files Created/Modified

### Migrations
- `supabase/migrations/20251216200000_fix_baseline_rls_owner_user_id.sql`
- `supabase/migrations/20251216201000_add_peer_snippets.sql`
- `supabase/migrations/20251216202000_add_claim_history_rpc.sql`

### Edge Functions
- `supabase/functions/get-or-generate-weekly-action/index.ts`
- `supabase/functions/compute-drift/index.ts`
- `supabase/functions/get-peer-snippets/index.ts`
- `supabase/functions/upsert-sharing-consent/index.ts`
- `supabase/functions/claim-history/index.ts`

### Updated Files
- `supabase/functions/create-leader-assessment/index.ts` - Added `owner_user_id` support and auth.uid() extraction
- `src/pages/Today.tsx` - Updated to use `get-or-generate-weekly-action` edge function

### Configuration
- `.nvmrc` - Node.js version pinning

## 🔒 Security Improvements

1. **Baseline Data Privacy**: All baseline assessments now properly scoped to `auth.uid()` via `owner_user_id`
2. **RLS Policies**: Tightened RLS policies across all baseline tables
3. **Anonymous User Support**: Proper handling of anonymous users with pseudo-emails
4. **K-Anonymity**: Peer snippets require at least 3 peers in cohort before sharing

## 🚀 Next Steps

1. **Apply Migrations**: Run migrations on Supabase to create new tables and update RLS policies
2. **Deploy Edge Functions**: Deploy new edge functions to Supabase
3. **Test Flow**: 
   - Test anonymous user creation and assessment flow
   - Test weekly check-in and action generation
   - Test decision capture
   - Test drift detection
   - Test peer snippets (requires consent + k-anonymity)
4. **Build Verification**: Run `npm install` then `npm run build` to verify TypeScript compilation

## ⚠️ Notes

- All edge functions use Lovable AI Gateway with deterministic fallbacks for resilience
- Anonymous users are supported via Supabase anonymous sign-in (`signInAnonymously()`)
- Email handling: Empty emails are converted to `anon+{userId}@anon.local` format
- RLS policies maintain backward compatibility with legacy `session_id`-based access
- Peer snippets require explicit user consent and k-anonymity (≥3 peers)
