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
- **Line Height:** 1.6 for body, 1.2 for headlines
- **Letter Spacing:** Tight (-0.02em) for headlines

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

## Design Tokens Location

**File:** `src/index.css`  
**Config:** `tailwind.config.ts`

All colors, spacing, typography defined as CSS variables and Tailwind extensions.

**Never hardcode colors** - always use tokens:
- ✅ `bg-mint`, `text-ink`, `border-muted`
- ❌ `bg-[#7ef4c2]`, `text-[#0e1a2b]`

---

**End of DESIGN_SYSTEM**
