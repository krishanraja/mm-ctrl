-- Historical migration marker for the one-time R98 retirement cleanup that was
-- applied to the isolated Legibility project before the application schema was
-- replayed. The destructive, exact-shape preflight remains frozen at:
--   supabase/candidates/g25_legibility_project_cleanup_r98.sql
--
-- It is deliberately not repeated in the normal migration stream. A fresh
-- project has nothing to retire, while an occupied project must run the frozen
-- preflight explicitly rather than receive a broad destructive migration.
select 1;
