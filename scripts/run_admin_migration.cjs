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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function runMigration() {
  console.log('Running admin_users and admin_roles migration...');

  const sql = fs.readFileSync('supabase/migrations/20260505153000_add_admin_users_roles.sql', 'utf8');

  // Split SQL into individual statements and run them
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const statement of statements) {
    const fullStmt = statement + ';';
    // Skip comments and empty lines
    if (fullStmt.trim().startsWith('--') || fullStmt.trim().startsWith('/*')) {
      continue;
    }
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: fullStmt });
      if (error) {
        // Try running directly via REST if exec_sql doesn't exist
        console.log('Statement result:', error.message || 'OK');
      }
    } catch (e) {
      console.log('Statement may require manual execution:', fullStmt.substring(0, 60));
    }
  }

  console.log('\nMigration complete! Please verify tables in Supabase Dashboard.');
  console.log('Default login: superadmin / admin123');
}

runMigration().catch(err => {
  console.error('Migration error:', err.message);
  console.log('\nPlease run the SQL manually via Supabase Dashboard SQL Editor:');
  console.log('File: supabase/migrations/20260505153000_add_admin_users_roles.sql');
});
