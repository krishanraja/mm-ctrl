# Common Issues

Recurring bugs, architectural pain points, and solutions.

**Last Updated:** 2026-01-16

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

## Dec 2024 Pipeline Anti-Fragile Update

### Pipeline Failure Points Enumeration

The following failure points have been identified and guarded in `pipelineGuards.ts`:

#### 1. CREATE-LEADER-ASSESSMENT FUNCTION
| Failure Point | Guard |
|--------------|-------|
| contactData.email null/undefined | `validateContactData()` with fallback |
| leader lookup fails (RLS/network) | Fallback to create new leader |
| assessment insert fails (schema mismatch) | Explicit column mapping |

#### 2. AI-GENERATE FUNCTION
| Failure Point | Guard |
|--------------|-------|
| OpenAI timeout/fail | Gemini fallback |
| Gemini timeout/fail | Static fallback content |
| JSON parse fails | Regex extraction + parse retry |
| Enum values invalid | `sanitizeEnums()` normalization |
| Response validation fails | `validateResponse()` checks |

#### 3. RUN-ASSESSMENT ORCHESTRATOR
| Failure Point | Guard |
|--------------|-------|
| assessmentId null after create | Throw with clear message |
| aiContent arrays empty | `safeInsert` handles gracefully |
| DB insert fails (FK constraint) | Logged + continues |
| generation_status update fails | Caught + logged |

#### 4. AGGREGATE-LEADER-RESULTS
| Failure Point | Guard |
|--------------|-------|
| assessmentId fetch fails (RLS) | Compute from dimension scores |
| dimension_scores empty | Safe defaults array |
| Type casting fails | Explicit type guards |
| leadershipComparison generation fails | Returns null safely |

#### 5. UI AGGREGATION
| Failure Point | Guard |
|--------------|-------|
| data null | `safeDefaults` object |
| arrays null/undefined | `ensureArray()` |
| nested properties missing | `safeAccess()` |
| component receives wrong shape | Type validation |

---

## V3 Visual Issues (Jan 2026)

### Issue 16: Mobile Viewport Overflow
**Symptom**: Pages required vertical scrolling on mobile devices
**Root Cause**: Fixed heights, large padding, non-responsive components
**Solution**: Use `--mobile-vh`, compact padding on mobile, responsive components
**Status**: ✅ Resolved

### Issue 17: Peer Comparison Matrix Squashed on Mobile
**Symptom**: Chart was 500px height with large margins, unusable on mobile
**Root Cause**: Fixed chart dimensions, large font sizes
**Solution**: Responsive height (280px mobile, 400px desktop), compact labels
**Status**: ✅ Resolved

### Issue 18: Video Background Blocked
**Symptom**: Video background not visible, solid black background instead
**Root Cause**: `bg-background` on App.tsx root creating opaque layer
**Solution**: Remove `bg-background` from App.tsx, control backgrounds at component level
**Prevention**: ESLint rule, build validation script
**Status**: ✅ Resolved

### Issue 19: Double Underlines
**Symptom**: Text with SVG decorative underline also had CSS underline
**Root Cause**: Using both `underline` class and SVG underline
**Solution**: Remove `underline` class when using SVG decorative underlines
**Status**: ✅ Resolved

### Issue 20: Buttons With Visible Borders
**Symptom**: Primary buttons had visible borders that didn't match design
**Root Cause**: Default button styles not overridden
**Solution**: Add `border-0` explicitly to all button variants
**Status**: ✅ Resolved

### Issue 21: Inconsistent Card Padding
**Symptom**: Cards had varying padding across the app
**Root Cause**: No standardised padding scale
**Solution**: Standardised to `p-8 sm:p-12 md:p-16 lg:p-20` for cards
**Status**: ✅ Resolved

### Issue 22: Animation Too Bouncy
**Symptom**: Animations felt playful rather than executive
**Root Cause**: Spring physics too bouncy
**Solution**: Adjusted to stiffness: 400, damping: 35, mass: 0.8
**Status**: ✅ Resolved

---

## V3 Implementation Checklist

Use this checklist when implementing new features to ensure V3 standards are met.

### Design System Setup
- [ ] Using light mode color system
- [ ] All CSS variables defined (colors, shadows, spacing)
- [ ] Typography scale correct
- [ ] Border radius system followed
- [ ] Color contrast ratios tested

### Core Components
- [ ] Button component has all variants with `border-0`
- [ ] Card component uses correct padding and shadows
- [ ] All button states work (hover, focus, active, disabled)
- [ ] Card hover states work
- [ ] Accessibility verified (ARIA, keyboard navigation)

### Motion System
- [ ] Using `src/lib/motion.ts` variants
- [ ] Spring animations use correct physics
- [ ] Animation performance verified
- [ ] Tested on mobile devices

### Landing Page
- [ ] HeroSection uses no-scroll pattern
- [ ] Video background at 12% opacity
- [ ] Animated underline SVG works
- [ ] Trust indicators present
- [ ] Responsive breakpoints tested

### Dashboard
- [ ] MobileDashboard uses correct layout
- [ ] HeroStatusCard displays correctly
- [ ] PriorityCardStack works
- [ ] BottomNav fixed at bottom
- [ ] VoiceButton floating correctly
- [ ] Sheet component animates properly

### Content Pages
- [ ] Today page uses no-scroll pattern
- [ ] Voice page centered correctly
- [ ] Pulse page scrolls internally
- [ ] All pages fit mobile viewport

### Mobile Optimization
- [ ] Using `--mobile-vh` for heights
- [ ] Tested on real mobile devices
- [ ] No-scroll verified on all pages
- [ ] Safe areas handled (notch, home indicator)
- [ ] Touch targets minimum 44x44px

### Polish & Refinement
- [ ] Visual audit on desktop (1920x1080)
- [ ] Visual audit on mobile (375x812)
- [ ] All animations smooth
- [ ] Color consistency verified
- [ ] Typography hierarchy correct
- [ ] Loading states present
- [ ] Error states handled

---

## Memory Center Implementation (Jan 2026)

### Issue 23: Memory Table Not Found
**Symptom**: Memory Center shows "Failed to load memories" error
**Root Cause**: Database migrations not applied to Supabase instance
**Solution**: Run migrations via Supabase CLI: `supabase db push`
**Status**: ⚠️ Requires migration deployment

### Issue 24: Memory Settings Not Loading
**Symptom**: Privacy tab shows error loading settings
**Root Cause**: `user_memory_settings` table doesn't exist
**Solution**: Apply `20260125000000_memory_privacy_settings.sql` migration
**Status**: ⚠️ Requires migration deployment

### Memory Center Patterns

**React Query Integration:**
- All memory operations use `useMemoryQueries.ts` hook
- Optimistic updates for create/update/delete
- Automatic cache invalidation on mutations
- Inline error states (no toasts)

**Offline Draft Storage:**
- Drafts stored in localStorage with key `mindmaker-memory-draft`
- 24-hour expiration on drafts
- User prompted to restore or discard on sheet open

**Encryption:**
- Memory content encrypted at rest using AES-256-GCM
- Encryption key stored in `MEMORY_ENCRYPTION_KEY` env var
- Decryption only happens in edge functions, never client-side
- Never log raw memory content in console

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
- [ ] Verify no-scroll on mobile pages
- [ ] Check video background visibility
- [ ] Test all animations
- [ ] Verify touch targets are adequate
- [ ] Memory Center: verify RLS prevents cross-user access
- [ ] Memory Center: verify encryption key is set in production