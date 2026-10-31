/*
# Enable live updates for the schools table

1. What changes
- The `schools` table is added to Supabase's realtime publication, so connected admin screens receive inserts, updates and deletes as they happen.

2. Security
- No table, column, grant or policy changes. Realtime delivery still follows the existing row level security: platform administrators see every school (including drafts), school managers see their own schools, and the public only receives published schools.

3. Notes
- The change is idempotent: the table is only added when it is not already in the publication.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'schools'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.schools;
  END IF;
END $$;
