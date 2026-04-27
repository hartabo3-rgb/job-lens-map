ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS application_url TEXT,
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS max_applicants INTEGER,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

CREATE OR REPLACE FUNCTION public.set_job_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.duration_hours IS NULL THEN
    NEW.expires_at := NULL;
  ELSIF TG_OP = 'INSERT' OR NEW.duration_hours IS DISTINCT FROM OLD.duration_hours OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    NEW.expires_at := NEW.created_at + make_interval(hours => NEW.duration_hours);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_job_expires_at_trigger ON public.jobs;
CREATE TRIGGER set_job_expires_at_trigger
BEFORE INSERT OR UPDATE OF duration_hours, created_at ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_job_expires_at();

CREATE OR REPLACE FUNCTION public.validate_application_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_max_applicants INTEGER;
  v_current_count INTEGER;
BEGIN
  SELECT max_applicants INTO v_max_applicants
  FROM public.jobs
  WHERE id = NEW.job_id;

  IF v_max_applicants IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_count
    FROM public.applications
    WHERE job_id = NEW.job_id;

    IF v_current_count >= v_max_applicants THEN
      RAISE EXCEPTION 'تم اكتمال عدد المتقدمين لهذه الوظيفة';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS validate_application_capacity_trigger ON public.applications;
CREATE TRIGGER validate_application_capacity_trigger
BEFORE INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.validate_application_capacity();

CREATE TABLE IF NOT EXISTS public.commercial_towers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL,
  tower_name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  companies TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commercial_towers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Commercial towers viewable by everyone" ON public.commercial_towers;
CREATE POLICY "Commercial towers viewable by everyone"
ON public.commercial_towers
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Employers can insert own commercial towers" ON public.commercial_towers;
CREATE POLICY "Employers can insert own commercial towers"
ON public.commercial_towers
FOR INSERT
WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employers can update own commercial towers" ON public.commercial_towers;
CREATE POLICY "Employers can update own commercial towers"
ON public.commercial_towers
FOR UPDATE
USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Employers can delete own commercial towers" ON public.commercial_towers;
CREATE POLICY "Employers can delete own commercial towers"
ON public.commercial_towers
FOR DELETE
USING (auth.uid() = employer_id);

DROP TRIGGER IF EXISTS update_commercial_towers_updated_at ON public.commercial_towers;
CREATE TRIGGER update_commercial_towers_updated_at
BEFORE UPDATE ON public.commercial_towers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_commercial_towers_location ON public.commercial_towers (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_commercial_towers_employer_id ON public.commercial_towers (employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON public.jobs (expires_at);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications (job_id);