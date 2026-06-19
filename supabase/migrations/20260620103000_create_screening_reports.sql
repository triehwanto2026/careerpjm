CREATE TABLE IF NOT EXISTS public.screening_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL UNIQUE,
  vacancy_id UUID NULL REFERENCES public.job_vacancies(id) ON DELETE SET NULL,
  candidate_user_id UUID NULL,
  candidate_email TEXT NULL,
  candidate_name TEXT NULL,
  draft JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screening_reports_candidate_email ON public.screening_reports(candidate_email);
CREATE INDEX IF NOT EXISTS idx_screening_reports_vacancy_id ON public.screening_reports(vacancy_id);

ALTER TABLE public.screening_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage screening reports" ON public.screening_reports;
CREATE POLICY "Authenticated users can manage screening reports"
ON public.screening_reports
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Anon admin can manage screening reports" ON public.screening_reports;
CREATE POLICY "Anon admin can manage screening reports"
ON public.screening_reports
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_screening_reports_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_screening_reports_updated_at ON public.screening_reports;
CREATE TRIGGER set_screening_reports_updated_at
BEFORE UPDATE ON public.screening_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_screening_reports_updated_at();
