# Replication Guide

Step-by-step instructions to replicate Mindmaker from scratch.

---

## Prerequisites

- Node.js 18+
- npm or bun
- Supabase CLI
- OpenAI API key
- Stripe account (for payments)

---

## Step 1: Initialize Project

```bash
# Create React + TypeScript + Vite project
npm create vite@latest mindmaker -- --template react-ts
cd mindmaker

# Install core dependencies
npm install @supabase/supabase-js @tanstack/react-query
npm install react-router-dom zod
npm install tailwindcss postcss autoprefixer
npm install lucide-react class-variance-authority clsx tailwind-merge

# Install shadcn/ui
npx shadcn-ui@latest init
```

---

## Step 2: Configure Tailwind + Design System

**tailwind.config.ts**:
```ts
import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        // ... (see DESIGN_SYSTEM.md for full list)
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
} satisfies Config
```

**src/index.css**: (see DESIGN_SYSTEM.md for full CSS variables)

---

## Step 3: Set Up Supabase

```bash
# Initialize Supabase project
supabase init

# Link to remote project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

**Create `.env`**:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**src/integrations/supabase/client.ts**:
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Step 4: Database Schema

Run migrations in `supabase/migrations/`:
1. Create `leaders` table
2. Create `leader_assessments` table
3. Create dimension/insights/prompts tables
4. Create `index_participant_data` table
5. Set up RLS policies

(See ARCHITECTURE.md for full schema)

---

## Step 5: Install shadcn Components

```bash
npx shadcn-ui@latest add button card badge input label
npx shadcn-ui@latest add tabs dialog select checkbox
npx shadcn-ui@latest add progress skeleton tooltip
```

---

## Step 6: Create Core Files

**src/types/pipeline.ts**: (see project-documentation/ARCHITECTURE.md)

**src/utils/pipelineGuards.ts**: Input validation

**src/utils/orchestrateAssessmentV2.ts**: Main orchestration logic

**src/utils/aggregateLeaderResults.ts**: Data aggregation

**src/utils/edgeFunctionClient.ts**: Edge function wrapper

---

## Step 7: Build UI Components

**src/components/HeroSection.tsx**: Landing page

**src/components/UnifiedAssessment.tsx**: Quiz + voice flow

**src/components/UnifiedResults.tsx**: Results with tabs

**src/components/LeadershipBenchmarkV2.tsx**: Overview tab

**src/components/TensionsView.tsx**: Tensions tab

**src/components/PromptLibraryV2.tsx**: Tools tab

---

## Step 8: Edge Functions

**supabase/functions/create-leader-assessment/index.ts**:
```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Parse request body
  // Create assessment record
  // Calculate scores
  // Return assessmentId
})
```

Create similar functions for:
- generate-personalized-insights
- generate-prompt-library
- compute-tensions
- compute-risk-signals
- derive-org-scenarios

**Deploy**:
```bash
supabase functions deploy function-name
```

---

## Step 9: Configure Secrets

In Supabase dashboard, add secrets:
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`

---

## Step 10: Set Up Routing

**src/main.tsx**:
```tsx
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
)
```

**src/App.tsx**:
```tsx
import { Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
```

---

## Step 11: Test Locally

```bash
# Start dev server
npm run dev

# In separate terminal, start Supabase locally
supabase start

# Test edge functions locally
supabase functions serve
```

---

## Step 12: Deploy

**Frontend** (Lovable Cloud):
```bash
git push origin main  # Auto-deploys
```

**Edge Functions**:
```bash
supabase functions deploy --project-ref YOUR_REF
```

**Database**:
```bash
supabase db push --project-ref YOUR_REF
```

---

## Verification Checklist

- [ ] Landing page loads
- [ ] Quiz assessment completes
- [ ] Voice assessment completes
- [ ] Results display correctly
- [ ] All tabs work (Overview, Tensions, Tools)
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Edge functions don't timeout
- [ ] Payment flow works
- [ ] Email confirmations send

---

## Common Setup Issues

**Issue**: Supabase client returns 401
**Fix**: Check VITE_SUPABASE_ANON_KEY is correct

**Issue**: Edge functions timeout
**Fix**: Increase timeout in Supabase dashboard, check OpenAI API key

**Issue**: Types out of sync
**Fix**: Run `supabase gen types typescript > src/integrations/supabase/types.ts`

**Issue**: CSS variables not applying
**Fix**: Ensure index.css imported in main.tsx

---

## Time Estimate

- Initial setup: 2 hours
- Database schema: 3 hours
- UI components: 8 hours
- Edge functions: 6 hours
- Testing & debugging: 4 hours

**Total**: ~23 hours for experienced developer
