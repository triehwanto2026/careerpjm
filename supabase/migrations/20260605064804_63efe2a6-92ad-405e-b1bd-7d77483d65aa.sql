
-- Fix admin role checks on job_applications and job_vacancies to use is_any_admin()
DROP POLICY IF EXISTS "Admin users can manage applications" ON public.job_applications;
CREATE POLICY "Admin users can manage applications" ON public.job_applications
  FOR ALL TO authenticated
  USING (public.is_any_admin(auth.uid()))
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete jobs" ON public.job_vacancies;
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.job_vacancies;
DROP POLICY IF EXISTS "Admins can update jobs" ON public.job_vacancies;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.job_vacancies;

CREATE POLICY "Admins can view all jobs" ON public.job_vacancies
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
CREATE POLICY "Admins can insert jobs" ON public.job_vacancies
  FOR INSERT TO authenticated WITH CHECK (public.is_any_admin(auth.uid()));
CREATE POLICY "Admins can update jobs" ON public.job_vacancies
  FOR UPDATE TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));
CREATE POLICY "Admins can delete jobs" ON public.job_vacancies
  FOR DELETE TO authenticated USING (public.is_any_admin(auth.uid()));

-- Lock down settings-images bucket: only admins may write
DROP POLICY IF EXISTS "Allow anon upload to settings-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update settings-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete settings-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to settings-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update settings-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete settings-images" ON storage.objects;

CREATE POLICY "Admins can upload settings-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'settings-images' AND public.is_any_admin(auth.uid()));
CREATE POLICY "Admins can update settings-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'settings-images' AND public.is_any_admin(auth.uid()))
  WITH CHECK (bucket_id = 'settings-images' AND public.is_any_admin(auth.uid()));
CREATE POLICY "Admins can delete settings-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'settings-images' AND public.is_any_admin(auth.uid()));
