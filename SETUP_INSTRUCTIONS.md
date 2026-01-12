# Deep Context & Meeting Prep Setup Instructions

## 1. Create Stripe Prices ✅

### Option A: Using the Script (Recommended)

Run the script locally with your Stripe secret key:

```bash
STRIPE_SECRET_KEY=sk_live_... deno run --allow-env --allow-net scripts/create-stripe-prices.ts
```

Or via Supabase Edge Function (one-time call):

```bash
# Set STRIPE_SECRET_KEY in Supabase Edge Function secrets first
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-stripe-prices \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Option B: Manual Creation via Stripe Dashboard

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **Add product**

**Deep Context Product:**
- Name: `Deep Context Upgrade`
- Description: `Connect your company context for personalized insights and enhanced meeting prep materials`
- Price: `$29.00 USD` (one-time)
- Copy the Price ID (starts with `price_`)

**Bundle Product:**
- Name: `Full Diagnostic + Deep Context Bundle`
- Description: `Get the complete diagnostic plus deep context integration (Save $10)`
- Price: `$69.00 USD` (one-time)
- Copy the Price ID (starts with `price_`)

### Update Price IDs

After creating the prices, update `supabase/functions/create-diagnostic-payment/index.ts`:

```typescript
const DEEP_CONTEXT_PRICE_ID = "price_YOUR_DEEP_CONTEXT_PRICE_ID";
const BUNDLE_PRICE_ID = "price_YOUR_BUNDLE_PRICE_ID";
```

---

## 2. Set Up Supabase Storage Bucket

### Step 1: Create Storage Bucket

1. Go to [Supabase Dashboard → Storage](https://supabase.com/dashboard/project/_/storage/buckets)
2. Click **New bucket**
3. Configure:
   - **Name**: `documents`
   - **Public bucket**: ❌ (Unchecked - private)
   - **File size limit**: `50 MB` (or your preferred limit)
   - **Allowed MIME types**: `application/pdf` (or leave empty for all types)

### Step 2: Set Up Storage Policies

Run this SQL in your Supabase SQL Editor:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own documents
CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 3: Update ConnectContextUpgrade Component (Optional)

If you want to use a different folder structure (e.g., by leader_id instead of user_id), update the upload path in `src/components/ConnectContextUpgrade.tsx`:

```typescript
const filePath = `board-decks/${leaderId}/${fileName}`;
```

---

## 3. Apollo.io API Key ✅

Already configured! The `APOLLO_API_KEY` is set in Supabase Edge Function secrets.

---

## 4. Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Create company_context table for enriched company intelligence
CREATE TABLE IF NOT EXISTS public.company_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID REFERENCES public.leaders(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  apollo_data JSONB DEFAULT '{}'::jsonb,
  website_url TEXT,
  website_content TEXT,
  board_deck_urls TEXT[] DEFAULT '{}',
  board_deck_content JSONB DEFAULT '[]'::jsonb,
  calendar_connected BOOLEAN DEFAULT false,
  calendar_events JSONB DEFAULT '[]'::jsonb,
  enrichment_status TEXT NOT NULL DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'partial', 'complete')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meeting_prep_sessions table for generated meeting prep materials
CREATE TABLE IF NOT EXISTS public.meeting_prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.leader_assessments(id) ON DELETE CASCADE NOT NULL,
  company_context_id UUID REFERENCES public.company_context(id) ON DELETE SET NULL,
  meeting_title TEXT NOT NULL,
  meeting_date DATE,
  agenda_text TEXT NOT NULL,
  prep_materials JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add has_deep_context column to leader_assessments
ALTER TABLE public.leader_assessments 
ADD COLUMN IF NOT EXISTS has_deep_context BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_context_leader_id ON public.company_context(leader_id);
CREATE INDEX IF NOT EXISTS idx_company_context_assessment_id ON public.company_context(assessment_id);
CREATE INDEX IF NOT EXISTS idx_meeting_prep_sessions_assessment_id ON public.meeting_prep_sessions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_meeting_prep_sessions_company_context_id ON public.meeting_prep_sessions(company_context_id);
CREATE INDEX IF NOT EXISTS idx_meeting_prep_sessions_meeting_date ON public.meeting_prep_sessions(meeting_date);

-- Enable RLS on new tables
ALTER TABLE public.company_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_prep_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_context table
CREATE POLICY "Users can view their own company context"
  ON public.company_context FOR SELECT
  USING (
    leader_id IN (
      SELECT id FROM public.leaders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own company context"
  ON public.company_context FOR INSERT
  WITH CHECK (
    leader_id IN (
      SELECT id FROM public.leaders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own company context"
  ON public.company_context FOR UPDATE
  USING (
    leader_id IN (
      SELECT id FROM public.leaders 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR id::text = auth.uid()::text
    )
  );

CREATE POLICY "Service can insert company context"
  ON public.company_context FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update company context"
  ON public.company_context FOR UPDATE
  USING (true);

-- RLS Policies for meeting_prep_sessions table
CREATE POLICY "Users can view their own meeting prep sessions"
  ON public.meeting_prep_sessions FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR l.id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert their own meeting prep sessions"
  ON public.meeting_prep_sessions FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own meeting prep sessions"
  ON public.meeting_prep_sessions FOR UPDATE
  USING (
    assessment_id IN (
      SELECT la.id FROM public.leader_assessments la
      JOIN public.leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      OR l.id::text = auth.uid()::text
    )
  );

CREATE POLICY "Service can insert meeting prep sessions"
  ON public.meeting_prep_sessions FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at on company_context
CREATE OR REPLACE FUNCTION update_company_context_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_context_updated_at_trigger
  BEFORE UPDATE ON public.company_context
  FOR EACH ROW
  EXECUTE FUNCTION update_company_context_updated_at();

-- Create trigger for updated_at on meeting_prep_sessions
CREATE OR REPLACE FUNCTION update_meeting_prep_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meeting_prep_sessions_updated_at_trigger
  BEFORE UPDATE ON public.meeting_prep_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_prep_sessions_updated_at();

COMMENT ON TABLE public.company_context IS 'Stores enriched company intelligence from Apollo.io and user-provided context';
COMMENT ON TABLE public.meeting_prep_sessions IS 'Stores generated meeting prep materials combining diagnostic results with meeting agendas';
```

---

## Verification Checklist

After completing all steps:

- [ ] Stripe prices created and IDs updated in `create-diagnostic-payment/index.ts`
- [ ] Supabase storage bucket `documents` created
- [ ] Storage policies applied
- [ ] Database migration executed successfully
- [ ] Test passive Apollo.io enrichment (complete an assessment with company name)
- [ ] Test Connect Context upgrade flow
- [ ] Test Meeting Prep generation with and without context

---

## Testing

1. **Test Passive Enrichment:**
   - Complete a diagnostic with a company name
   - Check browser console for "Enriching company context..." message
   - Verify `company_context` table has a new entry

2. **Test Connect Context:**
   - Go to results page
   - Find "Connect Your Context" card
   - Add website URL or upload board deck
   - Verify enrichment completes

3. **Test Meeting Prep:**
   - Navigate to Meeting Prep tab
   - Paste a meeting agenda
   - Generate prep materials
   - Verify prep materials are stored and displayed

4. **Test Payment Flow:**
   - Click upgrade button
   - Complete Stripe checkout
   - Verify `has_deep_context` or `has_full_diagnostic` is updated
