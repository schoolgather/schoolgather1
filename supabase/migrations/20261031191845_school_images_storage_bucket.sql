/*
# School photo storage

1. New storage bucket
- `school-images`: public bucket for school cover photos shown in the directory and on profile pages.
- Accepts JPEG, PNG and WebP files up to 5 MB.

2. Security
- Anyone can view photos through their public link (the photos are marketing content meant to be seen).
- Only platform administrators, or admissions staff linked to the specific school, can upload, replace or delete photos.
- Photos are stored in a folder named after the school id, and that folder is checked against the uploader's school membership.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-images',
  'school-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "school_images_insert_admins" ON storage.objects;
CREATE POLICY "school_images_insert_admins" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-images'
  AND (is_platform_admin() OR is_school_admin(((storage.foldername(name))[1])::uuid))
);

DROP POLICY IF EXISTS "school_images_update_admins" ON storage.objects;
CREATE POLICY "school_images_update_admins" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-images'
  AND (is_platform_admin() OR is_school_admin(((storage.foldername(name))[1])::uuid))
)
WITH CHECK (
  bucket_id = 'school-images'
  AND (is_platform_admin() OR is_school_admin(((storage.foldername(name))[1])::uuid))
);

DROP POLICY IF EXISTS "school_images_delete_admins" ON storage.objects;
CREATE POLICY "school_images_delete_admins" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-images'
  AND (is_platform_admin() OR is_school_admin(((storage.foldername(name))[1])::uuid))
);
