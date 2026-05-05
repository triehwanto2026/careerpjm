-- Add admin panel branding settings
INSERT INTO public.app_settings (key, value, value_type, category, description, is_public) VALUES
  ('admin_panel_name', 'PsyAdmin', 'text', 'branding', 'Nama panel admin', false),
  ('admin_logo_url', '', 'image_url', 'branding', 'URL logo panel admin', false)
ON CONFLICT (key) DO NOTHING;
