# Video Background Pattern - Complete Guide

**Last Updated:** 2025-01-27  
**Status:** ✅ Architectural Pattern Established

---

## Overview

This document provides the complete pattern for implementing video backgrounds that are visible and properly layered. This pattern prevents the common architectural issue where video backgrounds are blocked by solid background layers.

---

## Standard Pattern

### Complete Example

```tsx
import { HeroSection } from '@/components/HeroSection';

// ✅ CORRECT: App.tsx root has NO bg-background
const App = () => (
  <div className="min-h-screen">
    {/* No bg-background here - allows child components to control backgrounds */}
    <Routes>
      <Route path="/" element={<Index />} />
    </Routes>
  </div>
);

// ✅ CORRECT: Component with video background
export function HeroSection() {
  return (
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
        <source src="/Mindmaker for Leaders - background video.mp4" type="video/mp4" />
      </video>
      
      {/* Semi-transparent black overlay - 50% opacity */}
      <div className="fixed inset-0 bg-black/50 -z-10 pointer-events-none" />
      
      {/* Content */}
      <main className="relative z-10">
        {/* Your content here */}
      </main>
    </div>
  );
}
```

---

## Critical Rules

### 1. Root App Component

**❌ WRONG:**
```tsx
// App.tsx
<div className="min-h-screen bg-background">
  {/* This blocks video backgrounds in child components */}
</div>
```

**✅ CORRECT:**
```tsx
// App.tsx
<div className="min-h-screen">
  {/* No bg-background - allows child components to control backgrounds */}
</div>
```

**Why:** The root App component creates a stacking context. If it has `bg-background`, it creates a solid black layer (`rgb(10, 10, 10)`) that blocks video elements even if they have correct z-index values.

### 2. Component Parent Container

**❌ WRONG:**
```tsx
<div className="relative min-h-[100dvh] bg-background flex flex-col">
  <video className="opacity-100 -z-20" />
  {/* Video blocked by parent bg-background */}
</div>
```

**✅ CORRECT:**
```tsx
<div className="relative min-h-[100dvh] flex flex-col">
  {/* No bg-background on parent */}
  <video className="opacity-100 -z-20" />
</div>
```

### 3. Video Element Configuration

**Required Classes:**
- `opacity-100` - Full opacity (transparency controlled by overlay)
- `-z-20` - Base layer z-index
- `fixed inset-0` - Full viewport coverage
- `object-cover` - Maintain aspect ratio while covering
- `pointer-events-none` - Allow clicks to pass through

**Required Attributes:**
- `autoPlay` - Start playing automatically
- `loop` - Loop video
- `muted` - Required for autoplay in browsers
- `playsInline` - Prevent fullscreen on mobile
- `preload="metadata"` - Load video metadata

### 4. Overlay Element

**Required Classes:**
- `bg-black/50` - 50% black overlay (Tailwind opacity syntax)
- `-z-10` - Above video, below content
- `fixed inset-0` - Full viewport coverage
- `pointer-events-none` - Allow clicks to pass through

**Alternative (Custom Opacity):**
```tsx
<div 
  className="fixed inset-0 -z-10 pointer-events-none"
  style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
/>
```

### 5. Z-Index System

**Standard Layering (from bottom to top):**
```
-z-20: Video backgrounds (base layer)
-z-10: Overlays (semi-transparent backgrounds)
z-0:   Base content
z-10:  Main content
z-20:  Headers, navigation
z-50:  Modals, dropdowns, tooltips
```

**Never use arbitrary z-index values** - follow the documented system.

---

## Mobile-Only Video Pattern

For components that only show video on mobile:

```tsx
<div className="relative min-h-[100dvh] flex flex-col">
  {/* Mobile-only video */}
  <video
    className="fixed inset-0 w-full h-full object-cover opacity-100 md:hidden -z-20 pointer-events-none"
    autoPlay
    loop
    muted
    playsInline
    preload="metadata"
  >
    <source src="/video.mp4" type="video/mp4" />
  </video>
  
  {/* Mobile-only overlay */}
  <div className="fixed inset-0 bg-black/50 md:hidden -z-10 pointer-events-none" />
  
  {/* Content - visible on all screen sizes */}
  <main className="relative z-10">...</main>
</div>
```

---

## Common Mistakes

### Mistake 1: bg-background on Root
```tsx
// ❌ WRONG
<div className="min-h-screen bg-background">
```
**Fix:** Remove `bg-background` from App.tsx root

### Mistake 2: Video Opacity Too Low
```tsx
// ❌ WRONG
<video className="opacity-20 -z-10" />
```
**Fix:** Use `opacity-100` and control transparency with overlay

### Mistake 3: Missing Overlay
```tsx
// ❌ WRONG - Video too bright, no contrast
<video className="opacity-100 -z-20" />
```
**Fix:** Add overlay: `<div className="bg-black/50 -z-10" />`

### Mistake 4: Wrong Z-Index
```tsx
// ❌ WRONG
<video className="opacity-100 -z-10" />
<div className="bg-black/50 -z-20" />
```
**Fix:** Video: `-z-20`, Overlay: `-z-10`

### Mistake 5: Parent Container Background
```tsx
// ❌ WRONG
<div className="bg-background">
  <video className="opacity-100 -z-20" />
</div>
```
**Fix:** Remove `bg-background` from parent

---

## Validation

### Build-Time Validation

Run before deployment:
```bash
npm run validate:video
```

This checks:
- ✅ No `bg-background` on App.tsx root
- ✅ Video has `opacity-100 -z-20`
- ✅ Overlay has `bg-black/50 -z-10`
- ✅ Parent container has no `bg-background`

### Component Tests

Tests verify:
- Video element has correct opacity and z-index
- Overlay element exists with correct classes
- Parent container does not have bg-background
- Video has required attributes (autoplay, loop, muted)

Run tests:
```bash
npm test HeroSection.video
```

---

## TypeScript Support

Use type-safe configuration:

```typescript
import { VideoBackgroundConfig, validateVideoBackground } from '@/types/video-background';

const config: VideoBackgroundConfig = {
  videoSrc: '/video.mp4',
  overlayOpacity: 0.5,
  zIndexVideo: -20,
  zIndexOverlay: -10,
  autoplay: true,
  loop: true,
  muted: true,
};

if (!validateVideoBackground(config)) {
  console.error('Invalid video background configuration');
}
```

---

## Browser Compatibility

### Supported Browsers
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Autoplay Policies
- Videos must be `muted` for autoplay to work
- Some browsers require user interaction before autoplay
- `playsInline` required for iOS Safari

### Fallback
If video fails to load or autoplay is blocked:
- Video element still renders (may be paused)
- Overlay still provides darkening
- Content remains visible and functional

---

## Performance Considerations

### Video File Optimization
- Use compressed MP4 (H.264 codec)
- Keep file size reasonable (< 5MB recommended)
- Use `preload="metadata"` to avoid loading full video on page load

### Rendering Performance
- Fixed positioning with negative z-index is GPU-accelerated
- Overlay uses CSS `rgba()` for efficient compositing
- `pointer-events-none` prevents unnecessary event handling

---

## Troubleshooting

### Video Not Visible

1. **Check browser DevTools:**
   - Inspect video element
   - Verify `opacity: 1` (not 0.2)
   - Verify `z-index: -20` (not -10)
   - Check for blocking elements above video

2. **Check parent containers:**
   - Verify App.tsx root has no `bg-background`
   - Verify component parent has no `bg-background`
   - Check for other elements with solid backgrounds

3. **Check overlay:**
   - Verify overlay element exists in DOM
   - Verify overlay has `bg-black/50` or `rgba(0,0,0,0.5)`
   - Verify overlay z-index is `-10`

4. **Check video file:**
   - Verify video file exists at path
   - Check network tab for 404 errors
   - Verify video format is MP4

### Video Too Bright/Dark

- **Too bright:** Increase overlay opacity (e.g., `bg-black/60` for 60%)
- **Too dark:** Decrease overlay opacity (e.g., `bg-black/40` for 40%)

### Video Not Autoplaying

- Verify `muted` attribute is present
- Verify `autoplay` attribute is present
- Check browser autoplay policies
- Some browsers require user interaction first

---

## Related Documentation

- [DESIGN_SYSTEM.md](./project-documentation/DESIGN_SYSTEM.md) - Complete design system
- [VIDEO_DIAGNOSIS.md](./VIDEO_DIAGNOSIS.md) - Diagnostic report
- [Z-Index System](./project-documentation/DESIGN_SYSTEM.md#z-index-system) - Z-index documentation

---

**End of VIDEO_BACKGROUND_PATTERN**
