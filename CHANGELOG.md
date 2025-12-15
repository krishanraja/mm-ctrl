# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.4.0] - 2024-12-14 - UX Overhaul & Data Pipeline Fixes

### Fixed
- **Homepage Header Layout**: Fixed misalignment of MindMaker logo, Sample button, and Sign In button on mobile. Elements now vertically centered with consistent styling
- **Mobile Viewport Scrolling**: Eliminated all vertical scrolling on question input screens. Using fixed positioning with safe-area-insets ensures Next button is always visible
- **Data Pipeline Reliability**: Added bulletproof fallback score computation when AI generation fails. Quiz answers now always produce dimension scores even if edge functions return empty data
- **Benchmark Score Display**: Fixed 0/100 score issue by computing scores from dimension averages when assessment record fetch fails

### Changed
- **HeroSection**: Removed excessive min-h-[80vh] constraint, reduced header element sizes for mobile, vertically centered button alignment
- **SampleResultsDialog**: Updated trigger button to use outline variant for visual consistency with Sign In button
- **UnifiedAssessment**: Switched from 100dvh to fixed positioning for bulletproof viewport handling on mobile
- **DeepProfileQuestionnaire**: Switched to fixed positioning with proper safe-area handling. Navigation buttons always visible without scrolling
- **SingleScrollResults**: Moved unlock teaser module ABOVE contact form as a hook to drive conversions

### Added
- **Fallback Score Computation**: New `computeDimensionScoresFromQuiz()` function generates dimension scores from quiz answers when AI fails
- **Fallback Tensions/Risks/Moves**: Default tensions, risk signals, and first moves generated from dimension scores if AI returns empty
- **viewport-fit=cover**: Added to viewport meta tag for proper iOS safe area handling
- **Safe Area Padding**: Using pt-safe-top and pb-safe-bottom utilities for mobile browser chrome accommodation

---

## [1.3.0] - 2024-12-14 - Mobile UX Premium Experience

### Changed
- **Progress Bar**: Now monotonically increasing only - never regresses. Uses displayProgress state with smooth time-based minimum floor for premium feel
- **Assessment Flow**: Removed contact collection form before results - users go directly from questions to Quick Personalization screen
- **Homepage Card**: Full-height premium card on mobile (min-h-[80vh]), larger typography and CTA buttons
- **Loading/Progress Screen**: Full-height premium card on mobile with centered content

### Removed
- **Toast Notifications**: Removed all toast notifications throughout the application - using inline UI feedback instead
- **ContactCollectionForm**: Removed from pre-results flow - contact collection now happens via unlock form on results page

### Added
- **Dimension Scores Preview**: Results page now shows dimension scores before requiring unlock
- **Risk Signal Preview**: Results page shows top risk signal before requiring unlock
- **Collapsible Unlock Form**: Unlock form is collapsed by default - users expand when interested
- **Resend Email Integration**: Unlock form now sends notification email via Resend when user creates account

### Fixed
- **Mobile Viewport Fit**: All input screens (assessment questions, deep profile, quick personalization) now fit within viewport without scrolling using h-[100dvh] and flex layouts
- **Assessment Error Handling**: Removed error toasts, errors are now logged silently and flow continues to results

---

## [1.2.0] - 2024-12-13 - UI/UX & Anti-Fragile Pipeline Update

### UI Improvements
- **HeroSection**: Reduced logo size by 25% (190px → 143px), optimized for mobile viewport
- **SingleScrollResults**: Reduced logo size by 25%, improved mobile spacing
- **PeerBubbleChart**: Completely rethought for mobile - responsive height, compact labels, smaller bubbles
- **DeepProfileQuestionnaire**: Full mobile viewport optimization, no vertical scrolling required
- **ProgressScreen**: Logo now loads first for better UX, uses full logo instead of icon
- **ContactCollectionForm**: Simplified to collect only Name, Email, Department, Primary AI Focus

### New Features
- **Voice Input**: Added voice recording option for "time waste examples" question using OpenAI Whisper
- **Primary AI Focus**: Added to UnlockResultsForm for comprehensive user profiling

### Anti-Fragile Pipeline Design
- **pipelineGuards.ts**: Complete rewrite with comprehensive failure point enumeration
  - 10 typed interfaces for safe data shapes
  - Schema-compliant enum constants for all dimension keys, tiers, risk keys, etc.
  - Mapping tables for AI output normalization
  - Default values for all data types
  - Normalization functions for all entity types
  - DB insert helpers with schema compliance
  - Comprehensive validation functions: validateContactData, validateAssessmentData, validateAIContent, validateAggregatedResults

### Code Quality
- Added VoiceInput component for reusable inline voice recording
- Improved mobile-first responsive design across all pages
- Uses 100dvh for proper mobile viewport handling

---

## [1.1.0] - 2024-12-13 - Production Readiness Audit

### Security & Data Flow
- Enhanced assessment ID restoration with retry logic in `UnifiedResults.tsx`
- Implemented proper Supabase auth signup flow in `SingleScrollResults.tsx` unlock form
- Added proper error handling for assessment ID validation

### UX Improvements
- **NotFound.tsx**: Complete redesign using design system tokens (was using hardcoded gray/blue colors)
- **Index.tsx**: Fixed assessment history view functionality - users can now view past assessments
- **HeroSection.tsx**: Added ARIA labels and screen reader support for typewriter animation
- **TensionsView.tsx**: Added proper error states and loading feedback
- **UnifiedResults.tsx**: Added retry logic and proper loading/error states for assessment ID restoration

### Bug Fixes
- **ContactCollectionForm.tsx**: Fixed consent checkbox handling (was converting boolean to string incorrectly)
- **PromptLibraryV2.tsx**: Fixed useEffect dependency warning
- **TensionsView.tsx**: Added proper TypeScript typing (was using `any`)
- **SingleScrollResults.tsx**: Implemented actual account creation in unlock form (was TODO)

### Code Quality
- Added ESLint suppression comments for intentional dependency array exclusions
- Improved TypeScript typing across multiple components
- Fixed React key warnings by using unique keys based on data fields

### Accessibility
- Added `sr-only` class for screen readers in HeroSection typewriter effect
- Added `aria-label` to animated heading for accessibility
- Improved focus states on consent checkbox

---

## [1.0.0] - 2024-12-09

### Initial Anti-Fragile Pipeline Implementation

#### Phase 1: Generation Status Flag Merging
- Fixed `runAssessment.ts` to fetch current status and merge flags
- Each successful DB insert now updates its corresponding flag
- Error log accumulates rather than overwrites

#### Phase 2: Populate Missing Tables
- Added dimension scores storage to `leader_dimension_scores`
- Added prompt sets storage to `leader_prompt_sets`
- Added first moves storage to `leader_first_moves`

#### Phase 3: AI Generate Response Structure
- Updated prompt to request comprehensive JSON response
- Added enum constraints for `risk.key`, `risk.level`, `scenario.key`, `prompt.category`
- Implemented `sanitizeEnums()` and `validateResponse()` functions
- Added retry logic with exponential backoff

#### Phase 4: Simplified Progress Tracking
- Removed fake timer-based progress from `UnifiedAssessment.tsx`
- Progress now relies solely on database-driven `useGenerationProgress` hook
- Single source of truth eliminates erratic behavior

#### Phase 5: Safety Guards
- LLM response validation before returning
- Enum sanitization to valid options
- Try/catch blocks around all DB operations
- Detailed error logging to `generation_status.error_log`

#### Phase 6: Audit & Logging
- Generation source tracking (`vertex-ai`, `openai`, `fallback`)
- Duration tracking for each generation
- Comprehensive console logging at each step

---

## Format Guide

### Types of changes
- **Added** for new features.
- **Changed** for changes in existing functionality.
- **Deprecated** for soon-to-be removed features.
- **Removed** for now removed features.
- **Fixed** for any bug fixes.
- **Security** for vulnerability fixes.

---

*Maintained by the development team. Update this file with every significant change.*
