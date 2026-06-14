ALTER TABLE public.job_vacancies
  ADD COLUMN IF NOT EXISTS show_salary BOOLEAN NOT NULL DEFAULT true;

INSERT INTO public.app_settings (key, value, value_type, category, description, is_public) VALUES
  ('job_departments', '["Engineering","Design","Marketing","Human Resources","Data","Operations","Finance"]', 'json', 'system', 'Daftar departemen untuk lowongan', false),
  ('job_employment_types', '["Full-time","Part-time","Contract","Internship"]', 'json', 'system', 'Daftar tipe pekerjaan untuk lowongan', false)
ON CONFLICT (key) DO NOTHING;
