-- G25 Auth user profile trigger recovery R86
-- Isolated recovery candidate. Adds the missing Auth-owned trigger only when absent.

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger g
    JOIN pg_class c ON c.oid = g.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT g.tgisinternal
      AND n.nspname = 'auth'
      AND c.relname = 'users'
      AND g.tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_profile();
  END IF;
END
$migration$;
