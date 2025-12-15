-- Phase 1: Foundation Tables
-- Store every question + answer pair for full context traceability

CREATE TABLE IF NOT EXISTS assessment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES leader_assessments(id) ON DELETE CASCADE,
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES leaders(id) ON DELETE CASCADE,
  
  -- Event metadata
  event_type TEXT NOT NULL CHECK (event_type IN ('question_answered', 'voice_recorded', 'deep_profile_completed', 'behavioral_input')),
  tool_name TEXT NOT NULL CHECK (tool_name IN ('quiz', 'voice', 'chat', 'deep_profile')),
  flow_name TEXT,
  
  -- Question context (stored WITH answer for rich context)
  question_id TEXT,
  question_text TEXT NOT NULL,
  dimension_key TEXT,
  
  -- Response data
  raw_input TEXT NOT NULL,
  structured_values JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  response_duration_seconds INTEGER,
  
  -- Context snapshot
  context_snapshot JSONB DEFAULT '{}'
);

CREATE INDEX idx_events_assessment ON assessment_events(assessment_id);
CREATE INDEX idx_events_profile ON assessment_events(profile_id);
CREATE INDEX idx_events_dimension ON assessment_events(dimension_key);
CREATE INDEX idx_events_tool ON assessment_events(tool_name);

COMMENT ON TABLE assessment_events IS 'Raw event log storing question+answer pairs for full context traceability';
COMMENT ON COLUMN assessment_events.question_text IS 'Full question text stored WITH answer - questions provide critical context';

-- Question metadata table
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_key TEXT UNIQUE NOT NULL,
  tool_name TEXT NOT NULL CHECK (tool_name IN ('quiz', 'voice', 'compass', 'deep_profile')),
  dimension_key TEXT NOT NULL,
  
  -- Question content
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'likert_5' CHECK (question_type IN ('likert_5', 'open_ended', 'voice_prompt', 'multiple_choice')),
  options JSONB DEFAULT '[]',
  
  -- Scoring
  weight NUMERIC DEFAULT 1.0,
  reverse_scored BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  display_order INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_tool ON assessment_questions(tool_name);
CREATE INDEX idx_questions_dimension ON assessment_questions(dimension_key);
CREATE INDEX idx_questions_active ON assessment_questions(active) WHERE active = TRUE;

-- Phase 3: Behavioral transparency tables
CREATE TABLE IF NOT EXISTS assessment_behavioral_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES leader_assessments(id) ON DELETE CASCADE,
  
  -- Multipliers applied
  experimentation_weight NUMERIC,
  delegation_weight NUMERIC,
  stakeholder_complexity NUMERIC,
  time_optimization NUMERIC,
  
  -- Rationale (for transparency)
  adjustment_rationale JSONB DEFAULT '{}',
  raw_inputs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_behavioral_assessment ON assessment_behavioral_adjustments(assessment_id);

COMMENT ON TABLE assessment_behavioral_adjustments IS 'Audit trail of behavioral score adjustments with full rationale';

-- Add tool context to chat messages
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS tool_context TEXT,
ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES leader_assessments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_chat_assessment ON chat_messages(assessment_id);

-- Add structured deep profile columns to index_participant_data
ALTER TABLE index_participant_data
ADD COLUMN IF NOT EXISTS time_waste_pct INTEGER,
ADD COLUMN IF NOT EXISTS delegation_tasks_count INTEGER,
ADD COLUMN IF NOT EXISTS stakeholder_count INTEGER,
ADD COLUMN IF NOT EXISTS urgency_level TEXT CHECK (urgency_level IN ('immediate', 'this_quarter', 'exploring', 'future')),
ADD COLUMN IF NOT EXISTS primary_bottleneck TEXT;

-- RLS Policies for new tables
ALTER TABLE assessment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_behavioral_adjustments ENABLE ROW LEVEL SECURITY;

-- assessment_events: users can view their own events
CREATE POLICY "Users can view own assessment events"
  ON assessment_events FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM leaders WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    )
  );

CREATE POLICY "Service can insert assessment events"
  ON assessment_events FOR INSERT
  WITH CHECK (true);

-- assessment_questions: public read, service write
CREATE POLICY "Anyone can view active questions"
  ON assessment_questions FOR SELECT
  USING (active = true);

CREATE POLICY "Service can manage questions"
  ON assessment_questions FOR ALL
  USING (true)
  WITH CHECK (true);

-- assessment_behavioral_adjustments: users can view their own
CREATE POLICY "Users can view own behavioral adjustments"
  ON assessment_behavioral_adjustments FOR SELECT
  USING (
    assessment_id IN (
      SELECT la.id FROM leader_assessments la
      JOIN leaders l ON la.leader_id = l.id
      WHERE l.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    )
  );

CREATE POLICY "Service can insert behavioral adjustments"
  ON assessment_behavioral_adjustments FOR INSERT
  WITH CHECK (true);