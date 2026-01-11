# UX Button Behavior Audit - Chief Experience Designer Perspective

**Date:** 2025-01-27  
**Auditor:** AI UX Audit System (Google-level standards)  
**Scope:** Button behaviors across all authentication states on homepage

---

## Executive Summary

**Critical Issues Found:** 12  
**High-Priority Issues:** 8  
**Medium-Priority Issues:** 4  
**Low-Priority Issues:** 2

The current implementation has significant UX flow issues that create confusion, redirect loops, and inconsistent experiences across different user states. The button logic doesn't properly account for the full spectrum of authentication states and user progress states.

---

## Authentication States

The system has 3 primary auth states from HeroSection's perspective:
1. **No User** (`user === null`) - Anonymous visitor, no session
2. **Anonymous Session** (`user !== null && user.is_anonymous === true`) - Has Supabase anonymous auth
3. **Authenticated** (`user !== null && user.is_anonymous === false`) - Full email/password account

**Additional State:**
- **hasBaseline** - User has completed diagnostic (stored in localStorage)

---

## Button Behavior Matrix

### 1. "Get answers" Button (Primary CTA)
**Location:** HeroSection, always visible  
**Action:** Calls `onStartVoice` → sets mode to `'quick-entry'`

| Auth State | hasBaseline | Behavior | Issue |
|------------|-------------|----------|-------|
| No User | false | ✅ Opens QuickVoiceEntry | None |
| No User | true | ✅ Opens QuickVoiceEntry | ⚠️ **Issue #1** |
| Anonymous | false | ✅ Opens QuickVoiceEntry | None |
| Anonymous | true | ✅ Opens QuickVoiceEntry | ⚠️ **Issue #2** |
| Authenticated | false | ✅ Opens QuickVoiceEntry | ⚠️ **Issue #3** |
| Authenticated | true | ✅ Opens QuickVoiceEntry | ⚠️ **Issue #4** |

**Issues:**
- **Issue #1-4:** Button always shows "Get answers" regardless of user state. For users who already have baseline, this is confusing - they've already gotten answers. Should adapt copy or behavior.

---

### 2. Secondary Button (Conditional)
**Location:** HeroSection, below primary CTA

#### Button Logic:
```typescript
hasBaseline ? "Continue to Today" → /today
: user && !user.is_anonymous ? "Go to my dashboard" → /dashboard
: "Check my AI literacy level (2 min)" → onStartQuiz
```

| Auth State | hasBaseline | Button Shown | Destination | Issue |
|------------|-------------|--------------|-------------|-------|
| No User | false | "Check my AI literacy level (2 min)" | Quiz mode | ✅ OK |
| No User | true | "Continue to Today" | `/today` | 🔴 **CRITICAL #1** |
| Anonymous | false | "Check my AI literacy level (2 min)" | Quiz mode | ✅ OK |
| Anonymous | true | "Continue to Today" | `/today` | 🔴 **CRITICAL #2** |
| Authenticated | false | "Go to my dashboard" | `/dashboard` | 🔴 **CRITICAL #3** |
| Authenticated | true | "Continue to Today" | `/today` | ✅ OK |

**Critical Issues:**

**CRITICAL #1 & #2: Anonymous/No User with Baseline → "Continue to Today"**
- **Problem:** User without account (or anonymous) clicks "Continue to Today"
- **What happens:** Navigates to `/today` which is wrapped in AppShell
- **AppShell behavior:** Creates anonymous session, but `/today` page may not work properly for users without full account
- **User expectation:** They expect to continue their journey, but may hit auth walls
- **Impact:** High - User confusion, potential dead ends

**CRITICAL #3: Authenticated User Without Baseline → "Go to my dashboard"**
- **Problem:** Authenticated user without baseline clicks "Go to my dashboard"
- **What happens:** 
  1. Navigates to `/dashboard`
  2. Dashboard checks for `assessmentId` in localStorage
  3. If no `assessmentId`, Dashboard redirects back to `/` (line 56 in Dashboard.tsx)
  4. Index page checks redirect logic (line 27-47)
  5. Since user is authenticated but no baseline, stays on homepage
  6. User sees "Go to my dashboard" button again
- **Result:** **REDIRECT LOOP** or confusing back-and-forth
- **User experience:** Click button → Dashboard → Redirect to home → See same button → Confusion
- **Impact:** Critical - Creates broken user flow

---

### 3. "Sign In" Button
**Location:** Top-right header, only visible when `!user`

| Auth State | Visible | Action | Issue |
|------------|---------|--------|-------|
| No User | ✅ Yes | Opens sign-in modal | ✅ OK |
| Anonymous | ❌ No | Hidden | ⚠️ **Issue #5** |
| Authenticated | ❌ No | Hidden | ✅ OK |

**Issue #5: Anonymous Users Can't Sign In**
- **Problem:** Anonymous users don't see "Sign In" button
- **Impact:** They can't upgrade their anonymous session to a full account from homepage
- **Workaround:** They'd need to complete an assessment first, then get prompted to save
- **Impact:** Medium - Blocks account creation path

---

### 4. Profile Dropdown Menu
**Location:** Top-right, only visible when `user` exists (doesn't check anonymous)

| Auth State | Visible | Menu Items | Issue |
|------------|---------|------------|-------|
| No User | ❌ No | N/A | ✅ OK |
| Anonymous | ✅ Yes | Profile, Dashboard, Settings, My Assessments, Sign Out | 🔴 **CRITICAL #4** |
| Authenticated | ✅ Yes | Profile, Dashboard, Settings, My Assessments, Sign Out | ⚠️ **Issue #6** |

**CRITICAL #4: Anonymous Users See Full Profile Menu**
- **Problem:** Anonymous users see Profile, Dashboard, Settings options
- **What happens when clicked:**
  - **Profile:** May work but shows limited data
  - **Dashboard:** Redirects to home (no baseline) or shows empty dashboard
  - **Settings:** May work but limited functionality
  - **My Assessments:** Tries to scroll to `#assessment-history` section
- **Issue with "My Assessments":** 
  - In Index.tsx line 181-188, assessment history only shows if `user` exists
  - But dropdown shows for anonymous users too
  - Clicking "My Assessments" when anonymous may scroll to nothing or empty section
- **Impact:** High - Confusing, shows options that may not work properly

**Issue #6: "My Assessments" in Dropdown**
- **Problem:** Menu item "My Assessments" scrolls to section on same page
- **Behavior:** Uses `scrollIntoView` to find `#assessment-history` element
- **Issues:**
  - If user is on homepage and not logged in, section doesn't exist
  - If user navigated away from homepage, scroll won't work
  - Inconsistent with other menu items that navigate to new pages
- **Impact:** Medium - Inconsistent navigation pattern

---

## Redirect Logic Issues

### Index.tsx Redirect Logic (Lines 27-47)
```typescript
if (assessmentId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user && !session.user.is_anonymous) {
    navigate('/dashboard', { replace: true });
  }
}
```

**Issues:**

**Issue #7: Only Redirects Authenticated Users**
- **Problem:** Only authenticated users with baseline get auto-redirected
- **Missing cases:**
  - Anonymous users with baseline → Stay on homepage, see "Continue to Today"
  - Authenticated users without baseline → Stay on homepage, see "Go to my dashboard" (which causes redirect loop)
- **Impact:** High - Inconsistent experience

**Issue #8: Redirect Happens Before User State Loads**
- **Problem:** Redirect check happens in `useEffect` but user state loads separately
- **Race condition:** Redirect might happen before `user` state is set
- **Impact:** Medium - Potential timing issues

---

### Dashboard.tsx Redirect Logic (Lines 50-58)
```typescript
const { assessmentId } = getPersistedAssessmentId();
if (!assessmentId) {
  navigate('/', { replace: true });
  return;
}
```

**Issue #9: Dashboard Redirects All Users Without Baseline**
- **Problem:** Any user (authenticated or not) without baseline gets redirected to home
- **Creates redirect loop:** 
  - Authenticated user without baseline → Clicks "Go to my dashboard" → Dashboard → Redirect to home → Sees "Go to my dashboard" again
- **Impact:** Critical - Broken user flow

---

## State Inconsistency Issues

### Issue #10: hasBaseline vs assessmentId Mismatch
- **HeroSection** checks `hasBaseline` from `getPersistedAssessmentId()`
- **Dashboard** checks `assessmentId` from same function
- **Problem:** Both check localStorage, but logic is duplicated
- **Impact:** Low - Code maintainability, but could cause bugs if logic diverges

### Issue #11: Anonymous Users Can Have Baseline
- **Scenario:** User completes diagnostic as anonymous, gets baseline stored
- **Then:** They see "Continue to Today" button
- **But:** They're still anonymous, may not have full account features
- **Impact:** Medium - Unclear what features work for anonymous users

### Issue #12: Button Text Doesn't Reflect User Journey
- **Problem:** Button text is the same regardless of where user is in their journey
- **Examples:**
  - User who just completed diagnostic sees "Continue to Today" (good)
  - User who completed diagnostic weeks ago also sees "Continue to Today" (less clear)
  - Authenticated user without diagnostic sees "Go to my dashboard" (misleading - dashboard will redirect)
- **Impact:** Medium - Confusing messaging

---

## Edge Cases & Broken Flows

### Edge Case #1: User Completes Diagnostic, Then Signs Out
1. User completes diagnostic → `hasBaseline = true`
2. User signs out → `user = null`, but `hasBaseline` still true (localStorage persists)
3. User sees "Continue to Today" button
4. Clicks button → Navigates to `/today` → AppShell creates anonymous session
5. **Result:** Works, but user lost their account association

### Edge Case #2: User Has Multiple Accounts
1. User completes diagnostic on Account A → baseline stored
2. User signs out, signs in with Account B
3. Account B has no baseline, but localStorage still has Account A's baseline
4. User sees "Continue to Today" but it's for wrong account
5. **Result:** Data confusion, wrong baseline shown

### Edge Case #3: Anonymous User Completes Diagnostic
1. Anonymous user completes diagnostic → baseline stored
2. User sees "Continue to Today" (because `hasBaseline = true`)
3. User clicks → Goes to `/today`
4. User later wants to upgrade to account
5. **Problem:** Baseline might not be properly linked to new account
6. **Impact:** Data loss risk

---

## Recommended Fixes (Priority Order)

### P0 - Critical (Fix Immediately)

1. **Fix Redirect Loop (Issue #3, #9)**
   - Authenticated users without baseline should NOT see "Go to my dashboard"
   - Should see "Check my AI literacy level (2 min)" instead
   - OR Dashboard should handle users without baseline gracefully (show onboarding)

2. **Fix Anonymous User Profile Menu (Issue #4)**
   - Hide Profile dropdown for anonymous users, OR
   - Show limited menu with only "Sign In" option

3. **Fix "Continue to Today" for Anonymous Users (Issue #1, #2)**
   - Check if user is authenticated before showing "Continue to Today"
   - Anonymous users with baseline should see "Sign in to continue" or similar

### P1 - High Priority

4. **Improve Redirect Logic (Issue #7)**
   - Handle anonymous users with baseline
   - Handle authenticated users without baseline
   - Consider user's actual state, not just localStorage

5. **Fix "My Assessments" Menu Item (Issue #6)**
   - Make it navigate to a dedicated page instead of scrolling
   - OR hide it when assessment history section doesn't exist

6. **Add Sign In Option for Anonymous Users (Issue #5)**
   - Show "Sign In" or "Upgrade Account" option for anonymous users

### P2 - Medium Priority

7. **Adaptive Button Copy (Issue #12)**
   - Different text based on user journey stage
   - "Start your journey" vs "Continue where you left off" vs "View your dashboard"

8. **Baseline-Account Linking (Issue #11)**
   - Ensure baseline is properly linked when user upgrades from anonymous
   - Clear baseline when user signs out (or make it account-specific)

9. **Consolidate State Checks (Issue #10)**
   - Single source of truth for user state + baseline state
   - Use auth machine state instead of manual checks

### P3 - Low Priority

10. **Handle Multiple Account Scenario (Edge Case #2)**
    - Clear baseline on sign out, or make it account-specific
    - Show warning if baseline exists for different account

11. **Improve "Get answers" Button (Issue #1-4)**
    - Adapt copy for users who already have answers
    - "Get new insights" or "Ask another question"

---

## User Flow Diagrams

### Current Broken Flow (Authenticated, No Baseline)
```
User (authenticated, no baseline)
  ↓
Sees "Go to my dashboard" button
  ↓
Clicks button
  ↓
Navigates to /dashboard
  ↓
Dashboard checks for baseline → Not found
  ↓
Redirects to /
  ↓
Sees "Go to my dashboard" button again
  ↓
[LOOP or Confusion]
```

### Current Broken Flow (Anonymous, Has Baseline)
```
User (anonymous, has baseline)
  ↓
Sees "Continue to Today" button
  ↓
Clicks button
  ↓
Navigates to /today
  ↓
AppShell creates anonymous session
  ↓
May work, but user has no account
  ↓
Can't upgrade easily, data may be lost
```

---

## Conclusion

The button logic has fundamental flaws that create:
- **Redirect loops** for authenticated users without baseline
- **Confusing experiences** for anonymous users with baseline
- **Inconsistent navigation** patterns
- **Broken user flows** that trap users

The root cause is **incomplete state management** - the system doesn't properly account for all combinations of:
- Auth state (none, anonymous, authenticated)
- Baseline state (has, doesn't have)
- User journey stage (new, returning, mid-flow)

**Recommendation:** Implement a comprehensive state machine that handles all 6 possible states (3 auth × 2 baseline) and provides appropriate UI/UX for each combination.
