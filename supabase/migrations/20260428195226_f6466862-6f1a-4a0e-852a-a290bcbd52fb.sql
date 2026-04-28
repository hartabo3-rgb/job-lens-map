DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_sector') THEN
    CREATE TYPE public.job_sector AS ENUM ('private', 'semi_government', 'government');
  END IF;
END $$;

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS sector public.job_sector NOT NULL DEFAULT 'private';

UPDATE public.jobs
SET sector = CASE WHEN is_government THEN 'government'::public.job_sector ELSE 'private'::public.job_sector END;

ALTER TABLE public.company_locations
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID;

ALTER TABLE public.tower_companies
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_kind') THEN
    CREATE TYPE public.announcement_kind AS ENUM ('featured_job', 'site_notice');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  job_id UUID,
  link_url TEXT,
  kind public.announcement_kind NOT NULL DEFAULT 'featured_job',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active site announcements viewable by everyone" ON public.site_announcements;
CREATE POLICY "Active site announcements viewable by everyone"
ON public.site_announcements
FOR SELECT
USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

DROP POLICY IF EXISTS "Admins manage site announcements" ON public.site_announcements;
CREATE POLICY "Admins manage site announcements"
ON public.site_announcements
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_site_announcements_updated_at
BEFORE UPDATE ON public.site_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.government_job_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  application_url TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.government_job_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active government announcements viewable by everyone" ON public.government_job_announcements;
CREATE POLICY "Active government announcements viewable by everyone"
ON public.government_job_announcements
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage government announcements" ON public.government_job_announcements;
CREATE POLICY "Admins manage government announcements"
ON public.government_job_announcements
FOR ALL
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_government_job_announcements_updated_at
BEFORE UPDATE ON public.government_job_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Moderators can close active jobs" ON public.jobs;
CREATE POLICY "Moderators can close active jobs"
ON public.jobs
FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

DROP POLICY IF EXISTS "Admins and moderators can verify company locations" ON public.company_locations;
CREATE POLICY "Admins and moderators can verify company locations"
ON public.company_locations
FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));

DROP POLICY IF EXISTS "Admins and moderators can verify tower companies" ON public.tower_companies;
CREATE POLICY "Admins and moderators can verify tower companies"
ON public.tower_companies
FOR UPDATE
USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'moderator'::public.app_role));