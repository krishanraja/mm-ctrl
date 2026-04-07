-- CTRL Briefing Redesign: support multiple briefing types per day
-- Migration: add briefing_type, custom_context, voice_note_url, is_pro_only columns

-- Add new columns
ALTER TABLE briefings ADD COLUMN IF NOT EXISTS briefing_type TEXT NOT NULL DEFAULT 'default';
ALTER TABLE briefings ADD COLUMN IF NOT EXISTS custom_context TEXT;
ALTER TABLE briefings ADD COLUMN IF NOT EXISTS voice_note_url TEXT;
ALTER TABLE briefings ADD COLUMN IF NOT EXISTS is_pro_only BOOLEAN NOT NULL DEFAULT false;

-- Add CHECK constraint for briefing_type
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS briefings_briefing_type_check;
ALTER TABLE briefings ADD CONSTRAINT briefings_briefing_type_check
  CHECK (briefing_type IN ('default', 'macro_trends', 'vendor_landscape', 'competitive_intel', 'boardroom_prep', 'team_update', 'custom_voice'));

-- Drop old unique constraint (one briefing per user per day)
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS briefings_user_id_briefing_date_key;

-- New partial unique index: one per preset type per day, but allow multiple custom_voice
CREATE UNIQUE INDEX IF NOT EXISTS idx_briefings_user_date_type
  ON briefings(user_id, briefing_date, briefing_type)
  WHERE briefing_type != 'custom_voice';

-- Index for fetching all briefings for a user on a given day
DROP INDEX IF EXISTS idx_briefings_user_date;
CREATE INDEX IF NOT EXISTS idx_briefings_user_date ON briefings(user_id, briefing_date DESC, briefing_type);
