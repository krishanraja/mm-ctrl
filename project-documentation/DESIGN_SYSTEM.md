# Design System

Complete design system specification for Mindmaker.

---

## Design Tokens

### Color System (HSL)

All colors defined in `src/index.css` using CSS custom properties:

```css
:root {
  --background: 0 0% 100%;           /* White */
  --foreground: 222.2 84% 4.9%;      /* Near black */
  --card: 0 0% 100%;                 /* White */
  --card-foreground: 222.2 84% 4.9%; /* Near black */
  --popover: 0 0% 100%;              /* White */
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;      /* Deep navy */
  --primary-foreground: 210 40% 98%;  /* Off-white */
  --secondary: 210 40% 96.1%;        /* Light blue-gray */
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;            /* Light gray */
  --muted-foreground: 215.4 16.3% 46.9%; /* Medium gray */
  --accent: 210 40% 96.1%;           /* Accent gray */
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;      /* Red */
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;       /* Light border */
  --input: 214.3 31.8% 91.4%;        /* Input border */
  --ring: 222.2 84% 4.9%;            /* Focus ring */
  --radius: 0.5rem;                  /* Default border radius */
}

.dark {
  --background: 222.2 84% 4.9%;      /* Near black */
  --foreground: 210 40% 98%;         /* Off-white */
  --card: 222.2 84% 4.9%;            /* Near black */
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;            /* Off-white */
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;    /* Dark blue-gray */
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;        /* Dark gray */
  --muted-foreground: 215 20.2% 65.1%; /* Medium light gray */
  --accent: 217.2 32.6% 17.5%;       /* Dark accent */
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;      /* Dark red */
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;       /* Dark border */
  --input: 217.2 32.6% 17.5%;        /* Dark input border */
  --ring: 212.7 26.8% 83.9%;         /* Light focus ring */
}
```

### **Usage Rules**

1. **ALWAYS use semantic tokens** in components:
   ```tsx
   // ✅ CORRECT
   <div className="bg-background text-foreground">
   <Button className="bg-primary text-primary-foreground">
   
   // ❌ WRONG
   <div className="bg-white text-black">
   <Button className="bg-blue-600 text-white">
   ```

2. **For custom colors**, define in `index.css` first:
   ```css
   :root {
     --success: 142 76% 36%;  /* Green */
     --warning: 38 92% 50%;   /* Orange */
     --info: 217 91% 60%;     /* Blue */
   }
   ```
   
3. **Then add to `tailwind.config.ts`**:
   ```ts
   colors: {
     success: 'hsl(var(--success))',
     warning: 'hsl(var(--warning))',
     info: 'hsl(var(--info))',
   }
   ```

---

## Typography

### Font Families

Defined in `tailwind.config.ts`:

```ts
fontFamily: {
  sans: ["Inter", "sans-serif"],
  heading: ["Inter", "sans-serif"],
  mono: ["monospace"],
}
```

### Font Sizes

```ts
fontSize: {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
}
```

### Font Weights

```ts
fontWeight: {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

### Typography Scale Usage

| Element | Class | Use Case |
|---------|-------|----------|
| **Hero Heading** | `text-4xl font-bold` | Landing page main headline |
| **Section Heading** | `text-2xl font-semibold` | Major page sections |
| **Card Title** | `text-lg font-semibold` | Card headers |
| **Body Text** | `text-sm text-muted-foreground` | Standard paragraph text |
| **Label** | `text-xs font-medium` | Form labels, badges |
| **Caption** | `text-xs text-muted-foreground` | Metadata, helper text |

---

## Spacing

### Scale

```ts
spacing: {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  24: '6rem',    // 96px
}
```

### Usage Guidelines

- **Component padding**: `p-6` (24px) for cards, `p-4` (16px) for buttons
- **Section spacing**: `space-y-8` (32px) between major sections
- **Element spacing**: `gap-4` (16px) between related elements
- **Generous whitespace**: Use `space-y-12` (48px) for breathing room

---

## Component Patterns

### Cards

```tsx
<Card className="border-l-4 border-l-primary/50">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6">
    <p className="text-sm text-muted-foreground">Content</p>
  </CardContent>
</Card>
```

**Variants**:
- Default: Standard white/dark card
- Left-border accent: Add `border-l-4 border-l-{color}/50`
- Hover state: Add `hover:shadow-lg transition-shadow`

### Buttons

```tsx
<Button variant="default" size="lg">
  <Icon className="mr-2 h-4 w-4" />
  Label
</Button>
```

**Variants**:
- `default`: Primary action (solid primary color)
- `outline`: Secondary action (border only)
- `ghost`: Tertiary action (no border)
- `destructive`: Delete/remove actions (red)
- `link`: Text-only link style

**Sizes**:
- `sm`: Compact buttons
- `default`: Standard buttons
- `lg`: Hero CTAs

### Badges

```tsx
<Badge variant="secondary">Label</Badge>
```

**Variants**:
- `default`: Primary badge (solid primary)
- `secondary`: Neutral badge (muted)
- `outline`: Subtle badge (border only)
- `destructive`: Error badge (red)

### Form Inputs

```tsx
<div className="space-y-2">
  <Label htmlFor="input">Label</Label>
  <Input id="input" placeholder="Placeholder" />
  <p className="text-xs text-muted-foreground">Helper text</p>
</div>
```

---

## Layout Patterns

### Page Container

```tsx
<div className="container mx-auto px-4 py-12 max-w-6xl">
  {/* Page content */}
</div>
```

### Section Spacing

```tsx
<div className="space-y-8">
  <section>...</section>
  <section>...</section>
</div>
```

### Grid Layouts

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>
```

### Flex Layouts

```tsx
<div className="flex items-center justify-between gap-4">
  <div>Left content</div>
  <div>Right content</div>
</div>
```

---

## Animation & Transitions

### Hover States

```tsx
<Button className="group">
  <span>Label</span>
  <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
</Button>
```

### Loading States

```tsx
{isLoading ? (
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
) : (
  <Content />
)}
```

### Fade In

```tsx
<div className="animate-in fade-in duration-500">
  <Content />
</div>
```

---

## Responsive Design

### Breakpoints

```ts
screens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

### Mobile-First Approach

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>

<Button size="sm" className="md:size-default">
  {/* Smaller button on mobile */}
</Button>
```

### Hide/Show Patterns

```tsx
<span className="hidden sm:inline">Desktop text</span>
<span className="sm:hidden">Mobile text</span>
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus states:
```tsx
<Button className="focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Click me
</Button>
```

### Color Contrast

- All text must meet WCAG AA standards (4.5:1 for normal text)
- Use `text-foreground` on `bg-background` (guaranteed contrast)
- Test dark mode separately

### ARIA Labels

```tsx
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>
```

---

## Icon System

### Library

Using `lucide-react` for all icons:
```tsx
import { Icon } from 'lucide-react';
<Icon className="h-5 w-5 text-primary" />
```

### Size Guidelines

- **Inline with text**: `h-4 w-4`
- **Button icons**: `h-5 w-5`
- **Hero icons**: `h-8 w-8`
- **Large features**: `h-12 w-12`

### Common Icons

- Navigation: `ArrowRight`, `ChevronRight`, `Menu`
- Actions: `Plus`, `Edit`, `Trash2`, `Download`
- Status: `Check`, `X`, `AlertTriangle`, `Info`
- Features: `Brain`, `Target`, `TrendingUp`, `Shield`

---

## Design Principles

### 1. Clarity Over Cleverness
- Use plain language, avoid jargon
- Explicit labels, not ambiguous icons alone
- Clear hierarchy with size and weight

### 2. Calm, Senior Aesthetic
- Generous whitespace
- Minimal animations (only for feedback)
- Restrained color palette
- No "gamification" or "quiz" vibes

### 3. Mobile-First Responsive
- Touch-friendly targets (min 44×44px)
- Single-column layouts on mobile
- Readable text without zooming

### 4. Consistent Patterns
- Reuse components, don't create one-offs
- Follow established interaction patterns
- Maintain token-based styling

### 5. Accessible by Default
- Semantic HTML
- Keyboard navigable
- Screen reader friendly
- High contrast in both modes
