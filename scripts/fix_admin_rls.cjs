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

async function fixRLS() {
  console.log('Fixing RLS policies for admin_roles and admin_users...');

  const statements = [
    // Drop existing anon policies if they exist (ignore errors)
    `DROP POLICY IF EXISTS "Allow anon to insert admin_roles" ON public.admin_roles;`,
    `DROP POLICY IF EXISTS "Allow anon to update admin_roles" ON public.admin_roles;`,
    `DROP POLICY IF EXISTS "Allow anon to delete admin_roles" ON public.admin_roles;`,
    `DROP POLICY IF EXISTS "Allow anon to insert admin_users" ON public.admin_users;`,
    `DROP POLICY IF EXISTS "Allow anon to update admin_users" ON public.admin_users;`,
    `DROP POLICY IF EXISTS "Allow anon to delete admin_users" ON public.admin_users;`,

    // Create new anon policies
    `CREATE POLICY "Allow anon to insert admin_roles" ON public.admin_roles FOR INSERT TO anon WITH CHECK (true);`,
    `CREATE POLICY "Allow anon to update admin_roles" ON public.admin_roles FOR UPDATE TO anon USING (true) WITH CHECK (true);`,
    `CREATE POLICY "Allow anon to delete admin_roles" ON public.admin_roles FOR DELETE TO anon USING (true);`,
    `CREATE POLICY "Allow anon to insert admin_users" ON public.admin_users FOR INSERT TO anon WITH CHECK (true);`,
    `CREATE POLICY "Allow anon to update admin_users" ON public.admin_users FOR UPDATE TO anon USING (true) WITH CHECK (true);`,
    `CREATE POLICY "Allow anon to delete admin_users" ON public.admin_users FOR DELETE TO anon USING (true);`,
  ];

  for (const sql of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        // Try alternative: run as raw query
        console.log(`  Note: ${error.message}`);
      } else {
        console.log(`  OK: ${sql.substring(0, 60)}...`);
      }
    } catch (e) {
      console.log(`  Skipped (may already exist): ${sql.substring(0, 50)}...`);
    }
  }

  console.log('\nDone! Please run the following SQL manually in Supabase SQL Editor if above failed:');
  console.log(`
-- Fix RLS for admin_roles
DROP POLICY IF EXISTS "Allow anon to insert admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow anon to update admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow anon to delete admin_roles" ON public.admin_roles;
CREATE POLICY "Allow anon to insert admin_roles" ON public.admin_roles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update admin_roles" ON public.admin_roles FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to delete admin_roles" ON public.admin_roles FOR DELETE TO anon USING (true);

-- Fix RLS for admin_users
DROP POLICY IF EXISTS "Allow anon to insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon to update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow anon to delete admin_users" ON public.admin_users;
CREATE POLICY "Allow anon to insert admin_users" ON public.admin_users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon to update admin_users" ON public.admin_users FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to delete admin_users" ON public.admin_users FOR DELETE TO anon USING (true);
  `);
}

fixRLS();
