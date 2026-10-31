/*
# Create core School Gather tables with row-level access rules

1. New Tables
- `profiles`: one row per signed-in user (id matches the auth user), with email, name, and platform role.
- `schools`: public school directory entries, including fees, programs, admissions contacts and admin email list.
- `tour_slots`: bookable campus or virtual visit slots published by a school.
- `tour_bookings`: a family's booking for a tour slot.
- `applications`: student applications to a school, with status, timeline and documents.
- `bookmarks`: schools a user has saved.
- `match_profiles`: saved answers and ranked results from the matching quiz.
- `threads` and `messages`: admissions conversations between a family and a school.
- `profile_views`: lightweight view tracking for school pages.
- `audit_logs`: platform admin activity log.

2. Helper functions
- `set_updated_date()` keeps `updated_date` current on update.
- `is_platform_admin()` tells whether the signed-in user has the platform admin role.
- `is_school_admin(school)` tells whether the signed-in user's email is listed in that school's admin emails.

3. Security
- Row level security is enabled on every table.
- Published schools and tour slots are readable by anyone (visitors can browse without signing in).
- Everything else requires sign-in and is limited to the owner, the school's admissions team, or platform admins.
- Users cannot change their own platform role. Only the role column is withheld from the update grant.
- Each table has separate select, insert, update and delete policies.

4. Important notes
- School admin access is granted by matching the signed-in email against the school's admin email list.
- Table grants are limited to the roles and verbs each policy needs.
- Counters that students cannot write directly (tour bookings, inquiries) are handled by separate database functions in a follow-up migration.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  description text,
  curriculum_type text NOT NULL CHECK (curriculum_type IN ('IB', 'British', 'American', 'National', 'French', 'Other')),
  city text,
  country text,
  address text,
  latitude numeric,
  longitude numeric,
  tuition_min numeric DEFAULT 0,
  tuition_max numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  fee_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  accreditation_details text,
  age_range text,
  student_teacher_ratio text,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  programs jsonb NOT NULL DEFAULT '[]'::jsonb,
  facilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  extracurriculars jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_styles jsonb NOT NULL DEFAULT '[]'::jsonb,
  support_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  grades_offered jsonb NOT NULL DEFAULT '[]'::jsonb,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  logo_url text,
  cover_image_url text,
  scholarship_available boolean DEFAULT false,
  merit_scholarship_pct numeric DEFAULT 0,
  views_count integer DEFAULT 0,
  inquiries_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  capacity integer,
  founded_year integer,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  admin_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  contact_email text,
  contact_phone text,
  website text,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_date := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_school_admin(p_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.schools s,
         jsonb_array_elements_text(s.admin_emails) AS admin_email
    WHERE s.id = p_school_id
      AND lower(admin_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_school_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_school_admin(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.tour_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name text,
  school_admin_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  date date NOT NULL,
  start_time text NOT NULL,
  duration_minutes integer DEFAULT 45,
  capacity integer DEFAULT 6,
  booked_count integer NOT NULL DEFAULT 0,
  mode text DEFAULT 'On campus',
  meeting_point text,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid REFERENCES public.tour_slots(id) ON DELETE SET NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name text,
  school_admin_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  student_email text NOT NULL,
  student_name text,
  contact_phone text,
  date text,
  start_time text,
  mode text,
  status text NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name text,
  school_slug text,
  student_email text NOT NULL,
  student_name text,
  guardian_name text,
  guardian_email text,
  guardian_phone text,
  grade_applying text,
  academic_year text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'ENROLLED')),
  personal_statement text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  interview_at timestamptz,
  decision_note text,
  submitted_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name text,
  school_slug text,
  city text,
  curriculum_type text,
  tuition_min numeric,
  tuition_max numeric,
  logo_url text,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now(),
  UNIQUE (created_by, school_id)
);

CREATE TABLE IF NOT EXISTS public.match_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_name text,
  school_slug text,
  student_email text NOT NULL,
  student_name text,
  participant_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  subject text,
  last_message_at timestamptz,
  last_message_preview text,
  admin_unread integer NOT NULL DEFAULT 0,
  student_unread integer NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  participant_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  sender_email text,
  sender_name text,
  sender_role text CHECK (sender_role IN ('student', 'school_admin')),
  content text NOT NULL,
  read_by_admin boolean NOT NULL DEFAULT false,
  read_by_student boolean NOT NULL DEFAULT false,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  school_admin_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  page text NOT NULL DEFAULT 'profile' CHECK (page IN ('profile', 'apply', 'tour')),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  detail text,
  created_by uuid DEFAULT auth.uid(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_date timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools (status);
CREATE INDEX IF NOT EXISTS idx_tour_slots_school_date ON public.tour_slots (school_id, date);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_school ON public.tour_bookings (school_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_created_by ON public.tour_bookings (created_by);
CREATE INDEX IF NOT EXISTS idx_applications_school ON public.applications (school_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_by ON public.applications (created_by);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_by ON public.bookmarks (created_by);
CREATE INDEX IF NOT EXISTS idx_match_profiles_created_by ON public.match_profiles (created_by);
CREATE INDEX IF NOT EXISTS idx_threads_school ON public.threads (school_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_by ON public.threads (created_by);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON public.messages (thread_id, created_date);
CREATE INDEX IF NOT EXISTS idx_profile_views_school ON public.profile_views (school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_date ON public.audit_logs (created_date);

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','schools','tour_slots','tour_bookings','applications','bookmarks','match_profiles','threads','messages','profile_views','audit_logs']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_date ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_date BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_date()', t);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, email, full_name) ON public.profiles TO authenticated;
GRANT UPDATE (email, full_name) ON public.profiles TO authenticated;
GRANT SELECT ON public.schools TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT SELECT ON public.tour_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT INSERT ON public.profile_views TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.profile_views TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT
  TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_platform_admin());
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "profiles_delete_none" ON public.profiles;
CREATE POLICY "profiles_delete_none" ON public.profiles FOR DELETE
  TO authenticated USING (public.is_platform_admin() AND id <> auth.uid());

DROP POLICY IF EXISTS "schools_select_published" ON public.schools;
CREATE POLICY "schools_select_published" ON public.schools FOR SELECT
  TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "schools_select_managers" ON public.schools;
CREATE POLICY "schools_select_managers" ON public.schools FOR SELECT
  TO authenticated USING (public.is_school_admin(id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "schools_insert_admin" ON public.schools;
CREATE POLICY "schools_insert_admin" ON public.schools FOR INSERT
  TO authenticated WITH CHECK (public.is_platform_admin());
DROP POLICY IF EXISTS "schools_update_managers" ON public.schools;
CREATE POLICY "schools_update_managers" ON public.schools FOR UPDATE
  TO authenticated USING (public.is_school_admin(id) OR public.is_platform_admin())
  WITH CHECK (public.is_school_admin(id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "schools_delete_admin" ON public.schools;
CREATE POLICY "schools_delete_admin" ON public.schools FOR DELETE
  TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "tour_slots_select_public" ON public.tour_slots;
CREATE POLICY "tour_slots_select_public" ON public.tour_slots FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tour_slots_insert_managers" ON public.tour_slots;
CREATE POLICY "tour_slots_insert_managers" ON public.tour_slots FOR INSERT
  TO authenticated WITH CHECK (public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "tour_slots_update_managers" ON public.tour_slots;
CREATE POLICY "tour_slots_update_managers" ON public.tour_slots FOR UPDATE
  TO authenticated USING (public.is_school_admin(school_id) OR public.is_platform_admin())
  WITH CHECK (public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "tour_slots_delete_managers" ON public.tour_slots;
CREATE POLICY "tour_slots_delete_managers" ON public.tour_slots FOR DELETE
  TO authenticated USING (public.is_school_admin(school_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "tour_bookings_select" ON public.tour_bookings;
CREATE POLICY "tour_bookings_select" ON public.tour_bookings FOR SELECT
  TO authenticated USING (created_by = auth.uid() OR public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "tour_bookings_insert_own" ON public.tour_bookings;
CREATE POLICY "tour_bookings_insert_own" ON public.tour_bookings FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "tour_bookings_update" ON public.tour_bookings;
CREATE POLICY "tour_bookings_update" ON public.tour_bookings FOR UPDATE
  TO authenticated USING (created_by = auth.uid() OR public.is_school_admin(school_id) OR public.is_platform_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "tour_bookings_delete_own" ON public.tour_bookings;
CREATE POLICY "tour_bookings_delete_own" ON public.tour_bookings FOR DELETE
  TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "applications_select" ON public.applications;
CREATE POLICY "applications_select" ON public.applications FOR SELECT
  TO authenticated USING (created_by = auth.uid() OR public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "applications_insert_own" ON public.applications;
CREATE POLICY "applications_insert_own" ON public.applications FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "applications_update_applicant" ON public.applications;
CREATE POLICY "applications_update_applicant" ON public.applications FOR UPDATE
  TO authenticated USING (created_by = auth.uid() AND status IN ('DRAFT', 'SUBMITTED'))
  WITH CHECK (created_by = auth.uid() AND status IN ('DRAFT', 'SUBMITTED'));
DROP POLICY IF EXISTS "applications_update_managers" ON public.applications;
CREATE POLICY "applications_update_managers" ON public.applications FOR UPDATE
  TO authenticated USING (public.is_school_admin(school_id) OR public.is_platform_admin())
  WITH CHECK (public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "applications_delete_own" ON public.applications;
CREATE POLICY "applications_delete_own" ON public.applications FOR DELETE
  TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT
  TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "bookmarks_update_own" ON public.bookmarks;
CREATE POLICY "bookmarks_update_own" ON public.bookmarks FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE
  TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "match_profiles_select_own" ON public.match_profiles;
CREATE POLICY "match_profiles_select_own" ON public.match_profiles FOR SELECT
  TO authenticated USING (created_by = auth.uid());
DROP POLICY IF EXISTS "match_profiles_insert_own" ON public.match_profiles;
CREATE POLICY "match_profiles_insert_own" ON public.match_profiles FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "match_profiles_update_own" ON public.match_profiles;
CREATE POLICY "match_profiles_update_own" ON public.match_profiles FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "match_profiles_delete_own" ON public.match_profiles;
CREATE POLICY "match_profiles_delete_own" ON public.match_profiles FOR DELETE
  TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "threads_select" ON public.threads;
CREATE POLICY "threads_select" ON public.threads FOR SELECT
  TO authenticated USING (created_by = auth.uid() OR public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "threads_insert_own" ON public.threads;
CREATE POLICY "threads_insert_own" ON public.threads FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update" ON public.threads FOR UPDATE
  TO authenticated USING (created_by = auth.uid() OR public.is_school_admin(school_id) OR public.is_platform_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "threads_delete_own" ON public.threads;
CREATE POLICY "threads_delete_own" ON public.threads FOR DELETE
  TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = messages.thread_id
      AND (t.created_by = auth.uid() OR public.is_school_admin(t.school_id) OR public.is_platform_admin())
  ));
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = messages.thread_id
      AND (t.created_by = auth.uid() OR public.is_school_admin(t.school_id) OR public.is_platform_admin())
  ));
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = messages.thread_id
      AND (t.created_by = auth.uid() OR public.is_school_admin(t.school_id) OR public.is_platform_admin())
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = messages.thread_id
      AND (t.created_by = auth.uid() OR public.is_school_admin(t.school_id) OR public.is_platform_admin())
  ));
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;
CREATE POLICY "messages_delete_own" ON public.messages FOR DELETE
  TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "profile_views_insert_public" ON public.profile_views;
CREATE POLICY "profile_views_insert_public" ON public.profile_views FOR INSERT
  TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.schools s WHERE s.id = profile_views.school_id AND s.status = 'published'));
DROP POLICY IF EXISTS "profile_views_select_managers" ON public.profile_views;
CREATE POLICY "profile_views_select_managers" ON public.profile_views FOR SELECT
  TO authenticated USING (public.is_school_admin(school_id) OR public.is_platform_admin());
DROP POLICY IF EXISTS "profile_views_update_admin" ON public.profile_views;
CREATE POLICY "profile_views_update_admin" ON public.profile_views FOR UPDATE
  TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
DROP POLICY IF EXISTS "profile_views_delete_admin" ON public.profile_views;
CREATE POLICY "profile_views_delete_admin" ON public.profile_views FOR DELETE
  TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs FOR SELECT
  TO authenticated USING (public.is_platform_admin());
DROP POLICY IF EXISTS "audit_logs_insert_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_admin" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_platform_admin());
DROP POLICY IF EXISTS "audit_logs_update_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_update_admin" ON public.audit_logs FOR UPDATE
  TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
DROP POLICY IF EXISTS "audit_logs_delete_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_delete_admin" ON public.audit_logs FOR DELETE
  TO authenticated USING (public.is_platform_admin());
