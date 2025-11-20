# LLM Infrastructure Diagnostics Implementation

**Status:** ✅ Deployed and ready for testing

## What Was Done

### CP1: Environment Variable Verification
**Files:** Both edge functions
**Added:** Logging to verify:
- API keys exist and have correct format
- Gemini service account JSON parses correctly
- All required fields present (projectId, clientEmail, private_key)

**Look for:**
```
🔑 CP1: API Keys check: { gemini: true/false, openai: true/false, lovable: true/false }
📍 CP1: Vertex AI config: { projectId, clientEmail, hasPrivateKey }
❌ CP1: GEMINI_SERVICE_ACCOUNT_KEY is not valid JSON!
```

### CP2: Network Diagnostics
**Files:** Both edge functions
**Added:** Test fetch to googleapis.com before any LLM calls

**Look for:**
```
✅ CP2: googleapis.com reachable: 200
❌ CP2: googleapis.com UNREACHABLE: [error message]
⚠️ CP2: This will cause ALL LLM calls to fail
```

### CP3: OAuth Timeout
**Files:** Both edge functions
**Added:** 
- Separate 15s timeout for OAuth call
- Separate AbortController for OAuth
- Updated function signature to accept signal

**Look for:**
```
✅ CP3: OAuth completed in [X] ms
❌ CP3: OAuth failed: [error message]
✅ CP3: Vertex AI API timeout set to 60s (OAuth already complete)
```

### CP4: Foreign Key Constraint Fix
**File:** `src/utils/orchestrateAssessmentV2.ts` line 171
**Changed:** `userId: leaderId` → `userId: null`
**Reason:** Prevented database insertion failures by not passing leader_id into user_id column

**Look for:** No more FK constraint violations in database logs

### CP5: Comprehensive Response Logging
**Files:** Both edge functions
**Added:** Full response structure logging including:
- HTTP status and headers
- Candidates count
- finishReason (safety filter detection)
- safetyRatings (blocked content detection)
- Content length and preview

**Look for:**
```json
📦 CP5: Full Gemini response structure: {
  "ok": true,
  "status": 200,
  "firstCandidate": {
    "finishReason": "STOP" / "SAFETY" / "RECITATION" / "OTHER",
    "safetyRatings": [...],
    "firstPartTextLength": 5000,
    "firstPartTextPreview": "..."
  }
}
```

## What This Will Reveal

### If API Keys Are Invalid:
- CP1 will show `gemini: false` or JSON parse error

### If Network Is Blocked:
- CP2 will show `googleapis.com UNREACHABLE`
- Proves environment-level network issue

### If OAuth Specifically Fails:
- CP3 will show OAuth timeout or specific OAuth error
- Separates OAuth failures from API failures

### If Gemini Safety Filters Block Content:
- CP5 will show `finishReason: "SAFETY"`
- Need to adjust prompts

### If Database Writes Work:
- CP4 fix should eliminate FK constraint violations
- Prompts should save to `prompt_library_profiles`

## Next Steps After Running Test

1. Run an assessment
2. Check edge function logs:
   - [generate-personalized-insights logs](https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/functions/generate-personalized-insights/logs)
   - [generate-prompt-library logs](https://supabase.com/dashboard/project/bkyuxvschuwngtcdhsyg/functions/generate-prompt-library/logs)
3. Look for CP1-CP5 markers in logs
4. Share findings so we can implement the actual fix

## Expected Outcomes

**Best case:** CP1 ✅, CP2 ✅, CP3 ✅, CP5 shows safety filter block
→ Fix: Adjust prompts to avoid safety triggers

**Likely case:** CP1 ✅, CP2 ❌
→ Fix: Contact Supabase support about network restrictions

**Worst case:** CP1 ❌
→ Fix: Reconfigure secrets with valid API keys
