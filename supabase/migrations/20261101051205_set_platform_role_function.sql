/*
# Let platform admins grant or remove admin access for other people

1. New function
- `set_platform_role(p_user_id, p_role)` changes a person's platform role to `user` or `admin`.

2. Security
- Only a signed-in platform admin can call it. Anyone else gets "Not authorized".
- An admin cannot remove their own admin access, so the platform always keeps at least one admin.
- Execute permission is revoked from the public and anonymous roles and granted to signed-in users only (the check above applies to every caller).
- The profiles table still does not allow direct role edits from the browser.

3. Notes
- Re-running this migration is safe: the function is replaced if it already exists.
*/

CREATE OR REPLACE FUNCTION public.set_platform_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF p_user_id = auth.uid() AND p_role <> 'admin' THEN
    RAISE EXCEPTION 'You cannot remove your own admin access';
  END IF;

  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_platform_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_platform_role(uuid, text) TO authenticated;
