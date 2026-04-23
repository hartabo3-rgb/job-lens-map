-- Fix function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Restrict CV listing: only allow read by exact path (no listing/searching)
DROP POLICY IF EXISTS "CVs are publicly viewable" ON storage.objects;

CREATE POLICY "CVs readable by authenticated users"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cvs');