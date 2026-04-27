-- Add admin role support without changing existing profile roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
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

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Public company logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Company logos are publicly viewable" ON storage.objects;
CREATE POLICY "Company logos are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Employers can upload company logos" ON storage.objects;
CREATE POLICY "Employers can upload company logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Employers can update own company logos" ON storage.objects;
CREATE POLICY "Employers can update own company logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Employers can delete own company logos" ON storage.objects;
CREATE POLICY "Employers can delete own company logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add logos to standalone company locations
ALTER TABLE public.company_locations
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Companies inside commercial towers
CREATE TABLE IF NOT EXISTS public.tower_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tower_id UUID NOT NULL REFERENCES public.commercial_towers(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  recruitment_email TEXT,
  recruitment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (tower_id, employer_id, company_name)
);

ALTER TABLE public.tower_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tower companies viewable by everyone" ON public.tower_companies;
CREATE POLICY "Tower companies viewable by everyone"
ON public.tower_companies
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Employers can insert own tower companies" ON public.tower_companies;
CREATE POLICY "Employers can insert own tower companies"
ON public.tower_companies
FOR INSERT
WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employers can update own tower companies" ON public.tower_companies;
CREATE POLICY "Employers can update own tower companies"
ON public.tower_companies
FOR UPDATE
USING (auth.uid() = employer_id)
WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employers can delete own tower companies" ON public.tower_companies;
CREATE POLICY "Employers can delete own tower companies"
ON public.tower_companies
FOR DELETE
USING (auth.uid() = employer_id);

DROP TRIGGER IF EXISTS update_tower_companies_updated_at ON public.tower_companies;
CREATE TRIGGER update_tower_companies_updated_at
BEFORE UPDATE ON public.tower_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_tower_companies_tower_id ON public.tower_companies(tower_id);
CREATE INDEX IF NOT EXISTS idx_tower_companies_employer_id ON public.tower_companies(employer_id);
CREATE INDEX IF NOT EXISTS idx_tower_companies_name ON public.tower_companies(company_name);

-- Restrict tower management to admins only
DROP POLICY IF EXISTS "Employers can insert own commercial towers" ON public.commercial_towers;
DROP POLICY IF EXISTS "Employers can update own commercial towers" ON public.commercial_towers;
DROP POLICY IF EXISTS "Employers can delete own commercial towers" ON public.commercial_towers;
DROP POLICY IF EXISTS "Admins can insert commercial towers" ON public.commercial_towers;
DROP POLICY IF EXISTS "Admins can update commercial towers" ON public.commercial_towers;
DROP POLICY IF EXISTS "Admins can delete commercial towers" ON public.commercial_towers;

CREATE POLICY "Admins can insert commercial towers"
ON public.commercial_towers
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update commercial towers"
ON public.commercial_towers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete commercial towers"
ON public.commercial_towers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Move old text-only tower company names into structured tower_companies rows owned by the tower creator
INSERT INTO public.tower_companies (tower_id, employer_id, company_name)
SELECT t.id, t.employer_id, company_name
FROM public.commercial_towers t
CROSS JOIN LATERAL unnest(COALESCE(t.companies, '{}'::TEXT[])) AS company_name
WHERE trim(company_name) <> ''
ON CONFLICT (tower_id, employer_id, company_name) DO NOTHING;