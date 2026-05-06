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

async function addProfilePermission() {
  console.log('Adding /admin/profile permission to all admin roles...');

  const { data: roles, error: fetchError } = await supabase
    .from('admin_roles')
    .select('*');

  if (fetchError) {
    console.error('Error fetching roles:', fetchError);
    return;
  }

  let updated = 0;
  for (const role of roles || []) {
    const permissions = Array.isArray(role.permissions) ? role.permissions : [];
    
    if (!permissions.includes('/admin/profile')) {
      const newPermissions = [...permissions, '/admin/profile'];
      
      const { error: updateError } = await supabase
        .from('admin_roles')
        .update({ permissions: newPermissions })
        .eq('id', role.id);

      if (updateError) {
        console.error(`Error updating role ${role.name}:`, updateError);
      } else {
        console.log(`✓ Added /admin/profile to role: ${role.name}`);
        updated++;
      }
    } else {
      console.log(`- Role ${role.name} already has /admin/profile permission`);
    }
  }

  console.log(`\nDone! ${updated} roles updated.`);
}

addProfilePermission().catch(err => {
  console.error('Error:', err);
});
