# Common Issues

Recurring bugs, architectural pain points, and solutions.

---

## Architecture Issues

### Issue 1: Dual Architecture Conflict
**Symptom**: UI shows empty/stale data despite successful backend generation
**Root Cause**: V1 components (prop-based) coexisted with V2 (DB-based)
**Solution**: Deleted `AILeadershipBenchmark.tsx` and `PromptLibraryResults.tsx`
**Status**: ✅ Resolved (Jan 2025)

### Issue 2: Null/Undefined Cascade
**Symptom**: UI crashes or shows "undefined" text
**Root Cause**: Missing null guards in data aggregation
**Solution**: Implemented `pipelineGuards.ts` with safe defaults
**Status**: ✅ Resolved (Jan 2025)

### Issue 3: Edge Function Timeouts
**Symptom**: Assessment hangs on "Generating insights..."
**Root Cause**: Sequential edge function calls, LLM timeouts
**Solution**: Parallelised calls, added timeout protection
**Status**: ⚠️ Improved but monitor

---

## Data Flow Issues

### Issue 4: AssessmentId Not Passed
**Symptom**: Results page shows loading spinner forever
**Root Cause**: `assessmentId` not in URL or state after completion
**Solution**: Store in `AssessmentContext` and URL params
**Status**: ✅ Resolved

### Issue 5: Missing Dimension Scores
**Symptom**: Benchmark chart shows 0s or empty
**Root Cause**: `storeDimensionScores()` not called in orchestration
**Solution**: Added explicit call in `orchestrateAssessmentV2.ts`
**Status**: ✅ Resolved

---

## UI Issues

### Issue 6: Dark Mode Contrast
**Symptom**: Text unreadable in dark mode
**Root Cause**: Hardcoded colors (e.g., `text-white`, `bg-black`)
**Solution**: Use semantic tokens (`text-foreground`, `bg-background`)
**Prevention**: Enforce token usage in code reviews
**Status**: ✅ Resolved

### Issue 7: Mobile Layout Breaks
**Symptom**: Content overflows, buttons cut off
**Root Cause**: Fixed widths, missing responsive classes
**Solution**: Use `max-w-{size}`, `grid-cols-1 md:grid-cols-2`
**Prevention**: Test on mobile before shipping
**Status**: ⚠️ Ongoing monitoring

---

## LLM Issues

### Issue 8: Hallucinated Insights
**Symptom**: Insights reference data user didn't provide
**Root Cause**: LLM generating plausible but false content
**Solution**: Require evidence citations, validate against user answers
**Prevention**: Use `quality-guardrails.ts` validation
**Status**: ⚠️ Improved but not eliminated

### Issue 9: Generic Prompts
**Symptom**: Prompts don't feel personalised
**Root Cause**: Insufficient context in LLM call
**Solution**: Enhanced `context-builder.ts` with deep profile
**Status**: ✅ Improved

---

## Payment Issues

### Issue 10: Payment Success But No Upgrade
**Symptom**: User pays but still sees free tier
**Root Cause**: `has_full_diagnostic` flag not set
**Solution**: Update flag in `handlePaymentSuccess.ts`
**Status**: ✅ Resolved

---

---

## Dec 2024 Audit Fixes

### Issue 11: Broken Assessment History Viewing
**Symptom**: Users couldn't view past assessments from history
**Root Cause**: `viewingAssessmentId` state was set but never used
**Solution**: Implemented complete viewing flow in `Index.tsx` with data loading
**Status**: ✅ Resolved

### Issue 12: NotFound Using Wrong Design Tokens
**Symptom**: 404 page looked inconsistent with rest of app
**Root Cause**: Hardcoded gray/blue colors instead of design system
**Solution**: Complete redesign using Card, Button, and proper tokens
**Status**: ✅ Resolved

### Issue 13: Unlock Form Not Creating Accounts
**Symptom**: Users "unlocked" results but no account was created
**Root Cause**: `handleUnlock` had TODO - no Supabase auth implementation
**Solution**: Implemented proper signUp flow with existing account handling
**Status**: ✅ Resolved

### Issue 14: Eternal Loading on Missing Assessment ID
**Symptom**: Results page would show spinner forever if ID not found
**Root Cause**: No retry logic or error state for assessment ID restoration
**Solution**: Added 3-attempt retry with proper error messaging
**Status**: ✅ Resolved

### Issue 15: Checkbox Boolean/String Mismatch
**Symptom**: Consent checkbox validation sometimes failed incorrectly
**Root Cause**: Converting boolean to string in onChange handler
**Solution**: Direct boolean assignment with proper state update
**Status**: ✅ Resolved

---

## Prevention Checklist

Before shipping:
- [ ] Test both light and dark mode
- [ ] Test mobile, tablet, desktop
- [ ] Verify null guards on all data paths
- [ ] Check `assessmentId` flows through pipeline
- [ ] Validate LLM outputs against schemas
- [ ] Test free vs paid gating
- [ ] Confirm edge functions complete successfully
- [ ] Verify all forms handle all input types correctly
- [ ] Check loading states and error states display
- [ ] Test assessment history viewing (if logged in)
