-- Add 'ai_landscape' to the briefing_type CHECK constraint
-- This follows the same pattern as the existing briefing types migration

-- Drop existing constraint and recreate with the new type included
-- Using DO block approach for safety
ALTER TABLE IF EXISTS briefings
  DROP CONSTRAINT IF EXISTS briefings_briefing_type_check;

ALTER TABLE IF EXISTS briefings
  ADD CONSTRAINT briefings_briefing_type_check
  CHECK (briefing_type IN ('default', 'macro_trends', 'vendor_landscape', 'competitive_intel', 'boardroom_prep', 'team_update', 'ai_landscape', 'custom_voice'));
