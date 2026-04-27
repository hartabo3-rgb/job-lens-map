-- Move role checks to an internal schema to avoid exposing security-definer helpers directly
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION private.has_role(UUID, public.app_role) FROM authenticated;

-- Replace policies that used the exposed helper
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert commercial towers" ON public.commercial_towers;
DROP POLICY IF EXISTS "Admins can update commercial towers" ON public.commercial_towers;
DROP POLICY IF EXISTS "Admins can delete commercial towers" ON public.commercial_towers;

CREATE POLICY "Admins can insert commercial towers"
ON public.commercial_towers
FOR INSERT
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update commercial towers"
ON public.commercial_towers
FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete commercial towers"
ON public.commercial_towers
FOR DELETE
USING (private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role);

-- Keep company logos private from bucket listing; app will request signed display URLs
UPDATE storage.buckets
SET public = false
WHERE id = 'company-logos';

DROP POLICY IF EXISTS "Company logos are publicly viewable" ON storage.objects;
CREATE POLICY "Company logos are readable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');