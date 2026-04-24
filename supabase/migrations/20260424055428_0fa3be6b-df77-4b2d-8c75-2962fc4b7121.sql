-- 1) Add is_government flag to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_government BOOLEAN NOT NULL DEFAULT false;

-- 2) Create company_locations table (multiple branches per employer)
CREATE TABLE IF NOT EXISTS public.company_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  recruitment_email TEXT,
  recruitment_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_locations ENABLE ROW LEVEL SECURITY;

-- Public can view all company locations (so seekers see them on the map)
CREATE POLICY "Company locations viewable by everyone"
ON public.company_locations
FOR SELECT
USING (true);

-- Employers manage their own
CREATE POLICY "Employers can insert own company locations"
ON public.company_locations
FOR INSERT
WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own company locations"
ON public.company_locations
FOR UPDATE
USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete own company locations"
ON public.company_locations
FOR DELETE
USING (auth.uid() = employer_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_company_locations_updated_at ON public.company_locations;
CREATE TRIGGER update_company_locations_updated_at
BEFORE UPDATE ON public.company_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_company_locations_employer ON public.company_locations(employer_id);