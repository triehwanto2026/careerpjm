-- Add landing page settings for admin-managed front page content
INSERT INTO public.app_settings (key, value, value_type, category, description, is_public) VALUES
  ('landing_header_title', 'PJM Recruitment', 'text', 'branding', 'Judul utama halaman depan', true),
  ('landing_header_subtitle', 'Platform rekrutmen resmi PJM Group. Temukan karir impian Anda bersama kami.', 'text', 'branding', 'Subjudul halaman depan', true),
  ('landing_hero_background_url', '', 'image_url', 'branding', 'URL gambar background hero halaman depan', true),
  ('landing_contact_email', 'hr@pjmgroup.com', 'text', 'branding', 'Email kontak publik untuk halaman depan', true),
  ('landing_contact_phone', '+62 21 1234 5678', 'text', 'branding', 'Nomor telepon kontak publik untuk halaman depan', true),
  ('landing_contact_address', 'Jakarta, Indonesia', 'text', 'branding', 'Alamat kontak publik untuk halaman depan', true),
  ('landing_about_vision', 'Visi kami adalah menjadi mitra rekrutmen terpercaya yang menghubungkan talenta terbaik dengan peluang karir berkualitas.', 'text', 'branding', 'Visi halaman depan', true),
  ('landing_about_mission', 'Misi kami adalah membantu para profesional dan organisasi mencapai tujuan mereka melalui pengalaman rekrutmen yang modern, adil, dan transparan.', 'text', 'branding', 'Misi halaman depan', true),
  ('landing_about_milestones', '2018 - Berdiri sebagai platform rekrutmen inovatif.\n2022 - Melayani lebih dari 1.000 kandidat.\n2024 - Menjadi pilihan utama perusahaan dan talenta di Indonesia.', 'text', 'branding', 'Milestone atau perjalanan perusahaan', true),
  ('landing_about_milestones_items', '[{"year": "2018", "description": "Berdiri sebagai platform rekrutmen inovatif."}, {"year": "2022", "description": "Melayani lebih dari 1.000 kandidat."}, {"year": "2024", "description": "Menjadi pilihan utama perusahaan dan talenta di Indonesia."}]', 'json', 'branding', 'Daftar milestone halaman depan', true),
  ('landing_about_values', 'Integritas, Profesionalisme, Kepedulian, Transparansi, Kolaborasi.', 'text', 'branding', 'Nilai nilai perusahaan', true),
  ('landing_about_values_items', '[{"name": "Integritas", "description": "Berpegang pada standar etis yang tinggi.", "icon": "⚖️"}, {"name": "Profesionalisme", "description": "Memberikan layanan dengan kompetensi dan tanggung jawab.", "icon": "💼"}, {"name": "Kolaborasi", "description": "Bekerja bersama untuk hasil terbaik.", "icon": "🤝"}]', 'json', 'branding', 'Daftar nilai nilai halaman depan', true)
ON CONFLICT (key) DO NOTHING;
