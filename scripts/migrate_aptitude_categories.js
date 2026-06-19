#!/usr/bin/env node
// migrate_aptitude_categories.js
// Usage:
// SUPABASE_URL=... SERVICE_ROLE_KEY=... node scripts/migrate_aptitude_categories.js [--email=an.triehwanto@gmail.com] [--dry]

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

const emailFilter = argv.email || null;
const dryRun = argv.dry !== undefined;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const CANONICAL = ['Verbal', 'Numerical', 'Logic', 'Classification', 'Pattern', 'Abstract'];
const ALIASES = {
  Verbal: ['verbal ability', 'verbal aptitude', 'verbal_ability', 'kemampuan verbal', 'verbal'],
  Numerical: ['numerical ability', 'numerical aptitude', 'numerical_ability', 'numerik', 'kemampuan numerik', 'numerical'],
  Logic: ['logical reasoning', 'logic', 'logical_reasoning', 'reasoning logic', 'kemampuan logika', 'logic'],
  Classification: ['classifications', 'classification', 'klasifikasi', 'classification ability', 'classification'],
  Pattern: ['pattern recognition', 'pattern', 'pola', 'pattern_recognition', 'pattern'],
  Abstract: ['abstract reasoning', 'figural', 'abstract', 'figural/abstrak', 'kemampuan abstrak', 'abstract'],
};

const normalize = (s) => String(s || '').trim().toLowerCase().replace(/[_\s\/\-]+/g, ' ');
const resolve = (k) => {
  const n = normalize(k);
  if (!n) return null;
  for (const c of CANONICAL) if (normalize(c) === n) return c;
  for (const [canon, aliases] of Object.entries(ALIASES)) if (aliases.map(normalize).includes(n)) return canon;
  for (const c of CANONICAL) if (n.includes(normalize(c))) return c;
  return null;
};

async function migrateBatch(filterEmail) {
  let page = 0;
  const pageSize = 200;
  let updated = 0;
  let scanned = 0;
  while (true) {
    const rangeFrom = page * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;
    let query = supabase.from('test_results').select('id,categories,candidate_profile,test_name').range(rangeFrom, rangeTo);
    if (filterEmail) query = query.eq('candidate_profile->>email', filterEmail);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) {
      scanned++;
      const cats = row.categories || {};
      const newCats = {};
      // initialize canonical keys
      for (const c of CANONICAL) newCats[c] = 0;
      // carry metadata
      const metaKeys = ['correct_answers','wrong_answers','blank_answers','accuracy','Aptitude Raw Score','Aptitude Max Score'];
      for (const [k, v] of Object.entries(cats)) {
        const lower = String(k || '');
        if (metaKeys.includes(lower) || metaKeys.includes(k)) {
          newCats[k] = v; // keep as-is
          continue;
        }
        const resolved = resolve(k);
        if (resolved) newCats[resolved] = (newCats[resolved] || 0) + Math.round(Number(v || 0));
        else newCats[k] = (newCats[k] || 0) + Math.round(Number(v || 0));
      }
      // detect difference
      const equal = JSON.stringify(cats) === JSON.stringify(newCats);
      if (!equal) {
        console.log(`Row ${row.id} will be updated. test_name=${row.test_name}`);
        console.log('Before:', cats);
        console.log('After :', newCats);
        if (!dryRun) {
          const { error: upErr } = await supabase.from('test_results').update({ categories: newCats }).eq('id', row.id);
          if (upErr) {
            console.error('Failed to update', row.id, upErr.message || upErr);
          } else {
            updated++;
          }
        }
      }
    }
    page++;
  }
  return { scanned, updated };
}

(async () => {
  try {
    console.log('Starting aptitude categories migration', dryRun ? '(dry run)' : '');
    const res = await migrateBatch(emailFilter);
    console.log(`Done. Scanned ${res.scanned} rows. Updated ${res.updated} rows.`);
    process.exit(0);
  } catch (e) {
    console.error('Migration failed', e instanceof Error ? e.message : e);
    process.exit(2);
  }
})();
