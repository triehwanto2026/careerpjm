#!/usr/bin/env node
// check_candidate_screenshots.js
// Usage:
// SUPABASE_URL=... SERVICE_ROLE_KEY=... node scripts/check_candidate_screenshots.js --email=an.triehwanto@gmail.com

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

const email = argv.email;
if (!email) {
  console.error('Usage: --email=example@example.com');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  try {
    const { data, error } = await supabase.from('test_results').select('id, test_name, score, total_questions, answered_questions, categories, webcam_photo_url, candidate_profile').eq('candidate_profile->>email', email);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('No results found for', email);
      process.exit(0);
    }
    for (const row of data) {
      console.log('---');
      console.log('id:', row.id);
      console.log('test_name:', row.test_name);
      console.log('score:', row.score, 'answered:', row.answered_questions, 'total:', row.total_questions);
      console.log('webcam_photo_url:', row.webcam_photo_url);
      if (row.webcam_photo_url) {
        try {
          const res = await fetch(row.webcam_photo_url, { method: 'HEAD' });
          console.log('image HEAD status:', res.status);
          if (res.status === 200) console.log('image appears accessible');
          else console.log('image not accessible (status != 200)');
        } catch (e) {
          console.error('failed to fetch image URL:', e.message || e);
        }
      } else {
        console.log('No webcam_photo_url stored for this row.');
      }
      console.log('categories keys:', Object.keys(row.categories || {}));
      console.log('categories sample:', JSON.stringify(row.categories || {}, null, 2));
    }
    process.exit(0);
  } catch (e) {
    console.error('error', e instanceof Error ? e.message : e);
    process.exit(2);
  }
})();
