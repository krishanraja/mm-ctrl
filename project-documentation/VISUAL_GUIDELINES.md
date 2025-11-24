# Visual Guidelines

Visual design principles, layout patterns, and UI examples.

---

## Design Philosophy

### Core Principles

**1. Calm Over Flashy**
- Generous whitespace
- Restrained color palette
- Minimal animation
- No visual noise

**2. Clear Over Clever**
- Obvious hierarchy
- Explicit labels
- Predictable interactions
- No hidden affordances

**3. Senior Over Playful**
- Professional aesthetic
- Executive-appropriate
- No cartoon/game elements
- Muted, sophisticated

**4. Focused Over Comprehensive**
- Show what matters
- Hide complexity
- One thing at a time
- Progressive disclosure

---

## Layout Patterns

### Hero Section

**Structure**:
```
[Logo]                [Navigation]

        [Large headline]
        
    [Supporting description]
    
        [Primary CTA]
    [Secondary CTA (optional)]
    
        [Trust signal]
```

**Implementation**:
- Max-width: 1200px
- Centered content
- Padding: 12rem top, 8rem bottom
- Background: Subtle gradient or solid

**Example** (HeroSection.tsx):
- Headline: `text-4xl font-bold`
- Description: `text-sm text-muted-foreground max-w-2xl`
- Button: `Button size="lg"` with icon

---

### Results Layout

**Structure**:
```
[Header with name/date]

[Horizontal tab navigation]

[Tab content area]
  ├─ Overview: Chart + dimension cards
  ├─ Tensions: Stacked cards with left border
  ├─ Tools: Categorized prompt cards
  └─ Privacy: Consent toggles
```

**Implementation**:
- Container: `max-w-5xl mx-auto`
- Tab navigation: Full-width, sticky on scroll
- Content padding: `p-8` on desktop, `p-4` on mobile
- Card spacing: `space-y-6` between sections

---

### Card Layouts

**Information Card**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm">Body content</p>
  </CardContent>
</Card>
```

**Diagnostic Card with Left Border**:
```tsx
<Card className="border-l-4 border-l-blue-500/50">
  <CardContent className="p-6">
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 flex-shrink-0 mt-1" />
      <div className="flex-1">
        <Badge>Category</Badge>
        <p className="text-sm mt-2">Content</p>
      </div>
    </div>
  </CardContent>
</Card>
```

**Action Card**:
```tsx
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold">Action Title</h3>
        <p className="text-sm text-muted-foreground">Description</p>
      </div>
      <ArrowRight className="h-5 w-5 text-primary" />
    </div>
  </CardContent>
</Card>
```

---

## Component Patterns

### Navigation

**Top Navigation**:
- Logo: Left-aligned, `h-8`
- Links: Right-aligned, `text-sm`
- Button: Primary action, right-most
- Sticky: Add `sticky top-0 z-50` on scroll

**Tab Navigation**:
- Horizontal tabs for <5 options
- Vertical tabs for 5+ options
- Active state: Underline + bold
- Icons: Optional, `h-4 w-4` left of label

### Forms

**Form Field**:
```tsx
<div className="space-y-2">
  <Label htmlFor="field">
    Field Label <span className="text-destructive">*</span>
  </Label>
  <Input id="field" placeholder="Placeholder" />
  <p className="text-xs text-muted-foreground">Helper text</p>
</div>
```

**Form Layout**:
- Single column on mobile
- 2-column on tablet+ for short fields
- Field spacing: `space-y-6`
- Submit button: Full-width mobile, auto desktop

### Data Visualisation

**Benchmark Chart** (LeadershipBenchmarkV2.tsx):
- Radar chart for 6 dimensions
- Muted colors, no 3D effects
- Clear axis labels
- Hover tooltips for detail

**Bubble Chart** (PeerBubbleChart.tsx):
- X-axis: One dimension
- Y-axis: Another dimension
- Bubble size: Sample size or confidence
- User bubble: Highlighted with border

**Heatmap** (Partners tool):
- Rows: Companies
- Columns: Dimensions
- Colors: Green (high) → Yellow (medium) → Red (low)
- Hover: Show exact score

### Modals & Dialogs

**Standard Dialog**:
```tsx
<Dialog>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Supporting text</DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Upgrade Modal**:
- Clear comparison: Free vs Paid
- Price prominent: `text-3xl font-bold`
- CTA: Large, centered
- Exit: X button, "Maybe later" link

---

## Interactive States

### Hover

**Cards**:
```tsx
<Card className="hover:shadow-lg transition-shadow">
```

**Buttons**:
```tsx
<Button className="group">
  <span>Label</span>
  <ArrowRight className="transition-transform group-hover:translate-x-1" />
</Button>
```

### Focus

All interactive elements:
```tsx
className="focus:ring-2 focus:ring-ring focus:ring-offset-2"
```

### Loading

**Spinner**:
```tsx
<Loader2 className="h-8 w-8 animate-spin text-primary" />
```

**Skeleton**:
```tsx
<Skeleton className="h-20 w-full" />
```

### Error

**Inline Error**:
```tsx
<p className="text-sm text-destructive">Error message</p>
```

**Error Card**:
```tsx
<Card className="border-destructive">
  <CardContent className="p-6">
    <AlertTriangle className="h-5 w-5 text-destructive" />
    <p className="text-sm">Error details</p>
  </CardContent>
</Card>
```

---

## Responsive Patterns

### Mobile (<768px)

**Layout**:
- Single column
- Full-width components
- Collapsible sections
- Bottom navigation if needed

**Typography**:
- Slightly smaller headlines (scale down 1 level)
- Line-height: 1.6 for readability
- Touch targets: min 44×44px

**Images**:
- Full-width, constrained height
- Lazy loading
- WebP format with PNG fallback

### Tablet (768px-1024px)

**Layout**:
- 2-column grid where appropriate
- Sidebar navigation option
- Increased padding

**Cards**:
- 2-up grid for equal cards
- Single column for detailed cards

### Desktop (>1024px)

**Layout**:
- 3-column grid max
- Sidebar + content layouts
- Generous margins (container max-width)

**Charts**:
- Full detail, larger size
- Hover interactions enabled

---

## Animation Guidelines

### When to Animate

**Do animate**:
- Page transitions (fade in)
- Loading states (spinner)
- Hover feedback (scale, translate)
- Success confirmation (checkmark)

**Don't animate**:
- Core content appearance
- Tab switches (instant)
- Data updates (direct change)
- Background elements

### Animation Duration

- Micro-interactions: 150ms
- Standard transitions: 300ms
- Page transitions: 500ms
- Loading spinners: Continuous

### Easing

- Default: `ease-in-out`
- Entry: `ease-out`
- Exit: `ease-in`

---

## Accessibility

### Color Contrast

- Text on background: min 4.5:1 (WCAG AA)
- Large text (18pt+): min 3:1
- Interactive elements: min 3:1

**Test both light and dark modes separately**

### Focus Indicators

All interactive elements must have visible focus:
```tsx
focus:ring-2 focus:ring-ring focus:ring-offset-2
```

### Keyboard Navigation

- Tab order follows visual order
- Skip links for long pages
- Escape closes modals
- Enter submits forms

### Screen Readers

- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- Add `aria-label` to icon-only buttons
- Include `alt` text on all images
- Use `role` attributes where needed

---

## Dark Mode

### Implementation

All colors use CSS variables that switch in `.dark`:
```tsx
<div className="bg-background text-foreground">
  {/* Automatically dark-mode compatible */}
</div>
```

### Testing Checklist

- [ ] All text readable in dark mode
- [ ] All borders visible in dark mode
- [ ] Charts legible in dark mode
- [ ] Images have appropriate contrast
- [ ] No white "flash" on load

---

## Component Library (shadcn/ui)

### Core Components Used

- `Button`: Primary actions
- `Card`: Content containers
- `Badge`: Labels and tags
- `Input`: Form fields
- `Label`: Form labels
- `Tabs`: Navigation between views
- `Dialog`: Modals and overlays
- `Select`: Dropdowns
- `Checkbox`: Boolean inputs
- `RadioGroup`: Single-choice inputs
- `Progress`: Loading bars
- `Skeleton`: Loading placeholders
- `Tooltip`: Hover explanations

### Customisation Rules

1. Never override base component styles directly
2. Use `className` prop for variants
3. Define new variants in component file if reusable
4. Keep shadcn components in `/components/ui/`
5. Create composite components in `/components/`

---

## Visual Hierarchy

### Priority Levels

**Level 1: Primary Focus**
- Large, bold headlines
- Primary CTA buttons
- Critical data/metrics
- Current tab/selection

**Level 2: Supporting Content**
- Body text
- Secondary actions
- Related information
- Dimension cards

**Level 3: Metadata**
- Timestamps
- Labels and tags
- Helper text
- Non-critical status

**Level 4: Background**
- Borders
- Dividers
- Subtle backgrounds
- Placeholder text

### Size Relationships

- Headline: 2-3× body text size
- Body text: 14-16px
- Labels: 12px
- Icons: Match text height

---

## Example Screens

### Landing Page (HeroSection.tsx)

```
┌─────────────────────────────────────┐
│ [Logo]              [Sign In]       │
│                                     │
│     Know Where You Stand on AI      │
│                                     │
│   Spend 10 minutes mapping how AI   │
│   fits your role, team, and company.│
│                                     │
│      [Start diagnostic →]           │
│                                     │
│   Used by 2,500+ leaders            │
└─────────────────────────────────────┘
```

### Results Page (UnifiedResults.tsx)

```
┌─────────────────────────────────────┐
│ Krish's Diagnostic                  │
│ Completed: Jan 24, 2025             │
├─────────────────────────────────────┤
│ [Overview] [Tensions] [Tools] [⚙]  │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ [Radar Chart]                 │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Strategic Vision        72    │ │
│  │ [Progress bar]                │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Experimentation        65     │ │
│  │ [Progress bar]                │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Tensions Tab (TensionsView.tsx)

```
┌─────────────────────────────────────┐
│ Strategic Tensions                  │
├─────────────────────────────────────┤
│                                     │
│ ║ Delegation Gap                    │
│ ║ You want to automate but haven't  │
│ ║ identified which tasks are safe.  │
│ ║ Priority: 1                       │
│                                     │
│ ║ Governance Void                   │
│ ║ Team experimenting without central│
│ ║ visibility or guardrails.         │
│ ║ Priority: 2                       │
│                                     │
└─────────────────────────────────────┘
```

---

## Quality Checklist

Before shipping any visual change:

- [ ] Follows semantic token system (no hardcoded colors)
- [ ] Works in both light and dark mode
- [ ] Responsive on mobile, tablet, desktop
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA
- [ ] Loading and error states handled
- [ ] Animations are subtle and purposeful
- [ ] No placeholder or dummy content
- [ ] Matches brand voice (calm, senior, clear)
