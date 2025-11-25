# Visual Guidelines

**Last Updated:** 2025-11-25

---

## Visual Principles

1. **Bold, Not Busy** - Strong elements, generous white space
2. **Functional, Not Decorative** - Every visual serves purpose
3. **Professional, Not Corporate** - Clean but not sterile
4. **Modern, Not Trendy** - Timeless, not chasing fads

---

## Layout System

### Grid Structure
```
Desktop: 12-column grid, 24px gutter
Tablet:  8-column grid, 16px gutter
Mobile:  4-column grid, 12px gutter
```

### Content Width
```
Max width: 1280px (7xl)
Comfortable reading: 65-75 characters per line
Centered content: mx-auto
```

### Spacing Rhythm
```
Micro:    4px, 8px   (component internals)
Small:    12px, 16px (related elements)
Medium:   24px, 32px (section spacing)
Large:    48px, 64px (major sections)
XLarge:   80px+      (hero, major dividers)
```

---

## Hero Sections

### Structure
```tsx
<section className="min-h-screen flex items-center bg-ink text-white">
  {/* Background effects */}
  {/* GIF overlay */}
  {/* Gradient overlay */}
  {/* Grid pattern */}
  
  {/* Content */}
  <div className="container-width relative z-10">
    <Logo />
    <h1>Large headline with <span>mint highlight</span></h1>
    <p>Supporting copy</p>
    <CTAs />
  </div>
</section>
```

### Visual Effects
- Particle/dot GIF background (20% opacity)
- Gradient overlays (dark to darker)
- Animated grid pattern
- Glowing orbs (mint, blurred, animated pulse)

---

## Content Sections

### Standard Section
```tsx
<section className="section-padding bg-background">
  <div className="container-width">
    <h2 className="text-center mb-12">Section Title</h2>
    <Grid>{cards}</Grid>
  </div>
</section>
```

### Alternating Backgrounds
```
Section 1: bg-background (off-white)
Section 2: bg-muted (light grey)
Section 3: bg-background
Section 4: bg-ink (dark, with white text)
```

---

## Card Patterns

### Premium Card (Featured)
```css
background: white
border: 2px solid border
shadow: lg
padding: 24px
border-radius: 8px
```

**Use for:** Recommended products, highlighted content

### Minimal Card (Standard)
```css
background: card
border: 1px solid border
padding: 24px
border-radius: 8px
```

**Use for:** Standard content grid items

### Glass Card (Hero)
```css
background: white/95
backdrop-filter: blur(12px)
border: 1px solid white/30
shadow: 2xl
```

**Use for:** Hero CTAs, overlays on images

---

## Button Styles

### Primary CTA (Mint)
```tsx
<Button className="bg-mint text-ink hover:bg-mint/90 
                   shadow-lg hover:shadow-xl 
                   hover:scale-105 transition-all">
```
**Use for:** Main conversion actions

### Secondary CTA (Ink)
```tsx
<Button className="bg-ink text-white hover:bg-ink/90">
```
**Use for:** Supporting actions

### Outline CTA
```tsx
<Button variant="outline" 
        className="border-mint text-mint hover:bg-mint/20">
```
**Use for:** Tertiary actions, "learn more"

---

## Typography Hierarchy

### Page Hierarchy
```
H1 (Hero):     60px bold, Gobold, mint accent
H2 (Section):  36px bold, Inter, ink
H3 (Card):     24px semibold, Inter, ink
Body:          16px regular, Inter, foreground
Caption:       14px regular, Inter, muted-foreground
```

### Visual Weight
```
Headlines:  font-bold (700)
Subheads:   font-semibold (600)
Body:       font-normal (400)
Captions:   font-normal (400) with muted color
```

---

## Color Application

### Text Hierarchy
```
Primary text:    text-foreground (ink)
Secondary text:  text-muted-foreground (mid-grey)
Tertiary text:   text-muted-foreground/70
Headings:        text-foreground (ink)
Hero headings:   text-white with mint <span>
```

### Background Usage
```
Page background:     bg-background (off-white)
Card background:     bg-card (white)
Muted sections:      bg-muted (light grey)
Dark sections:       bg-ink
Accent areas:        bg-mint/10 (10% mint tint)
```

### Border Usage
```
Default:         border-border (light grey)
Subtle:          border-border/50
Emphasized:      border-mint
Dark mode:       border-border (adjusted in dark mode)
```

---

## Interactive States

### Hover Effects
```css
Buttons:    scale-105, shadow increase
Cards:      subtle lift (shadow)
Links:      underline, mint color
Icons:      translateX(4px) for arrows
```

### Focus States
```css
All interactive: ring-2 ring-mint ring-offset-2
Visible only:    focus-visible: modifier
```

### Active States
```css
Buttons:    scale-98 (slight press)
```

---

## Animation Guidelines

### Scroll Animations
```tsx
className="fade-in-up"
style={{animationDelay: `${index * 0.1}s`}}
```

**Stagger timing:** 0.1s per item  
**Max delay:** 0.6s (no more than 6 items)

### Micro-interactions
```css
Hover:      0.3s ease-out
Focus:      0.2s ease
Transitions: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Pulse Effects
```css
Glowing orbs:  3-4s duration
Hero accent:   2s duration
CTAs:          group-hover:animate-pulse (on icon)
```

---

## Imagery Guidelines

### Hero Images
- High resolution (2560px+ width)
- Dark overlays (40-60% opacity) for text legibility
- Positioned: center or focal point
- Never stretch or distort

### Icons
- Lucide React library
- 20px (h-5 w-5) standard
- 24px (h-6 w-6) for emphasis
- Mint color for positive actions
- Ink/foreground for neutral

### Logos
- Mindmaker icon: standalone mark
- Wordmark: full logo with text
- Krish headshot: circular crop, 192px diameter
- Always on appropriate contrast background

---

## Mobile Considerations

### Touch Targets
```css
Minimum: 44px × 44px (touch-target class)
Buttons: px-6 py-3 minimum
Icons:   Adequate padding around
```

### Responsive Patterns
```
Desktop:   3-4 columns
Tablet:    2 columns
Mobile:    1 column (stack)
```

### Font Scaling
```
Hero:     text-4xl → text-6xl (sm:md:lg)
H2:       text-2xl → text-4xl
Body:     text-base (consistent)
```

### Spacing Adjustments
```
Section padding: py-12 → py-20
Container:       px-4 → px-6
Gaps:            gap-4 → gap-6
```

---

## Accessibility Visual Requirements

### Color Contrast
- AA standard minimum (4.5:1 for body text)
- AAA preferred (7:1)
- Test: Ink on Off-White = 12.6:1 ✅
- Test: Mint on White = 1.9:1 ❌ (accent only, not text)

### Visual Hierarchy
- Clear heading levels (don't skip)
- Adequate spacing between sections
- Logical reading order

### Focus Indicators
- Visible on all interactive elements
- Mint ring (2px) with 2px offset
- Never remove focus styles

---

**End of VISUAL_GUIDELINES**
