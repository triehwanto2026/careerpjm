#!/usr/bin/env node
// list_candidate_photos.js
// Usage:
// SUPABASE_URL=... SERVICE_ROLE_KEY=... node scripts/list_candidate_photos.js --prefix=snap-an.triehwanto

import { createClient } from '@supabase/supabase-js';

const argv = Object.fromEntries(process.argv.slice(2).map((a) => a.split(/=(.+)/))).reduce((acc, [k, v]) => {
  if (!k) return acc;
  acc[k.replace(/^--/, '')] = v === undefined ? true : v;
  return acc;
}, {});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}
const prefix = argv.prefix || '';
if (!prefix) {
  console.error('Usage: --prefix=<file-prefix>');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  try {
    const { data, error } = await supabase.storage.from('candidate-photos').list('', { limit: 1000 });
    if (error) throw error;
    const matched = (data || []).filter((f) => f.name.startsWith(prefix));
    if (matched.length === 0) {
      console.log('No files with prefix', prefix);
      process.exit(0);
    }
    console.log(`Found ${matched.length} files:`);
    for (const f of matched) console.log(f.name, f.size, f.updated_at);
    process.exit(0);
  } catch (e) {
    console.error('error', e instanceof Error ? e.message : e);
    process.exit(2);
  }
})();
