-- Enums
CREATE TYPE public.user_role AS ENUM ('job_seeker', 'employer');
CREATE TYPE public.education_level AS ENUM ('ثانوية', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه');
CREATE TYPE public.experience_range AS ENUM ('أقل من سنة', '1-3 سنوات', '3-5 سنوات', '5-10 سنوات', 'أكثر من 10 سنوات');
CREATE TYPE public.job_status AS ENUM ('active', 'closed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'job_seeker',
  education public.education_level,
  field TEXT,
  experience_years public.experience_range,
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  cv_url TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL,
  required_education public.education_level,
  required_field TEXT,
  required_experience public.experience_range,
  required_skills TEXT[] DEFAULT '{}',
  required_languages TEXT[] DEFAULT '{}',
  status public.job_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active jobs viewable by everyone"
  ON public.jobs FOR SELECT USING (status = 'active' OR auth.uid() = employer_id);

CREATE POLICY "Employers can insert jobs"
  ON public.jobs FOR INSERT WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own jobs"
  ON public.jobs FOR UPDATE USING (auth.uid() = employer_id);

CREATE POLICY "Employers can delete own jobs"
  ON public.jobs FOR DELETE USING (auth.uid() = employer_id);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications"
  ON public.applications FOR SELECT USING (auth.uid() = applicant_id);

CREATE POLICY "Employers can view applications for own jobs"
  ON public.applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
  );

CREATE POLICY "Job seekers can apply"
  ON public.applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- Match score function
CREATE OR REPLACE FUNCTION public.calculate_match_score(p_job_id UUID, p_applicant_id UUID)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_applicant public.profiles%ROWTYPE;
  v_score DOUBLE PRECISION := 0;
  v_skill_match INT := 0;
  v_total_skills INT := 0;
  v_lang_match BOOLEAN := false;
  s TEXT;
  l TEXT;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
  SELECT * INTO v_applicant FROM public.profiles WHERE id = p_applicant_id;

  IF v_job.required_education IS NOT NULL AND v_job.required_education = v_applicant.education THEN
    v_score := v_score + 30;
  END IF;

  IF v_job.required_field IS NOT NULL AND lower(v_job.required_field) = lower(coalesce(v_applicant.field,'')) THEN
    v_score := v_score + 25;
  END IF;

  IF v_job.required_experience IS NOT NULL AND v_job.required_experience = v_applicant.experience_years THEN
    v_score := v_score + 20;
  END IF;

  v_total_skills := coalesce(array_length(v_job.required_skills, 1), 0);
  IF v_total_skills > 0 THEN
    FOREACH s IN ARRAY v_job.required_skills LOOP
      IF s = ANY(coalesce(v_applicant.skills, '{}')) THEN
        v_skill_match := v_skill_match + 1;
      END IF;
    END LOOP;
    v_score := v_score + (v_skill_match::DOUBLE PRECISION / v_total_skills * 15);
  END IF;

  IF v_job.required_languages IS NOT NULL AND array_length(v_job.required_languages, 1) > 0 THEN
    FOREACH l IN ARRAY v_job.required_languages LOOP
      IF l = ANY(coalesce(v_applicant.languages, '{}')) THEN
        v_lang_match := true;
        EXIT;
      END IF;
    END LOOP;
    IF v_lang_match THEN
      v_score := v_score + 10;
    END IF;
  END IF;

  RETURN v_score;
END;
$$;

-- Trigger to set match score on application insert
CREATE OR REPLACE FUNCTION public.set_application_match_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.match_score := public.calculate_match_score(NEW.job_id, NEW.applicant_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_set_match_score
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_application_match_score();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'job_seeker')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for CVs
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', true);

CREATE POLICY "CVs are publicly viewable"
  ON storage.objects FOR SELECT USING (bucket_id = 'cvs');

CREATE POLICY "Users can upload own CV"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own CV"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own CV"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);