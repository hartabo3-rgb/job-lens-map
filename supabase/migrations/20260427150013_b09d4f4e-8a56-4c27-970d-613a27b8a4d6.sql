CREATE OR REPLACE FUNCTION public.validate_application_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_max_applicants INTEGER;
  v_current_count INTEGER;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT max_applicants, expires_at INTO v_max_applicants, v_expires_at
  FROM public.jobs
  WHERE id = NEW.job_id;

  IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
    RAISE EXCEPTION 'انتهت مدة التقديم على هذه الوظيفة';
  END IF;

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

CREATE OR REPLACE FUNCTION public.close_job_when_capacity_reached()
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
      UPDATE public.jobs
      SET status = 'closed'
      WHERE id = NEW.job_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS close_job_when_capacity_reached_trigger ON public.applications;
CREATE TRIGGER close_job_when_capacity_reached_trigger
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.close_job_when_capacity_reached();