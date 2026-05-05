const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function addAdminBrandingSettings() {
  console.log('Adding admin panel branding settings...');

  const settings = [
    {
      key: 'admin_panel_name',
      value: 'PsyAdmin',
      value_type: 'text',
      category: 'branding',
      description: 'Nama panel admin',
      is_public: false,
    },
    {
      key: 'admin_logo_url',
      value: '',
      value_type: 'image_url',
      category: 'branding',
      description: 'URL logo panel admin',
      is_public: false,
    },
  ];

  for (const setting of settings) {
    const { error } = await supabase
      .from('app_settings')
      .insert(setting);

    if (error) {
      if (error.code === '23505') {
        console.log(`Setting "${setting.key}" already exists, skipping...`);
      } else {
        console.error(`Error inserting "${setting.key}":`, error);
      }
    } else {
      console.log(`✓ Added setting: ${setting.key}`);
    }
  }

  console.log('\nDone! You can now configure admin panel name and logo in Settings > Branding.');
}

addAdminBrandingSettings().catch(err => {
  console.error('Error:', err);
});
