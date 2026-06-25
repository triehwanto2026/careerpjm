const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

// Tables to backup (exclude system tables)
const TABLES_TO_BACKUP = [
  'admin_roles',
  'admin_users',
  'app_settings',
  'activation_codes',
  'candidates',
  'candidate_profiles',
  'candidate_documents',
  'candidate_family_members',
  'candidate_education_history',
  'candidate_informal_education',
  'candidate_work_experience',
  'candidate_skills',
  'candidate_languages',
  'candidate_auth',
  'candidate_otps',
  'job_vacancies',
  'job_applications',
  'test_instruments',
  'test_questions',
  'test_question_options',
  'test_answer_keys',
  'test_interpretations',
  'test_sessions',
  'test_results',
  'test_answers',
  'notifications',
  'notification_templates',
  'activity_logs',
];

async function exportTableToJson(tableName) {
  const { count, error: countError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error(`Error counting ${tableName}:`, countError);
    return null;
  }

  const allData = [];
  const batchSize = 1000;
  let offset = 0;

  while (offset < count) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      console.error(`Error exporting ${tableName} (offset ${offset}):`, error);
      return null;
    }
    
    allData.push(...data);
    offset += batchSize;
    console.log(`  Fetched ${allData.length}/${count} rows from ${tableName}...`);
  }

  return allData;
}

function generateInsertSQL(tableName, data) {
  if (!data || data.length === 0) return `-- No data in ${tableName}\n\n`;

  let sql = `-- Data for ${tableName}\n`;
  data.forEach(row => {
    const columns = Object.keys(row);
    const values = columns.map(col => {
      const val = row[col];
      if (val === null) return 'NULL';
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      if (typeof val === 'number') return val;
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
  });
  sql += '\n';
  return sql;
}

async function backupDatabase(format = 'json') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting backup in ${format.toUpperCase()} format...`);
  const backupData = {};

  for (const table of TABLES_TO_BACKUP) {
    console.log(`Exporting ${table}...`);
    const data = await exportTableToJson(table);
    if (data !== null) {
      backupData[table] = data;
    }
  }

  if (format === 'json') {
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    console.log(`✓ JSON backup saved: ${filepath}`);
    return filepath;
  } else if (format === 'sql') {
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    let sql = `-- Database Backup\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Format: SQL INSERT statements\n\n`;
    
    for (const table of TABLES_TO_BACKUP) {
      if (backupData[table]) {
        sql += generateInsertSQL(table, backupData[table]);
      }
    }
    
    fs.writeFileSync(filepath, sql);
    console.log(`✓ SQL backup saved: ${filepath}`);
    return filepath;
  }
}

// Command line usage
const format = process.argv[2] || 'json';
if (!['json', 'sql'].includes(format)) {
  console.error('Invalid format. Use: json or sql');
  process.exit(1);
}

backupDatabase(format)
  .then(filepath => {
    console.log('\nBackup completed successfully!');
    console.log(`File: ${filepath}`);
  })
  .catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
  });
