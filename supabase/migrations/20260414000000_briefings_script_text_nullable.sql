-- generate-briefing performs an early insert of a preliminary briefing row
-- (with raw headlines) before the script is produced. The old NOT NULL
-- constraint made that insert fail with code 23502, which was surfaced to
-- users as the Briefing card flipping back to "Generate" after ~15s.
-- Drop the NOT NULL constraint so the two-phase insert/update flow works.
ALTER TABLE briefings ALTER COLUMN script_text DROP NOT NULL;
