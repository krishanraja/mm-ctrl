# COMPREHENSIVE IMPLEMENTATION PLAN
## Mindmaker for Leaders - Architectural Fixes with Checkpoints

**Plan Date:** 2026-01-22
**Approval Status:** ⏳ AWAITING USER APPROVAL (CP0)
**Paradigm Shift:** Assessment Tool → AI Coaching Platform

---

## IMPLEMENTATION PHILOSOPHY

Per strict diagnostic protocol:
- ✅ NO edits before this plan is approved
- ✅ NO unverified assumptions
- ✅ NO silent breakages
- ✅ Every change proven at checkpoints CP0-CP4
- ✅ Architectural fixes, not patches

---

## CHECKPOINT SYSTEM

Each fix phase has 5 checkpoints:

| Checkpoint | Purpose | Required Evidence | Failure Action |
|------------|---------|-------------------|----------------|
| **CP0** | Plan approval | User sign-off on proposed diffs | Revise plan |
| **CP1** | Environment ready | Clean build, no console errors | Fix environment |
| **CP2** | Core feature works | Primary flow succeeds | Debug before proceeding |
| **CP3** | Integration validated | Dependent features work | Fix regressions |
| **CP4** | Regression test | Full flow 3+ times, no breakage | Rollback if critical |

---

## THREE-PHASE APPROACH

### Phase 1: SPLASH SCREEN ARCHITECTURE FIX (Critical - Week 1)
**Severity:** 🔴 Critical - First impression failure
**Complexity:** Medium
**Timeline:** 2-3 days

### Phase 2: STRATEGIC ONBOARDING WIZARD (Critical - Week 2-3)
**Severity:** 🔴 Critical - Missing business context
**Complexity:** High
**Timeline:** 5-7 days

### Phase 3: SETTINGS & PROFILE ENHANCEMENT (High - Week 4)
**Severity:** 🟡 High - User empowerment gap
**Complexity:** Medium
**Timeline:** 3-4 days

---

# PHASE 1: SPLASH SCREEN ARCHITECTURE FIX

## Goal
Guarantee splash screen displays first, before any page content renders. Eliminate flicker completely.

## Root Causes Addressed
1. Simultaneous render (RouterProvider + SplashScreen)
2. Missing initialization state machine
3. No performance budget
4. Development environment bias

## Proposed Architecture

### Current (Broken)
```typescript
// App.tsx (lines 48-49)
{showSplash && <SplashScreen onComplete={handleSplashComplete} />}
<RouterProvider router={router} />  // ❌ Renders immediately!
```

### Proposed (Fixed)
```typescript
// App.tsx - State machine approach
const [appState, setAppState] = useState<'LOADING' | 'SPLASH' | 'READY'>('LOADING')

// Render logic
{appState === 'LOADING' && <InitializationLoader />}
{appState === 'SPLASH' && <SplashScreen onComplete={() => setAppState('READY')} />}
{appState === 'READY' && <RouterProvider router={router} />}
```

## Implementation Plan

### Files to Modify

#### 1. `/home/user/mindmaker-for-leaders/src/App.tsx`

**Lines 1-10: Add new imports**
```diff
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SplashScreen } from '@/components/ui/splash-screen'
import { initMobileViewport } from '@/utils/mobileViewport'
+ import { AppStateProvider, useAppState } from '@/contexts/AppStateContext'
+ import { InitializationLoader } from '@/components/ui/InitializationLoader'
```

**Lines 35-50: Replace splash logic with state machine**
```diff
- const [showSplash, setShowSplash] = useState(() => {
-   return !sessionStorage.getItem('mindmaker-splash-shown')
- })
-
- const handleSplashComplete = () => {
-   sessionStorage.setItem('mindmaker-splash-shown', 'true')
-   setShowSplash(false)
- }

+ function AppContent() {
+   const { appState, advanceToSplash, advanceToReady } = useAppState()
+
+   useEffect(() => {
+     // Initialize app (theme, viewport, etc.)
+     const initializeApp = async () => {
+       initMobileViewport()
+       // Wait minimum 100ms to ensure theme is applied
+       await new Promise(resolve => setTimeout(resolve, 100))
+
+       // Check if splash already shown
+       const splashShown = sessionStorage.getItem('mindmaker-splash-shown')
+       if (splashShown) {
+         advanceToReady()
+       } else {
+         advanceToSplash()
+       }
+     }
+
+     initializeApp()
+   }, [advanceToSplash, advanceToReady])
+
+   const handleSplashComplete = () => {
+     sessionStorage.setItem('mindmaker-splash-shown', 'true')
+     advanceToReady()
+   }
+
+   // Render based on state machine
+   if (appState === 'LOADING') {
+     return <InitializationLoader />
+   }
+
+   if (appState === 'SPLASH') {
+     return <SplashScreen onComplete={handleSplashComplete} />
+   }
+
+   // Only render router when READY
+   return <RouterProvider router={router} />
+ }
```

**Lines 48-60: Update main App return**
```diff
return (
  <ThemeProvider defaultTheme="dark" storageKey="mindmaker-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
-       {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
-       <RouterProvider router={router} />
+       <AppStateProvider>
+         <AppContent />
+       </AppStateProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
)
```

#### 2. `/home/user/mindmaker-for-leaders/src/contexts/AppStateContext.tsx` (NEW FILE)

**Purpose:** Centralized app initialization state machine

```typescript
// src/contexts/AppStateContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'

type AppState = 'LOADING' | 'SPLASH' | 'READY'

interface AppStateContextType {
  appState: AppState
  advanceToSplash: () => void
  advanceToReady: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>('LOADING')

  const advanceToSplash = () => {
    console.log('🎬 App state: LOADING → SPLASH')
    setAppState('SPLASH')
  }

  const advanceToReady = () => {
    console.log('✅ App state: SPLASH → READY')
    setAppState('READY')
  }

  return (
    <AppStateContext.Provider value={{ appState, advanceToSplash, advanceToReady }}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return context
}
```

#### 3. `/home/user/mindmaker-for-leaders/src/components/ui/InitializationLoader.tsx` (NEW FILE)

**Purpose:** Minimal loading state shown during LOADING phase

```typescript
// src/components/ui/InitializationLoader.tsx
export function InitializationLoader() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Mindmaker logo or simple spinner */}
        <div className="w-12 h-12 border-4 border-[var(--brand-teal)] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
```

#### 4. `/home/user/mindmaker-for-leaders/src/components/landing/HeroSection.tsx`

**Lines 1-20: Add lazy video loading**
```diff
<video
  autoPlay
  loop
  muted
  playsInline
+ loading="lazy"
+ preload="metadata"
  className="absolute inset-0 w-full h-full object-cover opacity-30"
>
  <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
</video>
```

**Add video skeleton (before video loads)**
```typescript
const [videoLoaded, setVideoLoaded] = useState(false)

// In JSX
{!videoLoaded && (
  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black opacity-30" />
)}

<video
  autoPlay
  loop
  muted
  playsInline
  loading="lazy"
  preload="metadata"
  onLoadedData={() => setVideoLoaded(true)}
  className="absolute inset-0 w-full h-full object-cover opacity-30"
>
  <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
</video>
```

#### 5. `/home/user/mindmaker-for-leaders/src/router.tsx`

**Add lazy loading for heavy routes**
```diff
import { createBrowserRouter, Navigate } from 'react-router-dom'
- import Landing from '@/pages/Landing'
- import Dashboard from '@/pages/Dashboard'
+ import { lazy, Suspense } from 'react'
+
+ const Landing = lazy(() => import('@/pages/Landing'))
+ const Dashboard = lazy(() => import('@/pages/Dashboard'))
+ const Diagnostic = lazy(() => import('@/pages/Diagnostic'))
+
+ function LazyWrapper({ children }: { children: React.ReactNode }) {
+   return <Suspense fallback={<LoadingPage />}>{children}</Suspense>
+ }
+
+ function LoadingPage() {
+   return (
+     <div className="min-h-screen bg-black flex items-center justify-center">
+       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--brand-teal)]"></div>
+     </div>
+   )
+ }

export const router = createBrowserRouter([
  {
    path: '/',
-   element: <Landing />,
+   element: <LazyWrapper><Landing /></LazyWrapper>,
  },
  // ... other routes
])
```

## Checkpoints

### CP0: Plan Approval ✅
**Action:** User reviews diffs above
**Expected:** User approves approach
**Verification:** User comment "CP0 approved"

### CP1: Environment Check
**Action:**
```bash
# 1. Install any new dependencies (none needed)
# 2. Run build
npm run build

# 3. Check for TypeScript errors
npm run type-check

# 4. Start dev server
npm run dev
```

**Expected:**
- ✅ Build succeeds with no errors
- ✅ No TypeScript errors
- ✅ Dev server starts on localhost:5173
- ✅ No console errors on initial load

**Verification Method:**
- Screenshot of clean console
- Build output showing 0 errors

### CP2: Core Feature Works
**Action:**
1. Clear browser cache (Cmd+Shift+Delete)
2. Clear sessionStorage: `sessionStorage.clear()`
3. Navigate to `http://localhost:5173`
4. Observe loading sequence

**Expected:**
1. InitializationLoader appears (black screen, spinner) - 100ms
2. SplashScreen fades in (0-400ms animation)
3. SplashScreen holds (2.5s total)
4. SplashScreen fades out (400ms)
5. Landing page renders (NO FLICKER before splash)
6. Video loads with skeleton background

**Verification Method:**
- Screen recording of full sequence
- Console logs show:
  ```
  🎬 App state: LOADING → SPLASH
  ✅ App state: SPLASH → READY
  ```
- No visible flicker of Landing page before splash

**Failure Criteria:**
- ❌ Landing page visible before splash
- ❌ Console errors
- ❌ Splash screen doesn't appear
- ❌ App stuck in LOADING state

**Debugging Steps if Failed:**
1. Check console for errors
2. Verify sessionStorage is clear
3. Confirm AppStateContext is providing state
4. Check React DevTools for state transitions

### CP3: Integration Validation
**Action:**
1. Test returning user flow (splash already shown):
   - Set `sessionStorage.setItem('mindmaker-splash-shown', 'true')`
   - Refresh page
   - Expect: Direct to Landing (no splash)

2. Test authentication flow:
   - Complete splash sequence
   - Navigate to `/auth`
   - Sign in
   - Verify no splash re-appears

3. Test navigation:
   - From Landing → `/voice`
   - From `/voice` → back to Landing
   - Verify splash doesn't re-trigger

4. Test mobile:
   - Open Chrome DevTools
   - Switch to mobile viewport (iPhone 12 Pro)
   - Repeat core flow
   - Verify no layout shifts

5. Test slow network:
   - Chrome DevTools → Network tab
   - Throttle to "Slow 3G"
   - Clear cache, refresh
   - Verify splash stays until video skeleton loads

**Expected:**
- ✅ Returning users skip splash
- ✅ Auth flow doesn't re-trigger splash
- ✅ Navigation doesn't break state
- ✅ Mobile viewport works perfectly
- ✅ Slow network: splash prevents flicker

**Verification Method:**
- Test each scenario
- Record results in checklist
- Screenshot console logs

### CP4: Regression Test
**Action:**
Run full user flow 3 times:

**Flow 1: New User (First Visit)**
1. Clear sessionStorage
2. Navigate to `/`
3. Observe splash sequence
4. Click "Tap to speak"
5. Navigate to Voice page
6. Return to home
7. Sign in (if applicable)

**Flow 2: Returning User**
1. Refresh page (splash should skip)
2. Navigate to `/diagnostic`
3. Complete quiz flow
4. View results

**Flow 3: Mobile Simulation**
1. Clear sessionStorage
2. Switch to mobile viewport
3. Repeat Flow 1 on mobile
4. Verify no horizontal scroll
5. Verify mic button accessible

**Expected:**
- ✅ All 3 flows complete without errors
- ✅ No console errors in any flow
- ✅ No visual regressions
- ✅ Splash only appears on first visit
- ✅ All interactions work as before

**Verification Method:**
- Checklist of 3 flows completed
- No errors logged
- Video recording of mobile flow

**Rollback Criteria:**
- If 2+ regressions found
- If critical path broken (can't complete assessment)
- If mobile completely broken

---

# PHASE 2: STRATEGIC ONBOARDING WIZARD

## Goal
Capture industry, sector, strategic problems, obstacles, and fears through guided wizard with voice-first option.

## Root Causes Addressed
1. Product positioning mismatch (assessment vs. coaching)
2. Voice-first extraction over structured collection
3. No user journey mapping
4. Database schema reflects V1 not V2
5. No North Star metric for personalization quality

## Proposed Architecture

### New User Journey

```
New User Arrives
  ↓
[Splash Screen] (fixed in Phase 1)
  ↓
[Landing Page] - Value prop + CTA
  ↓
User clicks "Get Started" or "Tap to Speak"
  ↓
┌─────────────────────────────────────┐
│  ONBOARDING WIZARD (NEW)            │
│                                     │
│  Step 1: Welcome & Why We Ask       │
│  "Let's understand your world"      │
│                                     │
│  Step 2: Business Context           │
│  - Role & Title                     │
│  - Company & Industry               │
│  - Company Stage & Size             │
│                                     │
│  Step 3: North Star Question        │
│  "What keeps you up at night?"      │
│  - Voice recording (preferred)      │
│  - OR text input                    │
│  - AI extracts: problems, obstacles,│
│    fears, strategic goals           │
│                                     │
│  Step 4: Verification               │
│  Show extracted facts, editable     │
│                                     │
│  Step 5: Quick Preferences          │
│  - Communication style              │
│  - Primary AI focus                 │
│                                     │
│  Progress: [====== ] 60% Complete   │
└─────────────────────────────────────┘
  ↓
[Existing Assessment Flow]
  OR
[Dashboard] (if already completed)
```

### Database Changes Required

#### New Migration: `add_strategic_context_fields.sql`

```sql
-- Add fields to leaders table
ALTER TABLE public.leaders
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_stage TEXT,
  ADD COLUMN IF NOT EXISTS strategic_problem TEXT,
  ADD COLUMN IF NOT EXISTS biggest_obstacle TEXT,
  ADD COLUMN IF NOT EXISTS biggest_fear TEXT,
  ADD COLUMN IF NOT EXISTS strategic_goal TEXT,
  ADD COLUMN IF NOT EXISTS quarterly_focus TEXT,
  ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

-- Create index on industry for benchmarking
CREATE INDEX IF NOT EXISTS idx_leaders_industry
  ON public.leaders(industry)
  WHERE industry IS NOT NULL AND archived_at IS NULL;

-- Create index on company_stage
CREATE INDEX IF NOT EXISTS idx_leaders_company_stage
  ON public.leaders(company_stage)
  WHERE company_stage IS NOT NULL AND archived_at IS NULL;

-- Add profile completeness calculation function
CREATE OR REPLACE FUNCTION calculate_profile_completeness(leader_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completeness INTEGER := 0;
  leader_record RECORD;
BEGIN
  SELECT * INTO leader_record FROM public.leaders WHERE id = leader_id;

  -- Basic fields (10 points each)
  IF leader_record.name IS NOT NULL THEN completeness := completeness + 10; END IF;
  IF leader_record.email IS NOT NULL THEN completeness := completeness + 10; END IF;

  -- Context fields (15 points each)
  IF leader_record.role IS NOT NULL THEN completeness := completeness + 15; END IF;
  IF leader_record.title IS NOT NULL THEN completeness := completeness + 15; END IF;
  IF leader_record.company IS NOT NULL THEN completeness := completeness + 10; END IF;
  IF leader_record.industry IS NOT NULL THEN completeness := completeness + 15; END IF;

  -- Strategic fields (5 points each)
  IF leader_record.strategic_problem IS NOT NULL THEN completeness := completeness + 5; END IF;
  IF leader_record.biggest_obstacle IS NOT NULL THEN completeness := completeness + 5; END IF;
  IF leader_record.biggest_fear IS NOT NULL THEN completeness := completeness + 5; END IF;
  IF leader_record.strategic_goal IS NOT NULL THEN completeness := completeness + 5; END IF;

  -- Cap at 100
  IF completeness > 100 THEN completeness := 100; END IF;

  RETURN completeness;
END;
$$ LANGUAGE plpgsql;

-- Grant execute
GRANT EXECUTE ON FUNCTION calculate_profile_completeness TO authenticated;
```

## Implementation Plan

### Files to Create

#### 1. `/home/user/mindmaker-for-leaders/src/components/onboarding/OnboardingWizard.tsx` (NEW)

**Purpose:** Multi-step wizard for strategic context collection

```typescript
// src/components/onboarding/OnboardingWizard.tsx
import { useState } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { BusinessContextStep } from './steps/BusinessContextStep'
import { NorthStarStep } from './steps/NorthStarStep'
import { VerificationStep } from './steps/VerificationStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { ProgressBar } from './ProgressBar'

type OnboardingStep = 'welcome' | 'business' | 'northstar' | 'verify' | 'preferences'

interface OnboardingData {
  // Business context
  role?: string
  title?: string
  company?: string
  industry?: string
  companyStage?: string
  companySize?: string

  // North Star (extracted from voice/text)
  strategicProblem?: string
  biggestObstacle?: string
  biggestFear?: string
  strategicGoal?: string

  // Preferences
  communicationStyle?: string
  primaryFocus?: string
}

export function OnboardingWizard({ onComplete }: { onComplete: (data: OnboardingData) => void }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [data, setData] = useState<OnboardingData>({})

  const steps: OnboardingStep[] = ['welcome', 'business', 'northstar', 'verify', 'preferences']
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    } else {
      onComplete(data)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ProgressBar progress={progress} />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {currentStep === 'welcome' && (
            <WelcomeStep onNext={nextStep} />
          )}

          {currentStep === 'business' && (
            <BusinessContextStep
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'northstar' && (
            <NorthStarStep
              onUpdate={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'verify' && (
            <VerificationStep
              data={data}
              onUpdate={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'preferences' && (
            <PreferencesStep
              data={data}
              onUpdate={updateData}
              onComplete={() => onComplete(data)}
              onBack={prevStep}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

#### 2. `/home/user/mindmaker-for-leaders/src/components/onboarding/steps/NorthStarStep.tsx` (NEW)

**Purpose:** Voice-first capture of problems, obstacles, fears

```typescript
// src/components/onboarding/steps/NorthStarStep.tsx
import { useState } from 'react'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface NorthStarStepProps {
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function NorthStarStep({ onUpdate, onNext, onBack }: NorthStarStepProps) {
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleVoiceComplete = async (transcript: string) => {
    setIsProcessing(true)

    try {
      // Call edge function to extract strategic context
      const response = await fetch('/api/extract-strategic-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript })
      })

      const extracted = await response.json()

      onUpdate({
        strategicProblem: extracted.problem,
        biggestObstacle: extracted.obstacle,
        biggestFear: extracted.fear,
        strategicGoal: extracted.goal
      })

      onNext()
    } catch (error) {
      console.error('Extraction failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return

    setIsProcessing(true)

    try {
      const response = await fetch('/api/extract-strategic-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textInput })
      })

      const extracted = await response.json()

      onUpdate({
        strategicProblem: extracted.problem,
        biggestObstacle: extracted.obstacle,
        biggestFear: extracted.fear,
        strategicGoal: extracted.goal
      })

      onNext()
    } catch (error) {
      console.error('Extraction failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-[var(--brand-teal)]">
          What keeps you up at night?
        </h2>
        <p className="text-gray-400 text-lg">
          Understanding your biggest challenge helps us give you relevant, actionable advice.
        </p>
        <p className="text-sm text-gray-500">
          🔒 Your response is private and helps us benchmark you against similar leaders in your industry.
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={mode === 'voice' ? 'default' : 'outline'}
          onClick={() => setMode('voice')}
        >
          🎤 Voice (Recommended)
        </Button>
        <Button
          variant={mode === 'text' ? 'default' : 'outline'}
          onClick={() => setMode('text')}
        >
          ✍️ Type
        </Button>
      </div>

      {mode === 'voice' ? (
        <div className="flex justify-center">
          <VoiceRecorder
            onComplete={handleVoiceComplete}
            isProcessing={isProcessing}
            prompt="Tell us: What's your biggest business challenge right now? What's holding you back? What are you worried about?"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <Textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Describe your biggest challenge, what's holding you back, and what concerns you most..."
            className="min-h-[200px] bg-gray-900 border-gray-700 text-white"
          />
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'voice' && (
        <div className="text-center">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
```

#### 3. New Edge Function: `extract-strategic-context`

```typescript
// supabase/functions/extract-strategic-context/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
})

serve(async (req) => {
  try {
    const { transcript } = await req.json()

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Extract strategic business context from this leader's statement. Return ONLY valid JSON.

Transcript:
"""
${transcript}
"""

Extract:
- problem: The main business problem or challenge (1-2 sentences)
- obstacle: The primary obstacle holding them back (1 sentence)
- fear: Their biggest fear or concern (1 sentence, or null if not mentioned)
- goal: Their strategic goal or desired outcome (1 sentence)

Return format:
{
  "problem": "...",
  "obstacle": "...",
  "fear": "..." or null,
  "goal": "..."
}

Be empathetic but concise. If fear is not explicitly stated, set to null (don't infer).`
      }]
    })

    const extracted = JSON.parse(response.content[0].text)

    return new Response(JSON.stringify(extracted), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

### Files to Modify

#### 4. `/home/user/mindmaker-for-leaders/src/pages/Landing.tsx`

**Add onboarding entry point**

```diff
+ import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
+ import { useState } from 'react'

export default function Landing() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
+ const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // ... existing baseline check logic
  }, [user, isLoading, navigate])

+ const handleOnboardingComplete = async (data: OnboardingData) => {
+   // Save to database
+   const { error } = await supabase
+     .from('leaders')
+     .update({
+       role: data.role,
+       title: data.title,
+       company: data.company,
+       industry: data.industry,
+       company_size_band: data.companySize,
+       strategic_problem: data.strategicProblem,
+       biggest_obstacle: data.biggestObstacle,
+       biggest_fear: data.biggestFear,
+       strategic_goal: data.strategicGoal,
+     })
+     .eq('user_id', user.id)
+
+   if (!error) {
+     // Navigate to assessment or dashboard
+     navigate('/diagnostic')
+   }
+ }

+ if (showOnboarding) {
+   return <OnboardingWizard onComplete={handleOnboardingComplete} />
+ }

  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection />
      {/* ... */}
    </div>
  )
}
```

## Checkpoints (Phase 2)

### CP0: Plan Approval
**Action:** User reviews onboarding wizard design
**Expected:** User approves UX flow and field collection
**Verification:** User comment "CP0 Phase 2 approved"

### CP1: Database Migration
**Action:**
```bash
# Create migration
supabase migration new add_strategic_context_fields

# Apply migration locally
supabase db reset

# Verify columns exist
supabase db execute "SELECT column_name FROM information_schema.columns WHERE table_name = 'leaders' AND column_name IN ('title', 'industry', 'strategic_problem');"
```

**Expected:**
- ✅ Migration file created
- ✅ Columns added to leaders table
- ✅ Indexes created
- ✅ Function `calculate_profile_completeness` exists

### CP2: Onboarding Wizard Renders
**Action:**
1. Create all wizard step components
2. Test wizard navigation:
   - Welcome → Business → North Star → Verify → Preferences
3. Fill out each step
4. Verify data flows between steps

**Expected:**
- ✅ All 5 steps render
- ✅ Progress bar updates correctly
- ✅ Back/Next navigation works
- ✅ Data persists across steps

### CP3: Voice Extraction Works
**Action:**
1. Deploy `extract-strategic-context` edge function
2. Test voice recording on North Star step
3. Verify extraction returns:
   - problem
   - obstacle
   - fear (or null)
   - goal
4. Test text input fallback

**Expected:**
- ✅ Voice recording captures audio
- ✅ Transcription completes
- ✅ Extraction returns valid JSON
- ✅ Extracted data appears in verification step
- ✅ Text input works as fallback

### CP4: End-to-End Onboarding
**Action:**
Complete full onboarding flow 3 times:
1. Voice mode (primary path)
2. Text mode (fallback path)
3. Mobile (touch interactions)

**Expected:**
- ✅ Data saves to `leaders` table
- ✅ Profile completeness calculates correctly
- ✅ User redirected to next step (diagnostic or dashboard)
- ✅ No data loss between steps

---

# PHASE 3: SETTINGS & PROFILE ENHANCEMENT

## Goal
Create 10/10 settings page with profile editing, user memory dashboard, and accessible navigation.

## Root Causes Addressed
1. Business model mismatch (one-time → ongoing)
2. Data visibility philosophy (black box → glass box)
3. MVP mindset calcification
4. No information architecture planning
5. Mobile navigation constraints

## Proposed Architecture

### Settings Page Redesign

```
/settings (Tabbed Interface)

┌─────────────────────────────────────────────┐
│ ⚙️ Settings                        [Search] │
├─────────────────────────────────────────────┤
│  [Account] [Work Context] [Privacy & Data]  │
│  [Notifications] [Preferences]              │
├─────────────────────────────────────────────┤
│                                             │
│  ACCOUNT TAB                                │
│  ┌─────────────────────────────────────┐   │
│  │ Profile                             │   │
│  │ • Name: [John Doe      ] [Edit]     │   │
│  │ • Email: john@company.com ✅         │   │
│  │ • Photo: [Upload]                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Security                            │   │
│  │ • Password: ••••••• [Change]        │   │
│  │ • Active Sessions: 2 [Manage]       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  WORK CONTEXT TAB                           │
│  ┌─────────────────────────────────────┐   │
│  │ Role & Company                      │   │
│  │ • Title: [VP of Product] [Edit]     │   │
│  │ • Role: Product                     │   │
│  │ • Company: [Acme Inc] [Edit]        │   │
│  │ • Industry: [SaaS] [Edit]           │   │
│  │                                     │   │
│  │ Profile Completeness: 85% ████░     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Strategic Context                   │   │
│  │ • Top Challenge: [Edit]             │   │
│  │   "Scaling team while maintaining   │   │
│  │   quality"                          │   │
│  │                                     │   │
│  │ • Biggest Obstacle: [Edit]          │   │
│  │   "Limited budget for hiring"       │   │
│  │                                     │   │
│  │ • Current Goal: [Edit]              │   │
│  │   "Launch V2 by Q2"                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  PRIVACY & DATA TAB                         │
│  ┌─────────────────────────────────────┐   │
│  │ User Memory                         │   │
│  │ What we know about you:             │   │
│  │                                     │   │
│  │ 📊 Role: VP of Product [Delete]     │   │
│  │ 🏢 Company: Acme Inc [Delete]       │   │
│  │ 🎯 Goal: Launch V2 [Delete]         │   │
│  │                                     │   │
│  │ [+ Add fact manually]               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Data Controls                       │   │
│  │ • Export All Data [Download]        │   │
│  │ • Delete Account [Delete]           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Implementation Plan

### Files to Modify

#### 1. `/home/user/mindmaker-for-leaders/src/pages/Settings.tsx`

**Complete rewrite with tabbed interface**

```typescript
// src/pages/Settings.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountTab } from '@/components/settings/AccountTab'
import { WorkContextTab } from '@/components/settings/WorkContextTab'
import { PrivacyDataTab } from '@/components/settings/PrivacyDataTab'
import { NotificationsTab } from '@/components/settings/NotificationsTab'
import { PreferencesTab } from '@/components/settings/PreferencesTab'
import { SettingsSearch } from '@/components/settings/SettingsSearch'

export default function Settings() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">⚙️ Settings</h1>
          <SettingsSearch />
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="work">Work Context</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountTab />
          </TabsContent>

          <TabsContent value="work">
            <WorkContextTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyDataTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

#### 2. `/home/user/mindmaker-for-leaders/src/components/settings/WorkContextTab.tsx` (NEW)

**Inline editing for strategic context**

```typescript
// src/components/settings/WorkContextTab.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { EditableField } from './EditableField'
import { Progress } from '@/components/ui/progress'

export function WorkContextTab() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [completeness, setCompleteness] = useState(0)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('leaders')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setProfile(data)
      calculateCompleteness(data)
    }
  }

  const calculateCompleteness = (data: any) => {
    const fields = [
      'name', 'email', 'role', 'title', 'company', 'industry',
      'strategic_problem', 'biggest_obstacle', 'strategic_goal'
    ]
    const filled = fields.filter(f => data[f] != null && data[f] !== '')
    setCompleteness(Math.round((filled.length / fields.length) * 100))
  }

  const handleUpdate = async (field: string, value: string) => {
    const { error } = await supabase
      .from('leaders')
      .update({ [field]: value })
      .eq('user_id', user.id)

    if (!error) {
      setProfile({ ...profile, [field]: value })
      calculateCompleteness({ ...profile, [field]: value })
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Completeness */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Profile Completeness</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Your profile is {completeness}% complete</span>
            <span className="text-[var(--brand-teal)]">{completeness}/100</span>
          </div>
          <Progress value={completeness} className="h-2" />
        </div>
      </div>

      {/* Role & Company */}
      <div className="bg-gray-900 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">Role & Company</h3>

        <EditableField
          label="Title"
          value={profile?.title || ''}
          onSave={(value) => handleUpdate('title', value)}
          placeholder="e.g., VP of Product"
          helpText="Your official job title"
        />

        <EditableField
          label="Role"
          value={profile?.role || ''}
          onSave={(value) => handleUpdate('role', value)}
          type="select"
          options={['Product', 'Engineering', 'Marketing', 'Sales', 'Operations', 'Executive']}
          helpText="Your functional area"
        />

        <EditableField
          label="Company"
          value={profile?.company || ''}
          onSave={(value) => handleUpdate('company', value)}
          placeholder="e.g., Acme Inc"
        />

        <EditableField
          label="Industry"
          value={profile?.industry || ''}
          onSave={(value) => handleUpdate('industry', value)}
          type="select"
          options={['SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'Manufacturing', 'Consulting', 'Other']}
          helpText="Used for peer benchmarking"
        />
      </div>

      {/* Strategic Context */}
      <div className="bg-gray-900 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">Strategic Context</h3>

        <EditableField
          label="Top Challenge"
          value={profile?.strategic_problem || ''}
          onSave={(value) => handleUpdate('strategic_problem', value)}
          type="textarea"
          placeholder="What's your biggest business challenge?"
          helpText="Helps us tailor advice to your situation"
        />

        <EditableField
          label="Biggest Obstacle"
          value={profile?.biggest_obstacle || ''}
          onSave={(value) => handleUpdate('biggest_obstacle', value)}
          type="textarea"
          placeholder="What's holding you back?"
        />

        <EditableField
          label="Current Goal"
          value={profile?.strategic_goal || ''}
          onSave={(value) => handleUpdate('strategic_goal', value)}
          type="textarea"
          placeholder="What are you trying to achieve?"
        />
      </div>
    </div>
  )
}
```

#### 3. `/home/user/mindmaker-for-leaders/src/components/settings/PrivacyDataTab.tsx` (NEW)

**User memory dashboard**

```typescript
// src/components/settings/PrivacyDataTab.tsx
import { useEffect, useState } from 'react'
import { useUserMemory } from '@/hooks/useUserMemory'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function PrivacyDataTab() {
  const { memories, deleteFact } = useUserMemory()
  const [facts, setFacts] = useState<any[]>([])

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    const allFacts = await memories.getAllFacts()
    setFacts(allFacts)
  }

  const handleDelete = async (factId: string) => {
    const confirmed = confirm('Delete this fact? This cannot be undone.')
    if (confirmed) {
      await deleteFact(factId)
      loadMemories()
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      identity: '👤',
      business: '🏢',
      objective: '🎯',
      blocker: '🚧',
      preference: '⚙️'
    }
    return icons[category] || '📝'
  }

  return (
    <div className="space-y-6">
      {/* User Memory */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">User Memory</h3>
        <p className="text-sm text-gray-400 mb-6">
          These facts were extracted from your conversations. You can delete any incorrect information.
        </p>

        {facts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No facts captured yet</p>
        ) : (
          <div className="space-y-3">
            {facts.map((fact) => (
              <div key={fact.id} className="flex items-start justify-between bg-gray-800 p-4 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getCategoryIcon(fact.category)}</span>
                  <div>
                    <div className="font-medium">{fact.fact_text}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {fact.category} • Confidence: {Math.round(fact.confidence * 100)}%
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(fact.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Export */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Data Export</h3>
        <p className="text-sm text-gray-400 mb-4">
          Download all your data in JSON format
        </p>
        <Button variant="outline">Download All Data</Button>
      </div>

      {/* Account Deletion */}
      <div className="bg-gray-900 p-6 rounded-lg border border-red-900/50">
        <h3 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h3>
        <p className="text-sm text-gray-400 mb-4">
          Permanently delete your account and all data
        </p>
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  )
}
```

#### 4. `/home/user/mindmaker-for-leaders/src/components/dashboard/mobile/BottomNav.tsx`

**Add settings to mobile navigation**

```diff
<nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
  <div className="flex justify-around items-center h-16">
    <NavItem icon={<Home />} label="Home" path="/" />
    <NavItem icon={<BarChart />} label="Pulse" path="/pulse" />
    <NavItem icon={<Calendar />} label="Today" path="/today" />
    <NavItem icon={<Mic />} label="Voice" path="/voice" />
+   <NavItem icon={<Settings />} label="Settings" path="/settings" />
  </div>
</nav>
```

## Checkpoints (Phase 3)

### CP0: Plan Approval
**Action:** User reviews settings redesign
**Expected:** User approves tabbed UI and information architecture
**Verification:** User comment "CP0 Phase 3 approved"

### CP1: Tabs Render
**Action:**
1. Create tab components
2. Test tab switching
3. Verify responsive layout

**Expected:**
- ✅ 5 tabs render
- ✅ Tab switching works
- ✅ Mobile stacks tabs vertically
- ✅ No layout breaks

### CP2: Inline Editing Works
**Action:**
1. Test editing each field in Work Context tab
2. Verify database updates
3. Test validation (required fields, format)

**Expected:**
- ✅ Click field → edit mode
- ✅ Save → updates database
- ✅ Cancel → reverts changes
- ✅ Validation shows errors

### CP3: User Memory Dashboard
**Action:**
1. View all extracted facts
2. Delete a fact
3. Verify deletion persists

**Expected:**
- ✅ Facts display with category icons
- ✅ Confidence shown
- ✅ Delete confirmation dialog
- ✅ Fact removed from database

### CP4: Mobile Navigation
**Action:**
1. Test on mobile viewport
2. Navigate to Settings from bottom nav
3. Complete settings edit on mobile

**Expected:**
- ✅ Settings icon visible in bottom nav
- ✅ Tap → navigates to /settings
- ✅ Tabs work on mobile
- ✅ Editing works on touch device

---

## ROLLBACK PLAN

If any phase fails critically:

### Phase 1 Rollback
```bash
# Revert App.tsx changes
git checkout HEAD -- src/App.tsx

# Remove new files
rm -rf src/contexts/AppStateContext.tsx
rm -rf src/components/ui/InitializationLoader.tsx

# Restart dev server
npm run dev
```

### Phase 2 Rollback
```bash
# Revert database migration
supabase db reset

# Remove onboarding files
rm -rf src/components/onboarding/

# Remove edge function
rm -rf supabase/functions/extract-strategic-context/
```

### Phase 3 Rollback
```bash
# Restore old Settings.tsx
git checkout HEAD -- src/pages/Settings.tsx

# Remove new components
rm -rf src/components/settings/
```

---

## SUCCESS CRITERIA (ALL PHASES)

### Phase 1 Success
- ✅ Splash screen always appears first (no flicker)
- ✅ Works on slow 3G networks
- ✅ Mobile viewport perfect
- ✅ Returning users skip splash correctly

### Phase 2 Success
- ✅ Onboarding wizard completes in < 5 min
- ✅ Industry, sector, problems, obstacles, fears captured
- ✅ Profile completeness shows 80%+ after onboarding
- ✅ Voice extraction accuracy > 90%

### Phase 3 Success
- ✅ Settings accessible from mobile nav
- ✅ All profile fields editable inline
- ✅ User memory visible and manageable
- ✅ Settings navigation intuitive (< 2 clicks to any setting)

---

## TIMELINE SUMMARY

| Phase | Duration | Checkpoints | Blockers |
|-------|----------|-------------|----------|
| Phase 1 | 2-3 days | CP0-CP4 | None (can start immediately after approval) |
| Phase 2 | 5-7 days | CP0-CP4 | Requires Phase 1 complete (splash must work first) |
| Phase 3 | 3-4 days | CP0-CP4 | Independent (can run parallel to Phase 2) |
| **Total** | **10-14 days** | **15 checkpoints** | **None** |

---

## APPROVAL REQUIRED

**User must approve each phase at CP0 before implementation begins.**

Reply with:
- "CP0 Phase 1 approved" to start splash fix
- "CP0 Phase 2 approved" to start onboarding wizard
- "CP0 Phase 3 approved" to start settings enhancement
- "CP0 All phases approved" to start all work

**NO code changes will be made until explicit approval is given.**

This plan follows strict diagnostic protocol:
✅ Complete diagnosis (DIAGNOSIS.md)
✅ Root cause analysis (ROOT_CAUSE.md)
✅ Implementation plan with checkpoints (this document)
⏳ Awaiting approval to proceed
