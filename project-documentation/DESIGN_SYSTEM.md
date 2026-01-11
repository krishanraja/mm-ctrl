# Design System

**Last Updated:** 2025-11-25

---

## Color System

### Primary Palette
```
Ink:  #0e1a2b (HSL: 210 58% 11%)  - Main structure, typography
Mint: #7ef4c2 (HSL: 158 82% 73%) - Highlights, sparingly
```

### Neutrals
```
Off-White:   #F7F7F5 (HSL: 60 9% 96%)  - Background
Light Grey:  #E5E5E3 (HSL: 60 5% 90%)  - Borders
Mid Grey:    #9AA0A6 (HSL: 210 7% 62%) - Secondary text
Graphite:    #333639 (HSL: 200 5% 21%) - Strong text
```

### Semantic Mappings
```css
--background: var(--off-white)
--foreground: var(--ink)
--muted: var(--light-grey)
--muted-foreground: var(--mid-grey)
--primary: var(--ink)
--accent: var(--mint)
--ring: var(--mint)
```

---

## Typography

### Font Families
```
Primary: 'Inter' - Body text, UI
Display: 'Gobold' - Headlines, hero text
Grotesk: 'Inter', 'Helvetica Neue', 'Arial' - Brand typography (Ctrl, MINDMAKER)
```

### Scale
```
Hero:     text-5xl to text-6xl (48-60px)
H1:       text-4xl to text-5xl (36-48px)
H2:       text-3xl to text-4xl (30-36px)
H3:       text-2xl (24px)
Body:     text-base (16px)
Small:    text-sm (14px)
Tiny:     text-xs (12px)
```

### Usage Rules
- **Gobold:** Hero headlines only, sparingly
- **Inter:** All other text
- **Grotesk:** Brand typography (Ctrl, MINDMAKER) - use `.brand-typography-ctrl` utility
- **Line Height:** 1.6 for body, 1.2 for headlines
- **Letter Spacing:** Tight (-0.02em) for headlines

### Brand Typography Pattern

**Ctrl Text Styling:**
```tsx
<span className="brand-typography-ctrl">
  CTRL
</span>
```

**Specifications:**
- Font: Grotesk (Inter, Helvetica Neue, Arial)
- Size: 1.35rem (mobile), 1.575rem (sm), 1.8rem (md) - 20% larger than base
- Case: Uppercase
- Letter Spacing: 0.05em
- Line Height: 1

**Never hardcode brand typography** - always use `.brand-typography-ctrl` utility class.

---

## Spacing System

### Scale (Tailwind)
```
0.5  = 2px   (xs gaps)
1    = 4px   (tight spacing)
2    = 8px   (compact)
3    = 12px  (default gap)
4    = 16px  (comfortable)
6    = 24px  (section spacing)
8    = 32px  (large gaps)
12   = 48px  (section padding)
16   = 64px  (major sections)
20   = 80px  (hero padding)
```

### Utility Classes
```
section-padding:    py-12 md:py-20 (sections)
container-width:    max-w-7xl mx-auto px-4
touch-target:       min-h-[44px] (mobile buttons)
```

---

## Component Patterns

### Buttons

**Primary (Mint)**
```tsx
<Button className="bg-mint text-ink hover:bg-mint/90">
```

**Secondary (Ink)**
```tsx
<Button className="bg-ink text-white hover:bg-ink/90">
```

**Outline**
```tsx
<Button variant="outline" className="border-mint text-mint">
```

### Cards

**Premium Card** (featured content)
```tsx
<div className="premium-card">
  // bg-white, border-2, shadow-lg, p-6
</div>
```

**Minimal Card** (standard content)
```tsx
<div className="minimal-card">
  // bg-card, border, p-6
</div>
```

### Modals/Dialogs
```tsx
<Dialog>
  <DialogContent className="sm:max-w-[520px]">
    // White bg, rounded-lg, shadow
  </DialogContent>
</Dialog>
```

---

## Animation System

### Keyframes
```css
fade-in-up: opacity 0→1, translateY 20px→0 (0.6s)
pulse: scale 1→1.05→1 (2s infinite)
```

### Usage
```tsx
className="fade-in-up" style={{animationDelay: '0.1s'}}
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

---

## Responsive Breakpoints

```
sm:  640px  (mobile landscape)
md:  768px  (tablet)
lg:  1024px (desktop)
xl:  1280px (large desktop)
2xl: 1536px (extra large)
```

### Mobile-First Approach
Base styles = mobile, use `md:`, `lg:` for larger screens

---

## Layout Patterns

### Hero Section
```tsx
<section className="min-h-screen flex items-center bg-ink text-white">
  <div className="container-width">
    <h1 className="text-5xl md:text-6xl font-bold">
```

### Content Section
```tsx
<section className="section-padding bg-background">
  <div className="container-width">
    <h2 className="text-3xl md:text-4xl font-bold mb-8">
```

### Grid Layouts
```tsx
<div className="grid md:grid-cols-3 gap-6">
  // Mobile: 1 col, Tablet+: 3 cols
</div>
```

### Video Background Pattern

**Standard Pattern:**
```tsx
<div className="relative min-h-[100dvh] flex flex-col">
  {/* Video at base layer, full opacity */}
  <video
    className="fixed inset-0 w-full h-full object-cover opacity-100 -z-20 pointer-events-none"
    autoPlay
    loop
    muted
    playsInline
    preload="metadata"
  >
    <source src="/video.mp4" type="video/mp4" />
  </video>
  
  {/* Semi-transparent black overlay - 50% opacity */}
  <div className="fixed inset-0 bg-black/50 -z-10 pointer-events-none" />
  
  {/* Content */}
  <main className="relative z-10">...</main>
</div>
```

**Critical Rules:**
1. **Never use `bg-background` on root App component** - `App.tsx` root div must NOT have `bg-background` as it creates solid black layer blocking video
2. **Never use `bg-background` on parent container** - Component parent containers with video backgrounds must not have `bg-background`
3. **Video must be at `opacity-100`** - transparency controlled by overlay, not video element
4. **Z-index layering:**
   - Video: `-z-20` (base layer)
   - Overlay: `-z-10` (above video, below content)
   - Content: `z-10` or higher (top layer)
5. **Overlay opacity:** Use `bg-black/50` for 50% black overlay
6. **Root container pattern:** App.tsx should use `<div className="min-h-screen">` (no bg-background) to allow child components to control backgrounds

**Mobile-only video:**
```tsx
<video className="fixed inset-0 w-full h-full object-cover opacity-100 md:hidden -z-20 pointer-events-none" />
<div className="fixed inset-0 bg-black/50 md:hidden -z-10 pointer-events-none" />
```

### Decorative Underline Pattern

**When using SVG decorative underlines, never use CSS `underline` class:**
```tsx
{/* ❌ WRONG - Creates double underline */}
<span className="relative inline-block">
  <span className="underline">AI-era future</span>
  <svg className="absolute -bottom-1 left-0 w-full h-2 text-primary">...</svg>
</span>

{/* ✅ CORRECT - Only SVG decorative underline */}
<span className="relative inline-block">
  <span>AI-era future</span>
  <svg className="absolute -bottom-1 left-0 w-full h-2 text-primary">...</svg>
</span>
```

**Rule:** If using SVG decorative underlines, remove `underline` class to prevent double underlines.

---

## Icon System

**Library:** Lucide React  
**Size:** `h-5 w-5` standard, `h-6 w-6` large  
**Color:** Inherit from parent

```tsx
import { ArrowRight, CheckCircle } from "lucide-react"
<CheckCircle className="h-5 w-5 text-mint" />
```

---

## Form Elements

### Input Fields
```tsx
<Input 
  className="border-input bg-background"
  placeholder="Your email"
/>
```

### Labels
```tsx
<Label className="text-sm font-semibold">
```

### Radio Groups
```tsx
<RadioGroup>
  <RadioGroupItem value="option" />
</RadioGroup>
```

---

## Accessibility

### Focus States
```css
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### ARIA Labels
```tsx
<button aria-label="Close dialog">
```

### Semantic HTML
Use `<main>`, `<section>`, `<nav>`, `<article>` appropriately

---

## Z-Index System

**Standard Layering (from bottom to top):**
```
-z-20: Video backgrounds (base layer)
-z-10: Overlays (semi-transparent backgrounds)
z-0:   Base content
z-10:  Main content
z-20:  Headers, navigation
z-50:  Modals, dropdowns, tooltips
```

**Rules:**
- Never use arbitrary z-index values (e.g., `z-[999]`)
- Follow the documented system above
- Video backgrounds always use `-z-20`
- Overlays always use `-z-10`
- Content starts at `z-0` or `z-10`

---

## Mobile Viewport System

### Overview

The mobile viewport system solves the 3-5% overflow issue where `100dvh` doesn't account for dynamic browser chrome (address bars, safe area insets). It provides accurate viewport height calculations that update on resize and orientation changes.

### Core Utility

**File:** `src/utils/mobileViewport.ts`

The utility calculates actual viewport height using:
1. `window.visualViewport` API (most accurate, accounts for keyboard/chrome)
2. Fallback to `window.innerHeight` (excludes chrome when hidden)

It sets a CSS custom property `--mobile-vh` that updates automatically on:
- Window resize
- Orientation change
- Visual viewport changes (keyboard, browser chrome)

### CSS Utilities

**Location:** `src/index.css`

```css
.mobile-vh {
  height: var(--mobile-vh, 100dvh);
}

.mobile-min-vh {
  min-height: var(--mobile-vh, 100dvh);
}

.mobile-max-vh {
  max-height: var(--mobile-vh, 100dvh);
}
```

### Usage Patterns

#### ✅ CORRECT: Using Mobile Viewport Height

```tsx
// Full-height container (no scroll)
<div className="h-[var(--mobile-vh)] overflow-hidden flex flex-col">
  <header className="flex-shrink-0">Header</header>
  <main className="flex-1 overflow-y-auto">Scrollable content</main>
</div>

// Or use utility class
<div className="mobile-vh overflow-hidden">
  {/* Content */}
</div>
```

#### ✅ CORRECT: Scrollable Content Area

```tsx
<div className="h-[var(--mobile-vh)] overflow-hidden flex flex-col">
  <div className="flex-1 overflow-y-auto">
    {/* Scrollable content */}
  </div>
</div>
```

#### ✅ CORRECT: Safe Area Insets

```tsx
// Account for notches and home indicators
<div className="pt-safe-top pb-safe-bottom">
  {/* Content */}
</div>

// Or inline style for fixed positioning
<div style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
  {/* Fixed element */}
</div>
```

#### ❌ WRONG: Using 100dvh Directly

```tsx
// DON'T: Doesn't account for browser chrome
<div className="min-h-[100dvh]">
  {/* Content */}
</div>

// DON'T: Fixed height without viewport utility
<div className="h-screen">
  {/* Content */}
</div>
```

#### ❌ WRONG: Excessive Padding

```tsx
// DON'T: Large bottom padding causes overflow
<div className="pb-32">
  {/* Content */}
</div>

// DO: Use safe area utilities
<div className="pb-safe-bottom">
  {/* Content */}
</div>
```

### MobileLayout Component

**File:** `src/components/mobile/MobileLayout.tsx`

Wrapper component for consistent no-scroll behavior:

```tsx
import { MobileLayout } from '@/components/mobile/MobileLayout';

<MobileLayout>
  <YourContent />
</MobileLayout>
```

Automatically:
- Initializes viewport utility
- Sets `h-[var(--mobile-vh)]`
- Prevents overflow with `overflow-hidden`
- Provides flex container structure

### Initialization

The viewport utility is automatically initialized in `App.tsx`:

```tsx
useEffect(() => {
  const cleanup = initMobileViewport();
  return cleanup;
}, []);
```

**Note:** It's safe to call `initMobileViewport()` multiple times (idempotent).

### Anti-Patterns to Avoid

1. **❌ Using `100vh` or `100dvh` directly on mobile components**
   - ✅ Use `h-[var(--mobile-vh)]` or `.mobile-vh` utility

2. **❌ Large fixed bottom padding (`pb-32`, `pb-24`)**
   - ✅ Use `pb-safe-bottom` for safe area accounting

3. **❌ `min-h-screen` without overflow control**
   - ✅ Use `h-[var(--mobile-vh)] overflow-hidden` for no-scroll containers

4. **❌ Fixed positioning without safe area insets**
   - ✅ Use `env(safe-area-inset-bottom)` for bottom positioning

5. **❌ Content that exceeds viewport without internal scroll**
   - ✅ Use flex layout with `flex-1 overflow-y-auto` for scrollable areas

### Testing Checklist

When creating mobile components:

- [ ] Uses `h-[var(--mobile-vh)]` or `.mobile-vh` instead of `100dvh`
- [ ] Accounts for safe area insets with `pt-safe-top` / `pb-safe-bottom`
- [ ] No excessive padding that causes overflow
- [ ] Scrollable content uses `overflow-y-auto` on inner container
- [ ] Fixed elements use safe area insets in positioning
- [ ] Tested on iPhone SE (667px), iPhone 12 (844px), Android devices
- [ ] Verified no vertical scroll on any device

### Browser Chrome Behavior

**iOS Safari:**
- Address bar: ~44px when visible, 0px when hidden
- Safe area insets: Top (notch), Bottom (home indicator)

**Chrome Android:**
- Address bar: ~56px when visible, 0px when hidden
- Safe area insets: Varies by device

**Solution:** The viewport utility accounts for these dynamically.

---

## Root Container Rules

### App.tsx Root Container

**Critical Rule:** The root App component (`src/App.tsx`) must NOT have `bg-background`.

**❌ WRONG:**
```tsx
// App.tsx
<div className="min-h-screen bg-background">
```

**✅ CORRECT:**
```tsx
// App.tsx
<div className="min-h-screen">
  {/* No bg-background - allows child components to control backgrounds */}
```

**Why:** 
- `bg-background` creates solid black layer (`rgb(10, 10, 10)`)
- This blocks video backgrounds in child components
- Backgrounds should be set at component level, not root

**Enforcement:**
- ESLint rule prevents `bg-background` on App.tsx
- Build validation script checks for this
- Component tests verify video visibility

**See:** [VIDEO_BACKGROUND_PATTERN.md](../VIDEO_BACKGROUND_PATTERN.md) for complete guide

---

## Design Tokens Location

**File:** `src/index.css`  
**Config:** `tailwind.config.ts`

All colors, spacing, typography defined as CSS variables and Tailwind extensions.

**Never hardcode colors** - always use tokens:
- ✅ `bg-mint`, `text-ink`, `border-muted`
- ❌ `bg-[#7ef4c2]`, `text-[#0e1a2b]`

**Never hardcode brand typography** - always use utilities:
- ✅ `.brand-typography-ctrl`
- ❌ Inline styles or hardcoded font sizes

**Never use bg-background on root App component:**
- ✅ Component-level backgrounds
- ❌ `bg-background` on App.tsx root

---

**End of DESIGN_SYSTEM**
