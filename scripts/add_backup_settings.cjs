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

async function addBackupSettings() {
  console.log('Adding backup settings...');

  const settings = [
    {
      key: 'auto_backup_enabled',
      value: 'false',
      value_type: 'boolean',
      category: 'system',
      description: 'Aktifkan backup otomatis',
      is_public: false,
    },
    {
      key: 'auto_backup_period',
      value: 'daily',
      value_type: 'text',
      category: 'system',
      description: 'Periode backup otomatis (daily, weekly, monthly)',
      is_public: false,
    },
    {
      key: 'auto_backup_format',
      value: 'json',
      value_type: 'text',
      category: 'system',
      description: 'Format backup otomatis (sql, json)',
      is_public: false,
    },
    {
      key: 'backup_retention_days',
      value: '30',
      value_type: 'number',
      category: 'system',
      description: 'Hari penyimpanan backup sebelum dihapus otomatis',
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

  console.log('\nDone! Backup settings added to database.');
}

addBackupSettings().catch(err => {
  console.error('Error:', err);
});
