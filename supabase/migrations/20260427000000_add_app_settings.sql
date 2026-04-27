-- App settings table for application configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  value_type TEXT NOT NULL DEFAULT 'text' CHECK (value_type IN ('text', 'number', 'boolean', 'json', 'image_url')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'branding', 'login', 'email', 'system')),
  description TEXT NOT NULL DEFAULT '',
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access on app_settings" ON public.app_settings;
CREATE POLICY "Allow authenticated full access on app_settings"
  ON public.app_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to read public app_settings" ON public.app_settings;
CREATE POLICY "Allow anon to read public app_settings"
  ON public.app_settings FOR SELECT TO anon USING (is_public = true);

-- Storage bucket for settings images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('settings-images', 'settings-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for settings-images bucket
DROP POLICY IF EXISTS "Allow authenticated upload to settings-images" ON storage.objects;
CREATE POLICY "Allow authenticated upload to settings-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'settings-images');

DROP POLICY IF EXISTS "Allow authenticated read settings-images" ON storage.objects;
CREATE POLICY "Allow authenticated read settings-images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'settings-images');

DROP POLICY IF EXISTS "Allow authenticated update settings-images" ON storage.objects;
CREATE POLICY "Allow authenticated update settings-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'settings-images');

DROP POLICY IF EXISTS "Allow authenticated delete settings-images" ON storage.objects;
CREATE POLICY "Allow authenticated delete settings-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'settings-images');

DROP POLICY IF EXISTS "Allow public read settings-images" ON storage.objects;
CREATE POLICY "Allow public read settings-images"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'settings-images');

-- Insert default settings
INSERT INTO public.app_settings (key, value, value_type, category, description, is_public) VALUES
  -- Branding Settings
  ('app_name', 'PsyTest Recruitment Platform', 'text', 'branding', 'Nama aplikasi', true),
  ('app_name_en', 'PsyTest Recruitment Platform', 'text', 'branding', 'Application name (English)', true),
  ('app_logo_url', '', 'image_url', 'branding', 'URL logo aplikasi', true),
  ('app_favicon_url', '', 'image_url', 'branding', 'URL favicon aplikasi', true),
  ('primary_color', '#0f766e', 'text', 'branding', 'Warna utama aplikasi (hex)', true),
  ('header_title', 'Sistem Seleksi Psikologi', 'text', 'branding', 'Judul header', true),
  ('header_subtitle', 'Platform Tes Psikologi Online Terintegrasi', 'text', 'branding', 'Subjudul header', true),
  
  -- Footer Settings
  ('footer_company_name', 'PsyTest Indonesia', 'text', 'branding', 'Nama perusahaan di footer', true),
  ('footer_address', 'Jl. Contoh No. 123, Jakarta', 'text', 'branding', 'Alamat di footer', true),
  ('footer_email', 'info@psytest.id', 'text', 'branding', 'Email di footer', true),
  ('footer_phone', '+62 21 1234 5678', 'text', 'branding', 'Telepon di footer', true),
  ('footer_copyright', '© 2024 PsyTest Indonesia. All rights reserved.', 'text', 'branding', 'Teks copyright footer', true),
  ('footer_social_links', '{}', 'json', 'branding', 'Link sosial media (JSON)', true),
  
  -- Login Page Settings
  ('login_page_title', 'Selamat Datang', 'text', 'login', 'Judul halaman login', true),
  ('login_page_subtitle', 'Silakan masukkan kode aktivasi untuk memulai tes', 'text', 'login', 'Subjudul halaman login', true),
  ('login_page_instruction', 'Masukkan kode aktivasi dan password yang telah diberikan oleh HR.', 'text', 'login', 'Instruksi halaman login', true),
  ('login_page_background_url', '', 'image_url', 'login', 'URL background halaman login', true),
  ('login_button_text', 'Masuk', 'text', 'login', 'Teks tombol login', true),
  ('show_candidate_photo', 'true', 'boolean', 'login', 'Tampilkan foto kandidat saat login', true),
  
  -- System Settings
  ('session_timeout_minutes', '120', 'number', 'system', 'Timeout sesi dalam menit', false),
  ('max_test_attempts', '1', 'number', 'system', 'Maksimal percobaan tes', false),
  ('enable_webcam', 'true', 'boolean', 'system', 'Aktifkan fitur webcam', false),
  ('auto_save_interval_seconds', '30', 'number', 'system', 'Interval auto-save (detik)', false),
  ('maintenance_mode', 'false', 'boolean', 'system', 'Mode maintenance', false),
  ('maintenance_message', 'Sistem sedang dalam maintenance. Silakan coba lagi nanti.', 'text', 'system', 'Pesan maintenance', true),
  
  -- Email Settings
  ('email_from_name', 'PsyTest Recruitment', 'text', 'email', 'Nama pengirim email', false),
  ('email_from_address', 'noreply@psytest.id', 'text', 'email', 'Alamat email pengirim', false),
  ('email_smtp_host', '', 'text', 'email', 'SMTP host', false),
  ('email_smtp_port', '587', 'text', 'email', 'SMTP port', false),
  ('email_smtp_user', '', 'text', 'email', 'SMTP username', false),
  ('email_smtp_password', '', 'text', 'email', 'SMTP password', false),
  ('email_template_welcome', '', 'text', 'email', 'Template email selamat datang', false),
  ('email_template_result', '', 'text', 'email', 'Template email hasil tes', false)
ON CONFLICT (key) DO NOTHING;
