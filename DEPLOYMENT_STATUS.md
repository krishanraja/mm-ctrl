# Edge Function Deployment Status

## Deployment Timestamp: 2025-11-19 12:26 UTC

### ✅ SUCCESSFULLY DEPLOYED TO SUPABASE

The following 5 edge functions are now live on Supabase production:

1. **compute-risk-signals** - Analyzes shadow AI, skills gaps, ROI leakage, decision friction
2. **compute-tensions** - Detects vision-execution gaps, leadership-team disconnects, priority-action mismatches
3. **derive-org-scenarios** - Derives stagnation loops, shadow AI instability, high-velocity paths
4. **create-diagnostic-payment** - Creates Stripe checkout for $99 diagnostic upgrade
5. **verify-diagnostic-payment** - Verifies payment and unlocks full diagnostic

### Configuration

All functions configured in `supabase/config.toml` with `verify_jwt = false` (public access).

### Next Steps for User

**CRITICAL: You must complete a NEW assessment for v2 to work**

1. Clear your browser cache completely
2. Go to the homepage
3. Click "Quiz" or "Voice" 
4. Complete the full assessment flow
5. Watch for these console logs:
   ```
   🚀 Starting v2 assessment orchestration
   ✅ Assessment record created: [id]
   🔄 Calling edge functions...
   ✅ Personalized insights generated
   ✅ Prompt library generated
   ✅ Risk signals computed: 4
   ✅ Tensions computed: 6
   ✅ Org scenarios derived: 3
   📊 Using v2 assessment ID: [id]
   ```

### Expected UI Changes

After completing a new assessment, you should see:

- ✅ **LeadershipBenchmarkV2** component (NOT the old AILeadershipBenchmark)
- ✅ Risk signals section (2 unlocked, 2+ gated with "Unlock Full Diagnostic" banner)
- ✅ Tensions displayed on dimension cards
- ✅ Org scenarios section (1 unlocked, 2+ gated)
- ✅ First 3 moves card
- ✅ AI Literacy Realities section
- ✅ "Upgrade - $99" button that opens Stripe checkout

### Troubleshooting

If v2 UI doesn't appear after a new assessment:

1. Open browser console (F12)
2. Look for orchestration logs starting with 🚀
3. Check for any errors in red
4. Verify `sessionStorage.getItem('v2_assessment_id')` returns a UUID
5. Report the specific error message

### Why Old Assessments Don't Show v2 UI

Old assessments (completed before deployment) have:
- ❌ No records in `leader_assessments` table
- ❌ No risk signals, tensions, or scenarios computed
- ✅ Only legacy data in `prompt_library_profiles` and `leadership_assessments` tables

These will continue showing the old UI. **You must complete a new assessment to see v2.**
