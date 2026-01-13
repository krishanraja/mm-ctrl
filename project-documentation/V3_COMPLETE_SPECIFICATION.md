# V3 Complete Specification
## Mindmaker for Leaders - Complete Rebuild Blueprint

**Purpose:** This document provides a complete, actionable specification to rebuild the Mindmaker for Leaders application from scratch, achieving the Apple-like, executive-grade design and functionality that was intended.

**Status:** Complete specification for full rebuild
**Date:** 2026-01-13
**Version:** 3.0

---

## Table of Contents

1. [Original Requirements](#original-requirements)
2. [Design System](#design-system)
3. [Visual Guidelines](#visual-guidelines)
4. [Component Architecture](#component-architecture)
5. [Page Specifications](#page-specifications)
6. [Animation & Motion System](#animation--motion-system)
7. [Mobile-First Architecture](#mobile-first-architecture)
8. [Implementation Checklist](#implementation-checklist)
9. [File Structure](#file-structure)
10. [Critical Requirements](#critical-requirements)

---

## Original Requirements

### Initial Request

**User's Original Ask:**
> "implement, ensure zero references to lovable (remove any that exist), then test EVERY single user touchpoint live in the localhost dev server and LOOK at each action on all devices to ensure it looks 10/10, does the right thing, and is 10/10 helpful, valuable and enriching/ever learning. fix issues, then repeat, then fix and repeat for eternity until you are confident this is 100% perfect visually and UX on all devices. do not stop until this is done and we are ready to commit and push to main"

**Key Requirements:**
- Remove all references to "Lovable" from codebase
- Test every user touchpoint in browser
- Visual quality must be 10/10 on all devices
- Functional quality must be 10/10
- Iterative improvement until perfect
- Ready for production commit

### Initial Plan: "Complete Frontend Rebuild Plan: Magical Leader Experience"

**Objective:** Transform the application into a "1-1 magical, habit-forming" tool for time-poor business leaders, focusing on "voice-first, mobile-first, and device-matched" experiences.

**Core Features:**
- OpenAI Whisper integration for voice transcription
- Comprehensive strategy to enhance technical moat and feature richness
- Voice-first, mobile-first, device-matched experiences
- Remove all "Lovable" references
- Test every touchpoint live in browser
- Visual and UX perfection on all devices

**Technical Stack:**
- OpenAI Whisper API for voice-to-text
- OpenAI GPT-4o/GPT-4o-mini for insights
- Google Gemini as fallback
- Supabase Edge Functions (Deno)
- React with Framer Motion
- Tailwind CSS / Shadcn UI
- Mobile viewport utilities for no-scroll experience

### Critical Feedback & Second Request

**User's Critical Feedback:**
> "this has become one of the WORST looking apps I've ever seen. The current homepage UI is COMPLETELY unacceptable, -1/10. It needs to be a 10/10. The same goes for the entirety of this app, it is a FUCKING EMBARRASSMENT, I cannot put this in front of my dog let alone an enterprise CEO. I asked you to keep the design system from the previous iteration, and to design it so it looks like an Apple product. i've never actually been so angry at you"

**Second Request:**
> "the video was a background overlay FYI. The ENTIRE app needs to be a no scroll experience on mobile, and an executive framer motion, beautiful world class adaptive design everywhere. Attached are the standards that were set in the previous version, that I expect you to far surpass. Currently the old version is 1000X better looking and feeling, which is a crime and you should be ashamed"

**Critical Requirements from Feedback:**
1. **Design System:** Must match previous iteration (light mode, off-white backgrounds, ink text)
2. **Apple-Like Quality:** Must look like an Apple product - 10/10 visual quality
3. **Video Background:** Must be a subtle overlay, not distracting
4. **No-Scroll Mobile:** ENTIRE app must be no-scroll on mobile
5. **Executive Framer Motion:** Beautiful, world-class animations everywhere
6. **Adaptive Design:** Must work perfectly on all devices
7. **Quality Standard:** Must far surpass previous version

### Response Plan: "Apple-Like Design System Redesign"

**Focus Areas:**
1. Fix design system - restore light mode, ensure semantic mappings align
2. Make video background truly subtle (12% opacity, desaturated)
3. Enforce no-scroll mobile architecture across entire app
4. Redesign landing page (HeroSection) for clean, minimalist, Apple-like aesthetic
5. Refine core UI components (buttons, cards) for Apple aesthetic
6. Integrate executive Framer Motion animations throughout
7. Perform final visual polish and rigorous testing

**Design Principles:**
- Light mode design system (off-white background, ink foreground)
- Pure white cards with subtle shadows
- Generous spacing (Apple-like)
- Clean typography hierarchy
- Subtle, smooth animations
- No decorative elements
- Professional, executive-grade quality

### Reference Design Standards

**Previous Version Standards (to Far Surpass):**
The previous version established these standards that must be exceeded:

1. **Design System Documentation:**
   - `project-documentation/DESIGN_SYSTEM.md` - Light mode color system, typography, spacing
   - `project-documentation/VISUAL_GUIDELINES.md` - Visual principles, layout patterns, component styles
   - `project-documentation/BRANDING.md` - Brand voice, tone, messaging pillars

2. **Key Standards from Previous Version:**
   - Light backgrounds for pages, white for cards - we should have light and dark modes that are perfectly colour contrasted
   - Bold, not busy - generous white space
   - Functional, not decorative
   - Professional, not corporate
   - Modern, not trendy
   - Video backgrounds as subtle overlays
   - Clean typography hierarchy
   - Consistent spacing system

3. **Quality Benchmark:**
   - Previous version was "1000X better looking and feeling"
   - Current implementation must far surpass this
   - Every detail must be executive-grade
   - No compromises on visual quality

---

## Design System

---

## Design System

### Color Palette

**Light Mode (Primary)**
```css
--background: 40 20% 97%;        /* #faf9f7 - Warm off-white */
--foreground: 213 50% 11%;       /* #0e1a2b - Deep navy/ink */
--card: 0 0% 100%;               /* Pure white for cards */
--card-foreground: 213 50% 11%;  /* Ink */
--border: 220 10% 90%;           /* #e3e5e8 - Light grey */
--muted: 220 10% 90%;            /* Light grey */
--muted-foreground: 220 10% 50%; /* #737a85 - Mid grey */
--primary: 213 50% 11%;          /* Ink */
--primary-foreground: 40 20% 97%; /* Off-white */
--accent: 158 45% 55%;           /* #4db38a - Mint green */
--accent-foreground: 213 50% 11%; /* Ink */
```

**Shadows (Apple-like subtle)**
```css
--shadow-sm: 0 1px 2px 0 hsl(0 0% 0% / 0.05);
--shadow-md: 0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.06);
--shadow-lg: 0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -2px hsl(0 0% 0% / 0.05);
--shadow-xl: 0 20px 25px -5px hsl(0 0% 0% / 0.1), 0 10px 10px -5px hsl(0 0% 0% / 0.04);
```

### Typography

**Font Families**
- Primary: System font stack (San Francisco on Mac, Segoe UI on Windows)
- Brand: Gobold Bold (for "CTRL" text)

**Scale**
- H1: 3xl (1.875rem) → 4xl → 5xl → 6xl (responsive)
- H2: 2xl → 3xl → 4xl
- H3: xl → 2xl
- Body: base (1rem) → lg → xl
- Small: sm (0.875rem)

**Line Heights**
- Headlines: `leading-[1.1]` (tight, modern)
- Body: `leading-relaxed` (1.625)
- Small: `leading-normal` (1.5)

**Letter Spacing**
- Brand text: `0.06em`
- Headlines: `tracking-tight`
- Body: default

### Spacing System

**Padding Scale**
- Cards: `p-8 sm:p-12 md:p-16 lg:p-20` (generous, Apple-like)
- Buttons: `px-10 sm:px-12` (horizontal), `h-14 sm:h-16` (vertical)
- Sections: `py-6 sm:py-8 md:py-12`
- Gaps: `gap-4 sm:gap-6 lg:gap-8`

**Border Radius**
- Cards: `rounded-3xl` (24px)
- Buttons: `rounded-2xl` (16px)
- Small elements: `rounded-xl` (12px)

---

## Visual Guidelines

### Core Principles

1. **Bold, Not Busy**
   - Clean white backgrounds
   - Generous white space
   - One focal point per screen
   - No decorative elements

2. **Functional, Not Decorative**
   - Every element serves a purpose
   - No gradients for decoration
   - Subtle shadows for depth only

3. **Professional, Not Corporate**
   - Modern, not traditional
   - Executive-grade quality
   - Apple-like refinement

4. **Modern, Not Trendy**
   - Timeless design choices
   - Avoids fads
   - Focuses on clarity

### Video Background

**Specifications:**
- Opacity: `0.12` (12%)
- Filter: `grayscale(0.4) brightness(0.95) contrast(0.9)`
- Position: Fixed, full viewport
- Z-index: `-z-20`
- Overlay: `bg-gradient-to-b from-black/5 via-transparent to-black/10`
- Additional: Subtle radial gradient with mint at 3% opacity

**Critical:** Video must be truly subtle - barely visible, not distracting.

### Cards

**Base Card Style:**
```css
background: white (--card)
border: 1px solid border/40 (subtle)
border-radius: 24px (rounded-3xl)
shadow: shadow-lg (subtle, Apple-like)
padding: p-8 sm:p-12 md:p-16 lg:p-20 (generous)
```

**Hover States:**
- Subtle background change: `hover:bg-muted/30`
- Shadow elevation: `hover:shadow-md`
- Transition: `transition-all duration-200`

### Buttons

**Primary Button:**
```css
background: --primary (ink)
color: --primary-foreground (off-white)
border: 0
border-radius: 16px (rounded-2xl)
padding: px-10 sm:px-12, h-14 sm:h-16
shadow: shadow-md
hover: shadow-lg, bg-primary/90
font-size: text-lg sm:text-xl
font-weight: font-semibold
```

**Outline Button:**
```css
background: transparent
border: 1px solid border/60
border-radius: 16px
padding: same as primary
hover: bg-muted/50, border-border/80
```

**Critical:** All buttons must have `border-0` explicitly set (no default borders).

---

## Component Architecture

### Core UI Components

#### Button Component (`src/components/ui/button.tsx`)

**Variants:**
- `default`: Primary action (ink background, white text)
- `outline`: Secondary action (transparent, bordered)
- `ghost`: Tertiary action (transparent, hover background)
- `hero`: Large primary CTA (for landing page)
- `cta`: Accent-colored action

**Sizes:**
- `sm`: h-9
- `default`: h-10
- `lg`: h-11
- `xl`: h-14, text-base

**Critical Requirements:**
- All variants must have `border-0` explicitly
- Smooth transitions (200ms)
- Proper hover states
- Accessible focus states

#### Card Component (`src/components/ui/card.tsx`)

**Structure:**
- `Card`: Base container (white, rounded-3xl, shadow-lg)
- `CardHeader`: Title section (p-8 pb-6, space-y-3)
- `CardContent`: Main content (p-8 pt-4)
- `CardTitle`: Heading (text-xl, font-bold)

**Styling:**
- Background: Pure white
- Border: Subtle (border/40)
- Shadow: Soft, Apple-like
- Padding: Generous (p-8 minimum)

### Landing Page Components

#### HeroSection (`src/components/landing/HeroSection.tsx`)

**Layout:**
- Full viewport height: `h-[var(--mobile-vh)]`
- Centered content card
- Video background (subtle)
- No scroll on mobile

**Content Card:**
- Max width: `max-w-2xl`
- Padding: `p-8 sm:p-12 md:p-16 lg:p-20`
- Background: White
- Border radius: `rounded-3xl`
- Shadow: `shadow-lg`

**Elements:**
1. Logo: Top-left, minimal spacing
2. Headline: Large, bold, tight leading
3. Underline animation: SVG path, animated draw
4. Description: Large, readable, muted color
5. CTA Buttons: Primary + Secondary, large, rounded
6. Trust indicators: Small checkmarks, muted text

**Animations:**
- Fade in on mount (staggered delays)
- Slide up for card
- SVG underline draw animation

### Dashboard Components

#### MobileDashboard (`src/components/dashboard/mobile/MobileDashboard.tsx`)

**Layout:**
- Full viewport height
- Fixed header
- Scrollable content area
- Fixed bottom navigation
- Floating voice button

**Structure:**
```
┌─────────────────┐
│ Header (fixed)  │
├─────────────────┤
│                 │
│ Content (scroll)│
│                 │
├─────────────────┤
│ BottomNav       │
└─────────────────┘
     [VoiceBtn]
```

#### BottomNav (`src/components/dashboard/mobile/BottomNav.tsx`)

**Specifications:**
- Fixed bottom
- Height: `h-20`
- Background: `bg-background/98` with backdrop blur
- Border: Top border, subtle
- Shadow: Subtle top shadow
- Items: 4 navigation items
- Active state: `text-primary bg-primary/10`

#### Sheet Component (`src/components/dashboard/mobile/Sheet.tsx`)

**Specifications:**
- Bottom sheet pattern
- Heights: small (40vh), medium (60vh), large (85vh)
- Backdrop: `bg-black/40` with blur
- Animation: Spring physics (stiffness: 400, damping: 35)
- Handle: Top drag indicator
- Rounded top corners: `rounded-t-3xl`

---

## Page Specifications

### Landing Page (`/`)

**Requirements:**
- No scroll on mobile
- Video background (subtle)
- Centered white card
- Large, readable typography
- Clear CTAs
- Trust indicators below

**Mobile:**
- Single viewport height
- All content visible
- No scrolling required

**Desktop:**
- Centered layout
- Max width container
- Same no-scroll principle

### Dashboard (`/dashboard`)

**Mobile:**
- Fixed header with user name
- Hero status card (tier, percentile)
- Priority card stack
- Bottom navigation
- Floating voice button

**Desktop:**
- Sidebar navigation (optional)
- Grid layout
- More horizontal space

### Today Page (`/today`)

**Layout:**
- Fixed header (title + subtitle)
- Scrollable content area
- Weekly action card
- Daily provocation card

**No-Scroll Pattern:**
```tsx
<div className="h-[var(--mobile-vh)] overflow-hidden flex flex-col">
  <div className="flex-shrink-0 px-6 pt-6 pb-4">
    {/* Header */}
  </div>
  <div className="flex-1 overflow-y-auto px-6 pb-safe-bottom">
    {/* Scrollable content */}
  </div>
</div>
```

### Voice Page (`/voice`)

**Layout:**
- Fixed header with back button
- Centered voice recorder
- Large mic icon
- Countdown timer
- Start/Stop button

### Pulse Page (`/pulse`)

**Layout:**
- Fixed header
- Scrollable content
- Baseline card
- Tensions cards
- Risk signals cards

---

## Animation & Motion System

### Motion Utilities (`src/lib/motion.ts`)

**Transitions:**
```typescript
fast: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
normal: { duration: 0.35, ease: [0.4, 0, 0.2, 1] }
slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
spring: { type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }
```

**Variants:**
- `fadeIn`: Opacity 0 → 1
- `slideUp`: Y: 24px → 0, opacity 0 → 1
- `scaleIn`: Scale: 0.96 → 1, opacity 0 → 1
- `pageTransition`: Full page transitions
- `cardEntrance`: Card-specific entrance

**Usage:**
```tsx
import { fadeInProps, slideUpProps } from '@/lib/motion';

<motion.div {...fadeInProps}>
  {/* Content */}
</motion.div>
```

### Animation Principles

1. **Smooth, Not Bouncy**
   - Damping: 35
   - Stiffness: 400
   - Mass: 0.8

2. **Fast, Not Slow**
   - Most animations: 200-350ms
   - Page transitions: 400ms
   - No animations over 500ms

3. **Subtle, Not Dramatic**
   - Small movements (24px max)
   - Gentle opacity changes
   - No scale > 1.05

---

## Mobile-First Architecture

### Viewport Handling

**CSS Variable:**
```css
:root {
  --mobile-vh: 100vh;
}

@media (max-height: 800px) {
  :root {
    --mobile-vh: 100dvh;
  }
}
```

**JavaScript Initialization:**
```typescript
// src/utils/mobileViewport.ts
export function initMobileViewport() {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--mobile-vh', `${vh * 100}px`);
  };
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
}
```

### No-Scroll Pattern

**Structure:**
```tsx
<div className="h-[var(--mobile-vh)] overflow-hidden flex flex-col">
  {/* Fixed header */}
  <div className="flex-shrink-0">
    {/* Header content */}
  </div>
  
  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto">
    {/* Main content */}
  </div>
</div>
```

**Critical:** Every mobile page must use this pattern.

### Safe Areas

**Bottom Safe Area:**
```css
.pb-safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

**Usage:**
- Bottom navigation
- Scrollable content areas
- Floating buttons

---

## Implementation Checklist

### Phase 1: Design System Setup

- [ ] Create `src/index.css` with light mode color system
- [ ] Define all CSS variables (colors, shadows, spacing)
- [ ] Set up typography scale
- [ ] Configure border radius system
- [ ] Test color contrast ratios

### Phase 2: Core Components

- [ ] Build Button component with all variants
- [ ] Build Card component (Card, CardHeader, CardContent, CardTitle)
- [ ] Test all button states (hover, focus, active, disabled)
- [ ] Test card hover states
- [ ] Verify accessibility (ARIA, keyboard navigation)

### Phase 3: Motion System

- [ ] Create `src/lib/motion.ts` with all variants
- [ ] Test spring animations
- [ ] Verify animation performance
- [ ] Test on mobile devices

### Phase 4: Landing Page

- [ ] Build HeroSection component
- [ ] Implement subtle video background
- [ ] Create animated underline SVG
- [ ] Build trust indicators
- [ ] Test no-scroll on mobile
- [ ] Test responsive breakpoints

### Phase 5: Dashboard

- [ ] Build MobileDashboard layout
- [ ] Create HeroStatusCard
- [ ] Create PriorityCardStack
- [ ] Build BottomNav component
- [ ] Create VoiceButton (floating)
- [ ] Build Sheet component
- [ ] Test all interactions

### Phase 6: Content Pages

- [ ] Build Today page (no-scroll pattern)
- [ ] Build Voice page
- [ ] Build Pulse page
- [ ] Create WeeklyAction component
- [ ] Create DailyProvocation component
- [ ] Create StrategicPulse component

### Phase 7: Mobile Optimization

- [ ] Implement viewport handling
- [ ] Test on real mobile devices
- [ ] Verify no-scroll on all pages
- [ ] Test safe areas (notch, home indicator)
- [ ] Test haptic feedback
- [ ] Test touch targets (min 44x44px)

### Phase 8: Polish & Refinement

- [ ] Visual audit on desktop (1920x1080)
- [ ] Visual audit on mobile (375x812)
- [ ] Test all animations
- [ ] Verify color consistency
- [ ] Check typography hierarchy
- [ ] Test loading states
- [ ] Test error states

---

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx          # Core button component
│   │   ├── card.tsx             # Core card components
│   │   └── ...
│   ├── landing/
│   │   └── HeroSection.tsx      # Landing page hero
│   ├── dashboard/
│   │   └── mobile/
│   │       ├── MobileDashboard.tsx
│   │       ├── BottomNav.tsx
│   │       ├── VoiceButton.tsx
│   │       ├── Sheet.tsx
│   │       ├── HeroStatusCard.tsx
│   │       └── PriorityCardStack.tsx
│   ├── action/
│   │   └── WeeklyAction.tsx
│   ├── provocation/
│   │   └── DailyProvocation.tsx
│   ├── pulse/
│   │   └── StrategicPulse.tsx
│   └── voice/
│       └── VoiceRecorder.tsx
├── pages/
│   ├── Index.tsx                # Landing page
│   ├── Dashboard.tsx
│   ├── Today.tsx
│   ├── Voice.tsx
│   └── Pulse.tsx
├── lib/
│   └── motion.ts                # Animation utilities
├── utils/
│   └── mobileViewport.ts        # Viewport handling
└── index.css                     # Design system
```

---

## Critical Requirements

### Must-Have Features

1. **Light Mode Design System**
   - Off-white backgrounds
   - Ink/dark text
   - Pure white cards
   - Subtle shadows

2. **No-Scroll Mobile Experience**
   - Every page fits viewport
   - Fixed headers
   - Scrollable content areas only
   - Proper viewport handling

3. **Apple-Like Aesthetics**
   - Generous spacing
   - Clean typography
   - Subtle animations
   - Refined components

4. **Subtle Video Background**
   - 12% opacity maximum
   - Desaturated
   - Not distracting
   - True background overlay

5. **Executive-Grade Quality**
   - 10/10 visual quality
   - Professional appearance
   - Boardroom-ready
   - No compromises

### Testing Requirements

1. **Visual Testing**
   - Screenshot every page on desktop (1920x1080)
   - Screenshot every page on mobile (375x812)
   - Compare against Apple design standards
   - Verify spacing consistency

2. **Functional Testing**
   - Test all interactions
   - Verify animations
   - Test loading states
   - Test error states

3. **Mobile Testing**
   - Test on real devices
   - Verify no-scroll
   - Test safe areas
   - Test haptics

---

## Success Criteria

The application is complete when:

1. ✅ All pages use light mode design system
2. ✅ All mobile pages are no-scroll
3. ✅ Video background is truly subtle
4. ✅ All components match Apple-like quality
5. ✅ Typography is clear and hierarchical
6. ✅ Spacing is generous and consistent
7. ✅ Animations are smooth and subtle
8. ✅ Visual quality is 10/10
9. ✅ All interactions work perfectly
10. ✅ Ready for executive presentation

---

## Notes for Implementation

- **Start with design system** - Get colors, typography, spacing right first
- **Build components incrementally** - Test each component thoroughly
- **Mobile-first** - Design for mobile, enhance for desktop
- **Visual audits** - Screenshot and review constantly
- **No compromises** - Every detail matters
- **Test on real devices** - Emulators aren't enough

---

## Reference Documentation

### Design System Files

The following files contain the original design standards that must be referenced and exceeded:

1. **`project-documentation/DESIGN_SYSTEM.md`**
   - Color system (light mode: off-white background, ink foreground)
   - Typography scale and usage rules
   - Spacing system
   - Brand typography patterns
   - Component patterns

2. **`project-documentation/VISUAL_GUIDELINES.md`**
   - Visual principles (Bold/Not Busy, Functional/Not Decorative, etc.)
   - Layout system (grid structure, content width, spacing rhythm)
   - Hero section patterns
   - Content section patterns
   - Card patterns
   - Button styles
   - Typography hierarchy
   - Color application
   - Interactive states
   - Animations
   - Imagery guidelines
   - Mobile considerations

3. **`project-documentation/BRANDING.md`**
   - Brand voice and tone
   - Messaging pillars
   - Copy guidelines
   - Visual brand elements

**Critical:** These documents define the standards that were set in the previous version. The new implementation must far surpass these standards while maintaining the core design principles.

---

## Testing & Quality Assurance Protocol

### Visual Audit Process

**Required Process:**
1. Screenshot every page on desktop (1920x1080)
2. Screenshot every page on mobile (375x812)
3. Critically analyze each screenshot as if you were Steve Jobs
4. Identify all visual issues
5. Fix issues
6. Repeat audit process
7. Complete at least 5 full audit cycles
8. Do not stop until visual quality is 10/10

**What to Look For:**
- Spacing consistency
- Typography hierarchy
- Color consistency
- Component alignment
- Animation smoothness
- Visual polish
- Apple-like refinement
- Executive-grade quality

### Functional Testing

**Every User Touchpoint Must Be Tested:**
- All buttons and interactions
- All navigation flows
- All form inputs
- All loading states
- All error states
- All animations
- All responsive breakpoints
- All device types

**Testing Requirements:**
- Test in browser (localhost dev server)
- Test on real mobile devices
- Test all user flows end-to-end
- Verify no regressions
- Verify all interactions work perfectly

---

**End of Specification**

This document provides everything needed to rebuild the application correctly. Follow it step-by-step, test thoroughly, and achieve the Apple-like, executive-grade quality that was intended. The previous version set high standards - this implementation must far surpass them.

Use my API keys creatively to create a technical moat and make this as magical and insightful as possible, they are all connected to Supabase project bkyuxvschuwngtcdhsyg, URL https://bkyuxvschuwngtcdhsyg.supabase.co and anon public key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreXV4dnNjaHV3bmd0Y2Roc3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDE2NzgsImV4cCI6MjA2NzU3NzY3OH0.XmOP_W7gUdBuP23p4lH-iryMXPXMI69ZshU8Dwm6ujo":
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
RESEND_API_KEY
OPENAI_API_KEY
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CREDENTIALS
GOOGLE_OAUTH_CLIENT_SECRET
TOKEN_ENCRYPTION_KEY
GOOGLE_SHEETS_SPREADSHEET_ID
LOVABLE_API_KEY
SEND_CONFIRMATION_EMAIL_HOOK_SECRET
APP_URL
GEMINI_API_KEY
STRIPE_SECRET_KEY
GEMINI_SERVICE_ACCOUNT_KEY
GOOGLE_AI_API_KEY
APOLLO_API_KEY
