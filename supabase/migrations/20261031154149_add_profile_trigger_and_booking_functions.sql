/*
# Add sign-up profile creation and counter functions

1. New Functions
- `handle_new_user()` creates a `profiles` row automatically when someone signs up, so every account has a profile.
- `reserve_tour_slot(slot_id)` adds one booking to a tour slot, but only while the slot still has free places.
- `increment_school_inquiries(school_id)` adds one to a school's inquiry counter when a family starts a conversation.

2. Backfill
- Creates profile rows for any existing sign-up accounts that do not have one yet.

3. Security
- The two counter functions are the only way students can change slot and inquiry counters, because they are not allowed to edit those rows directly.
- All functions run with the database owner's rights and set a fixed search path.
- Only signed-in users can run `reserve_tour_slot` and `increment_school_inquiries`. Anonymous visitors cannot.
- The sign-up trigger function is not callable by any app role.
- The old profile delete policy is replaced with a clearly named one that allows platform admins to remove other profiles.

4. Important notes
- Profile rows store only email and name. The platform role can only be changed by a database administrator.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', split_part(coalesce(NEW.email, ''), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, split_part(coalesce(u.email, ''), '@', 1)
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reserve_tour_slot(p_slot_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to book a tour';
  END IF;

  UPDATE public.tour_slots
  SET booked_count = booked_count + 1
  WHERE id = p_slot_id
    AND booked_count < coalesce(capacity, 0);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This tour slot is fully booked';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_school_inquiries(p_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to contact a school';
  END IF;

  UPDATE public.schools
  SET inquiries_count = coalesce(inquiries_count, 0) + 1
  WHERE id = p_school_id
    AND status = 'published';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_tour_slot(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_tour_slot(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_school_inquiries(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_school_inquiries(uuid) TO authenticated;

DROP POLICY IF EXISTS "profiles_delete_none" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  TO authenticated USING (public.is_platform_admin() AND id <> auth.uid());
