/*
# School photo gallery

1. New Tables
- `school_photos`: one row per gallery photo on a school profile.
  - `id` (uuid, primary key)
  - `school_id` (uuid, references schools, removed automatically when the school is deleted)
  - `storage_path` (text, location of the file in the school-images bucket)
  - `sort_order` (integer, display position, default 0)
  - `created_at` (timestamp)

2. Security
- Row level security is enabled.
- Anyone (signed in or not) can view gallery photos, because they appear on public school profiles.
- Only platform administrators, or admissions staff linked to that school, can add or remove photos.
- The public link for each photo is built from its storage path, so the table does not store raw URLs.

3. Notes
- Photos are stored in the school-images bucket under a folder named after the school id.
- Removing a photo row does not remove the file; the file is removed through the bucket policy in the client.
*/

CREATE TABLE IF NOT EXISTS school_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_photos_school_id_idx ON school_photos (school_id, sort_order);

ALTER TABLE school_photos ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON school_photos TO anon, authenticated;
GRANT INSERT, DELETE ON school_photos TO authenticated;

DROP POLICY IF EXISTS "school_photos_select_public" ON school_photos;
CREATE POLICY "school_photos_select_public" ON school_photos FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "school_photos_insert_admins" ON school_photos;
CREATE POLICY "school_photos_insert_admins" ON school_photos FOR INSERT
TO authenticated
WITH CHECK (is_platform_admin() OR is_school_admin(school_id));

DROP POLICY IF EXISTS "school_photos_delete_admins" ON school_photos;
CREATE POLICY "school_photos_delete_admins" ON school_photos FOR DELETE
TO authenticated
USING (is_platform_admin() OR is_school_admin(school_id));
