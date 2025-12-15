# ADVERSARIAL AUDIT: Mindmaker for Leaders
**Date**: 2025-01-27  
**Standard**: Zero dead ends. Zero silent failures. Zero ambiguous next steps.

---

## 1. SYSTEM & STATE MAP

### 1.1 User Modes & Concurrency

#### Explicitly Supported Modes
1. **Solo User (Primary)**
   - Single user completes assessment independently
   - No real-time collaboration features
   - Assessment state stored in React Context + localStorage

2. **Multiple Concurrent Users (NOT EXPLICITLY SUPPORTED)**
   - No locking mechanisms
   - No conflict resolution
   - Each user creates independent assessments
   - **RISK**: Two users with same email could create duplicate leader records

3. **Asynchronous Collaboration (NOT SUPPORTED)**
   - No shared assessment editing
   - No team-level aggregation
   - No handoff mechanisms

4. **Sequential Hand-offs (PARTIALLY SUPPORTED)**
   - Assessment can be linked to authenticated user after completion
   - No explicit handoff workflow
   - **GAP**: Anonymous assessment → authenticated user linking happens only on unlock

5. **Read-only Participants (NOT SUPPORTED)**
   - No view-only mode
   - No sharing mechanisms beyond URL parameter

6. **Returning Users After Inactivity**
   - Assessment ID persisted in localStorage + URL
   - Results can be restored via `getPersistedAssessmentId()`
   - **GAP**: Assessment progress (mid-quiz) is NOT persisted - only completed assessment IDs

7. **Users Joining Mid-flow (NOT SUPPORTED)**
   - No resume capability for incomplete assessments
   - Refresh during quiz loses all progress

#### State Combination Matrix

| State | Solo User | Concurrent Users | Refresh Recovery | Back Button | Deep Link |
|-------|-----------|------------------|-----------------|-------------|-----------|
| Hero Screen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quiz In Progress | ✅ | ✅ | ❌ **P0** | ❌ **P0** | ❌ **P0** |
| Quiz Complete | ✅ | ✅ | ✅ | ⚠️ Partial | ✅ |
| Deep Profile | ✅ | ✅ | ❌ **P0** | ⚠️ Partial | ❌ |
| Generating Insights | ✅ | ✅ | ⚠️ **P1** | ❌ **P0** | ⚠️ **P1** |
| Results View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice Assessment | ✅ | ✅ | ❌ **P0** | ⚠️ Partial | ❌ |

**Legend**: ✅ Supported | ⚠️ Partial/Unreliable | ❌ Not Supported | **P0/P1** = Priority

#### Unsupported States (CRITICAL GAPS)

1. **Mid-Assessment Refresh** (P0)
   - Location: `src/components/UnifiedAssessment.tsx`
   - Impact: All quiz progress lost
   - User sees: Hero screen, must restart

2. **Back Button During Quiz** (P0)
   - Location: `src/pages/Index.tsx` (mode state management)
   - Impact: Progress lost, no warning
   - User sees: Previous screen without saved state

3. **Concurrent Assessment Creation** (P1)
   - Location: `supabase/functions/create-leader-assessment/index.ts:33-75`
   - Impact: Duplicate leader records possible
   - Race condition: Two requests with same email

4. **AI Generation Failure Recovery** (P1)
   - Location: `src/components/UnifiedAssessment.tsx:190-200`
   - Impact: User sees error but no retry mechanism
   - Fallback exists but user must restart

### 1.2 Lifecycle Coverage

#### Supported Lifecycle States

| Lifecycle State | Support Level | Recovery Mechanism |
|----------------|---------------|-------------------|
| First-time user | ✅ Full | Starts at hero screen |
| Partially onboarded | ❌ **P0** | Progress lost on refresh |
| Fully active | ✅ Full | Results persist via localStorage |
| Idle (completed) | ✅ Full | Results accessible via URL |
| Returning after long gap | ⚠️ Partial | Results accessible, progress not |
| Logged out mid-flow | ⚠️ Partial | Assessment continues anonymously |
| App refresh or crash | ❌ **P0** | Quiz progress lost |
| Version mismatch | ❌ **P2** | No version checking |
| Cached state | ⚠️ Partial | May show stale data |

#### Lifecycle Gaps

1. **Partially Onboarded User** (P0)
   - **Location**: `src/hooks/useStructuredAssessment.ts:78-85`
   - **Problem**: State stored only in React state, not persisted
   - **Impact**: Refresh = complete loss of progress
   - **Fix Required**: Persist responses to localStorage with debounce

2. **App Refresh During Generation** (P1)
   - **Location**: `src/components/UnifiedAssessment.tsx:539-570`
   - **Problem**: Generation status not checked on mount
   - **Impact**: User must restart assessment
   - **Fix Required**: Check `generation_status` in DB on mount

3. **Version Mismatch** (P2)
   - **Location**: No version checking exists
   - **Problem**: Schema changes could break old assessments
   - **Impact**: Results may fail to load
   - **Fix Required**: Version field in assessment + migration path

---

## 2. UI & UX AUDIT

### 2.1 Screen-Level Contract

#### Hero Screen (`src/components/HeroSection.tsx`)
- **Primary Action**: Start quiz or voice assessment
- **Secondary Actions**: Sign in, view history (if authenticated)
- **Failure Handling**: 
  - ✅ Buttons disabled if loading
  - ❌ **P1**: No error state if navigation fails
- **Data Requirements**:
  - Missing: ✅ Handles gracefully (defaults)
  - Empty: ✅ Handles gracefully
  - Delayed: ⚠️ No loading indicator for auth check
  - Partially available: ✅ Handles gracefully

#### Quiz Screen (`src/components/UnifiedAssessment.tsx`)
- **Primary Action**: Answer question → proceed to next
- **Secondary Actions**: Back button (loses progress - **P0**)
- **Failure Handling**:
  - AI response failure: ⚠️ Shows fallback question but no retry
  - Network failure: ❌ **P0**: No retry, user stuck
- **Data Requirements**:
  - Missing question: ❌ **P0**: No fallback, app may crash
  - Empty options: ❌ **P0**: No validation
  - Delayed AI response: ⚠️ Shows loading but no timeout
  - **CRITICAL**: User waiting without guaranteed exit = **P0 BUG**

#### Deep Profile Questionnaire (`src/components/DeepProfileQuestionnaire.tsx`)
- **Primary Action**: Complete questionnaire → proceed
- **Secondary Actions**: Back button
- **Failure Handling**:
  - Validation failure: ✅ Shows error messages
  - Submit failure: ⚠️ Error shown but no retry
- **Data Requirements**:
  - Missing fields: ✅ Validation prevents submission
  - Empty responses: ✅ Handled

#### Results Screen (`src/components/SingleScrollResults.tsx`)
- **Primary Action**: View results
- **Secondary Actions**: Unlock full results, expand sections
- **Failure Handling**:
  - Assessment ID missing: ⚠️ Shows error after 3 retries (4.5s delay)
  - Data fetch failure: ⚠️ Shows loading indefinitely if retries fail
  - **P0**: No "start new assessment" option on failure
- **Data Requirements**:
  - Missing assessment: ⚠️ Retry logic exists but limited
  - Empty results: ✅ Shows empty state
  - Delayed data: ⚠️ Loading state but no timeout

### 2.2 Multi-User & Parallel Usage

#### Scenario 1: Two Users, Same Email
- **Location**: `supabase/functions/create-leader-assessment/index.ts:33-37`
- **Behavior**: 
  - User A starts assessment → creates leader record
  - User B starts assessment with same email → finds existing, updates
  - **RISK**: User B's assessment overwrites User A's leader metadata
- **Consistency**: ❌ Not consistent - last write wins
- **Feedback**: ❌ No indication of conflict

#### Scenario 2: One User Ahead, One Behind
- **Behavior**: Independent assessments, no conflict
- **Consistency**: ✅ Consistent (isolated)
- **Feedback**: ✅ Appropriate

#### Scenario 3: One User Retries Actions
- **Location**: `src/components/UnifiedAssessment.tsx:140-200`
- **Behavior**: 
  - Answer question → AI call fails → retry sends duplicate answer
  - **RISK**: Duplicate `assessment_events` records
- **Idempotency**: ❌ **P1**: Not idempotent
- **Feedback**: ⚠️ No indication of duplicate submission

#### Scenario 4: Conflicting Edits
- **N/A**: No collaborative editing

#### Scenario 5: Read-While-Write
- **Location**: `src/utils/aggregateLeaderResults.ts:65-292`
- **Behavior**: 
  - User viewing results while generation still in progress
  - **RISK**: Partial data shown, may be confusing
- **Consistency**: ⚠️ Eventual consistency (polling would help)
- **Feedback**: ⚠️ No indication data is incomplete

### 2.3 Navigation & Recovery

#### Back Button
- **Quiz Screen**: ❌ **P0** - Loses all progress, no warning
  - Location: `src/pages/Index.tsx:16` (mode state)
  - Fix: Warn user or persist progress before navigation

- **Results Screen**: ✅ Works correctly
  - Location: `src/components/SingleScrollResults.tsx:110`

#### Refresh
- **Quiz Screen**: ❌ **P0** - Progress lost
  - Location: `src/hooks/useStructuredAssessment.ts:78-85`
  - Fix: Persist to localStorage

- **Results Screen**: ✅ Works (assessment ID in URL/localStorage)
  - Location: `src/utils/assessmentPersistence.ts:18-43`

#### Deep Links
- **Results**: ✅ Supported via `?a=<assessmentId>`
  - Location: `src/utils/assessmentPersistence.ts:20-25`
- **Quiz**: ❌ **P0** - Not supported
- **Deep Profile**: ❌ **P0** - Not supported

#### App Reopen After Crash
- **Quiz**: ❌ **P0** - Progress lost
- **Results**: ✅ Recoverable via URL/localStorage

#### Browser Tab Duplication
- **Behavior**: 
  - New tab = new session
  - **RISK**: Two assessments in progress simultaneously
  - **Impact**: Confusion, potential data conflicts
- **Fix**: Check for active assessment on mount

---

## 3. DATA PIPELINE AUDIT

### 3.1 Source of Truth

#### Canonical Data Store
- **Primary**: Supabase PostgreSQL
- **Tables**: 
  - `leader_assessments` (assessment metadata)
  - `leader_dimension_scores` (scores)
  - `leader_tensions`, `leader_risk_signals`, etc. (AI-generated content)

#### Derived Data
- **Client-side**: 
  - `AssessmentContext` (React Context) - session state
  - `useStructuredAssessment` hook - quiz progress
  - **RISK**: Client state can diverge from server

#### Cached Data
- **localStorage**: Assessment ID only
- **sessionStorage**: Legacy assessment ID
- **React Query**: Not used for assessment state (missed opportunity)

#### Reconciliation
- **Problem**: No reconciliation mechanism
- **Location**: `src/contexts/AssessmentContext.tsx:42-72`
- **Impact**: Client state can be stale or incorrect
- **Fix**: Sync with server on mount

### 3.2 Event Safety

#### Action → Write → Read → Failure → Recovery Table

| Action | Write Location | Read Location | Failure Handling | Recovery | Status |
|--------|---------------|---------------|-------------------|----------|--------|
| Answer Question | `assessment_events` | N/A | ⚠️ Logged only | ❌ No retry | **P1** |
| Create Assessment | `leader_assessments` | Results screen | ✅ Error returned | ⚠️ User must restart | **P1** |
| Generate Insights | `leader_insights` | Results screen | ✅ Fallback content | ⚠️ No retry mechanism | **P1** |
| Submit Deep Profile | `assessment_events` | N/A | ⚠️ Logged only | ❌ No retry | **P1** |
| Unlock Results | `leader_assessments.has_full_diagnostic` | Results screen | ⚠️ Error shown | ⚠️ User must retry manually | **P1** |

#### Idempotency Analysis

1. **Answer Question** (NOT IDEMPOTENT)
   - Location: `src/components/UnifiedAssessment.tsx:140-200`
   - Problem: Retry creates duplicate `assessment_events`
   - Fix: Use `question_id + session_id` as unique constraint

2. **Create Assessment** (IDEMPOTENT)
   - Location: `supabase/functions/create-leader-assessment/index.ts:80-98`
   - Behavior: Creates new record each time (by design)
   - Status: ✅ Acceptable

3. **Generate Insights** (NOT IDEMPOTENT)
   - Location: Edge functions (multiple)
   - Problem: Retry creates duplicate records
   - Fix: Check `generation_status` before generating

### 3.3 Time, Order, and Sync

#### Time Dependencies
- **Assessment Creation**: Uses `created_at` timestamp
- **Generation Status**: Uses `generation_status.last_updated`
- **RISK**: Clock skew between client/server

#### Order Dependencies
- **Sequential Edge Functions**: 
  - Location: `src/utils/runAssessment.ts:350-724`
  - Problem: Functions called sequentially, not in parallel
  - Impact: Slow (30-60s total)
  - Fix: Parallelize where possible

#### Session Dependencies
- **Session ID**: Generated client-side (`crypto.randomUUID()`)
  - Location: `src/components/UnifiedAssessment.tsx:78`
  - **RISK**: Collision possible (unlikely but not impossible)
  - Fix: Use server-generated UUID

#### Background Jobs
- **AI Generation**: Runs in edge functions
- **Status Polling**: Not implemented
  - Location: `src/components/SingleScrollResults.tsx:132-149`
  - Problem: Fetches once on mount, no polling
  - Impact: User may see incomplete data
  - Fix: Poll `generation_status` until complete

---

## 4. AI SYSTEMS AUDIT

### 4.1 AI Dependency Map

#### AI Invocations

| Invocation | Location | Inputs | Can Be Empty? | Output Usage | Classification |
|------------|----------|--------|---------------|--------------|----------------|
| `ai-assessment-chat` | `src/components/UnifiedAssessment.tsx:160` | Question, answer, context | ❌ No validation | Next question | **Blocking** |
| `ai-generate` | `src/utils/runAssessment.ts:421` | Assessment data, profile | ⚠️ Partial validation | Insights, prompts | **Blocking** |
| `generate-personalized-insights` | Edge function | Assessment ID | ❌ No validation | Insights | **Blocking** |
| `generate-prompt-library` | Edge function | Assessment ID | ❌ No validation | Prompts | **Blocking** |
| `compute-tensions` | Edge function | Assessment ID | ❌ No validation | Tensions | **Blocking** |
| `compute-risk-signals` | Edge function | Assessment ID | ❌ No validation | Risks | **Blocking** |
| `derive-org-scenarios` | Edge function | Assessment ID | ❌ No validation | Scenarios | **Blocking** |

#### Blocking AI Without Fallback = DESIGN ERROR

**Critical Issues**:

1. **Quiz AI Chat** (P0)
   - Location: `src/components/UnifiedAssessment.tsx:160-200`
   - Problem: If AI fails, user sees fallback question but no way to proceed
   - Fallback: ✅ Exists (shows next question)
   - Recovery: ❌ No retry mechanism

2. **AI Generation** (P1)
   - Location: `supabase/functions/ai-generate/index.ts:110-172`
   - Problem: If both Vertex AI and OpenAI fail, returns fallback content
   - Fallback: ✅ Exists (generic content)
   - Recovery: ⚠️ User must restart assessment to retry

### 4.2 Determinism & Recovery

#### Can Outputs Be Regenerated?
- **Quiz AI Responses**: ❌ No - not stored, cannot regenerate
- **Insights**: ⚠️ Partial - can regenerate but creates duplicates
  - Location: Edge functions don't check if already generated
- **Prompts**: ⚠️ Partial - same issue

#### Can App Continue If AI Fails?
- **Quiz**: ⚠️ Partial - shows next question but loses AI context
- **Results**: ✅ Yes - uses fallback content
  - Location: `src/utils/pipelineGuards.ts:415-458`

#### Can User Retry Without Corruption?
- **Quiz**: ❌ No - retry creates duplicate events
- **Results Generation**: ⚠️ Partial - can retry but creates duplicates
  - Location: Edge functions don't check `generation_status`

### 4.3 Safety & Containment

#### Prompt Injection
- **Risk**: User input passed directly to AI
  - Location: `src/components/UnifiedAssessment.tsx:161-166`
  - Input: User's answer text
  - **RISK**: User could inject malicious prompts
- **Mitigation**: ⚠️ Limited - answer is wrapped in context but not sanitized

#### Cross-User Data Leakage
- **RLS Policies**: ✅ Enabled
  - Location: `supabase/migrations/20251119111446_*.sql:108-237`
- **Session Isolation**: ✅ Each session has unique ID
- **Risk**: ⚠️ Low - but no explicit session validation in edge functions

#### Overreach into Advice
- **AI Role**: Defined as "executive coach"
  - Location: `supabase/functions/ai-generate/index.ts:674`
- **Content Filtering**: ⚠️ Limited - relies on AI model behavior
- **Risk**: Medium - AI could provide inappropriate advice

#### Unexpected Tone Shifts
- **No Validation**: AI output not checked for tone consistency
- **Risk**: Low-Medium - could confuse users

---

## 5. FAILURE MODE REGISTER

### P0 - Critical (System Unusable)

| # | Failure Description | Trigger | User Impact | Detectability | Severity | File:Function |
|---|---------------------|--------|-------------|---------------|----------|---------------|
| 1 | Quiz progress lost on refresh | User refreshes during quiz | Must restart entire assessment | High (immediate) | P0 | `src/hooks/useStructuredAssessment.ts:78-85` |
| 2 | Quiz progress lost on back button | User clicks browser back | Progress lost, no warning | High (immediate) | P0 | `src/pages/Index.tsx:16` (mode state) |
| 3 | No recovery from AI failure during quiz | AI chat function fails | User stuck, cannot proceed | High (immediate) | P0 | `src/components/UnifiedAssessment.tsx:190-200` |
| 4 | No deep link support for quiz | User tries to share quiz URL | Cannot resume | Medium (on attempt) | P0 | `src/components/UnifiedAssessment.tsx` (no URL param handling) |
| 5 | No recovery from generation failure | Edge function fails during generation | User sees error, must restart | High (immediate) | P0 | `src/components/UnifiedAssessment.tsx:539-570` |

### P1 - High (Degraded Experience)

| # | Failure Description | Trigger | User Impact | Detectability | Severity | File:Function |
|---|---------------------|--------|-------------|---------------|----------|---------------|
| 6 | Duplicate leader records on concurrent access | Two users with same email create assessments simultaneously | Data inconsistency | Low (silent) | P1 | `supabase/functions/create-leader-assessment/index.ts:33-75` |
| 7 | Duplicate assessment events on retry | User retries answering question | Duplicate records in DB | Low (silent) | P1 | `src/components/UnifiedAssessment.tsx:140-200` |
| 8 | No idempotency for AI generation | User retries generation | Duplicate records created | Low (silent) | P1 | Edge functions (multiple) |
| 9 | No polling for generation status | User views results while generation incomplete | Sees incomplete data | Medium (on view) | P1 | `src/components/SingleScrollResults.tsx:132-149` |
| 10 | Race condition in leader lookup | Concurrent requests with same email | Last write wins, data loss | Low (silent) | P1 | `supabase/functions/create-leader-assessment/index.ts:33-37` |

### P2 - Medium (Minor Issues)

| # | Failure Description | Trigger | User Impact | Detectability | Severity | File:Function |
|---|---------------------|--------|-------------|---------------|----------|---------------|
| 11 | No version checking | Schema changes break old assessments | Results fail to load | Low (on load) | P2 | No version field exists |
| 12 | Clock skew risk | Server/client time mismatch | Timestamp inconsistencies | Low (silent) | P2 | Multiple locations |
| 13 | Session ID collision risk | Two users generate same UUID | Data collision (unlikely) | Very Low | P2 | `src/components/UnifiedAssessment.tsx:78` |
| 14 | No timeout for AI calls | AI service hangs | User waits indefinitely | Medium (after delay) | P2 | `src/components/UnifiedAssessment.tsx:160` |

### P3 - Low (Cosmetic)

| # | Failure Description | Trigger | User Impact | Detectability | Severity | File:Function |
|---|---------------------|--------|-------------|---------------|----------|---------------|
| 15 | No loading indicator for auth check | Auth state loading | Brief flash of wrong UI | Low (brief) | P3 | `src/pages/Index.tsx:21-33` |
| 16 | Stale data in React Context | Context not synced with server | Minor inconsistency | Low (silent) | P3 | `src/contexts/AssessmentContext.tsx:42-72` |

---

## 6. FIX PRIORITISATION

### Top 10 Fixes by Risk Reduction

| Rank | Fix | Risk Reduction | User Clarity | Structural Stability | Category | Estimated Effort |
|------|-----|----------------|--------------|----------------------|----------|------------------|
| 1 | Persist quiz progress to localStorage | **High** | **High** | **High** | State logic | 4h |
| 2 | Add back button warning/confirmation | **High** | **High** | Medium | UX | 2h |
| 3 | Implement generation status polling | **High** | **High** | **High** | Data model | 6h |
| 4 | Add idempotency to assessment events | **High** | Low | **High** | Data model | 3h |
| 5 | Add retry mechanism for AI failures | **High** | **High** | Medium | AI dependency | 4h |
| 6 | Fix race condition in leader creation | **High** | Low | **High** | Data model | 3h |
| 7 | Add deep link support for quiz | Medium | **High** | Medium | UX | 4h |
| 8 | Check generation status on mount | **High** | **High** | Medium | State logic | 3h |
| 9 | Add timeout for AI calls | Medium | **High** | Medium | AI dependency | 2h |
| 10 | Add version field to assessments | Low | Low | **High** | Data model | 2h |

### Fix Details

#### Fix #1: Persist Quiz Progress (P0)
- **File**: `src/hooks/useStructuredAssessment.ts`
- **Change**: Add localStorage persistence with debounce
- **Impact**: Users can refresh without losing progress
- **Effort**: 4 hours

#### Fix #2: Back Button Warning (P0)
- **File**: `src/pages/Index.tsx`
- **Change**: Add `beforeunload` handler or navigation guard
- **Impact**: Prevents accidental data loss
- **Effort**: 2 hours

#### Fix #3: Generation Status Polling (P1)
- **File**: `src/components/SingleScrollResults.tsx`
- **Change**: Poll `generation_status` until complete
- **Impact**: Users see real-time progress
- **Effort**: 6 hours

#### Fix #4: Idempotency for Events (P1)
- **File**: Database migration + `src/components/UnifiedAssessment.tsx`
- **Change**: Add unique constraint on `(question_id, session_id)`
- **Impact**: Prevents duplicate records
- **Effort**: 3 hours

#### Fix #5: AI Retry Mechanism (P0)
- **File**: `src/components/UnifiedAssessment.tsx:190-200`
- **Change**: Add retry button and exponential backoff
- **Impact**: Users can recover from transient failures
- **Effort**: 4 hours

#### Fix #6: Leader Creation Race Condition (P1)
- **File**: `supabase/functions/create-leader-assessment/index.ts:33-75`
- **Change**: Use database transaction or upsert with conflict handling
- **Impact**: Prevents data loss
- **Effort**: 3 hours

#### Fix #7: Deep Link Support (P0)
- **File**: `src/components/UnifiedAssessment.tsx`
- **Change**: Read/write quiz state to URL params
- **Impact**: Users can share/resume quiz
- **Effort**: 4 hours

#### Fix #8: Check Generation Status on Mount (P0)
- **File**: `src/components/UnifiedAssessment.tsx:111-115`
- **Change**: Check if generation in progress, resume if needed
- **Impact**: Users can recover from refresh during generation
- **Effort**: 3 hours

#### Fix #9: AI Call Timeout (P2)
- **File**: `src/components/UnifiedAssessment.tsx:160`
- **Change**: Add timeout (30s) with fallback
- **Impact**: Users don't wait indefinitely
- **Effort**: 2 hours

#### Fix #10: Version Field (P2)
- **File**: Database migration + assessment creation
- **Change**: Add `schema_version` field, migration logic
- **Impact**: Future-proof against schema changes
- **Effort**: 2 hours

---

## 7. SUMMARY

### Critical Gaps Identified
- **5 P0 issues** requiring immediate attention
- **5 P1 issues** causing data integrity problems
- **4 P2 issues** for future robustness
- **2 P3 issues** for polish

### System Health Score
- **State Management**: 4/10 (progress not persisted)
- **Error Recovery**: 5/10 (some fallbacks, limited retry)
- **Data Integrity**: 6/10 (RLS enabled, but race conditions exist)
- **User Experience**: 5/10 (works when everything succeeds)
- **AI Reliability**: 6/10 (fallbacks exist, but no retry)

### Overall Assessment
The system is **functional but fragile**. Core workflows work when everything succeeds, but multiple failure modes can leave users stranded. The most critical issues are around state persistence and recovery mechanisms.

**Recommendation**: Address P0 issues immediately, then P1 issues within one sprint.

---

**End of Audit**
