/*
# Private bucket for applicant documents

1. New storage
- Bucket `application-documents` (private, not public). Max 10 MB per file. Allowed types: PDF, PNG, JPEG, Word documents.

2. Security
- Applicants can upload, read and delete only files stored in their own folder (folder name = their user id).
- Platform admins and admins of a school can read files attached to that school's applications.
- Re-running this migration is safe: policies are dropped before they are created.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "application_docs_insert_own" ON storage.objects;
CREATE POLICY "application_docs_insert_own" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "application_docs_select" ON storage.objects;
CREATE POLICY "application_docs_select" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.documents::text LIKE '%' || storage.objects.name || '%'
        AND public.is_school_admin(a.school_id)
    )
  )
);

DROP POLICY IF EXISTS "application_docs_delete_own" ON storage.objects;
CREATE POLICY "application_docs_delete_own" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
