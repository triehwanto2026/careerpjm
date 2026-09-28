ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS position_snapshot text,
  ADD COLUMN IF NOT EXISTS department_snapshot text,
  ADD COLUMN IF NOT EXISTS location_snapshot text,
  ADD COLUMN IF NOT EXISTS vacancy_status_snapshot text;
