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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function checkAndFixRecruitmentUser() {
  try {
    const password = '123456';
    const passwordHash = await hashPassword(password);
    const username = 'recruitment';

    console.log('Password hash for "123456":', passwordHash);

    // Cek apakah user recruitment sudah ada
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError);
      return;
    }

    if (existingUser) {
      console.log('User recruitment found:');
      console.log('- Username:', existingUser.username);
      console.log('- Full Name:', existingUser.full_name);
      console.log('- Is Active:', existingUser.is_active);
      console.log('- Role ID:', existingUser.role_id);
      console.log('- Password Hash in DB:', existingUser.password_hash);
      console.log('- Expected hash:', passwordHash);
      console.log('- Match:', existingUser.password_hash === passwordHash);

      // Update password hash jika tidak cocok
      if (existingUser.password_hash !== passwordHash) {
        console.log('\nUpdating password hash...');
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ password_hash: passwordHash })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('Error updating password:', updateError);
        } else {
          console.log('Password updated successfully!');
        }
      } else {
        console.log('\nPassword already correct.');
      }
    } else {
      console.log('User recruitment not found. Creating user...');

      // Cek apakah role "Recruitment" ada
      const { data: role, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('name', 'Recruitment')
        .single();

      if (roleError || !role) {
        console.error('Role "Recruitment" not found. Please create it first.');
        return;
      }

      console.log('Found role:', role.name, 'ID:', role.id);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          username,
          full_name: 'Recruitment Admin',
          password_hash: passwordHash,
          role_id: role.id,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
      } else {
        console.log('User created successfully!');
        console.log('- Username:', newUser.username);
        console.log('- Full Name:', newUser.full_name);
        console.log('- Role ID:', newUser.role_id);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndFixRecruitmentUser();
