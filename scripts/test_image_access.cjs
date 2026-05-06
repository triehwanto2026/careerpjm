const https = require('https');
const fs = require('fs');

// Read .env file
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim();
  }
});

const url = envVars.VITE_SUPABASE_URL;

// Test URLs
const testUrls = [
  `${url}/storage/v1/object/public/test-images/q117-soal-1778036036979-r38qkb.png`,
  `${url}/storage/v1/object/public/test-images/q117-pilihan-1778036037673-0zajbz.png`
];

function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`\n${url.substring(0, 60)}...`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Content-Type: ${res.headers['content-type']}`);
      console.log(`  Content-Length: ${res.headers['content-length'] || 'unknown'}`);
      
      if (res.statusCode === 200) {
        resolve({ ok: true, status: res.statusCode });
      } else {
        resolve({ ok: false, status: res.statusCode });
      }
    }).on('error', (err) => {
      console.log(`\n${url.substring(0, 60)}...`);
      console.log(`  Error: ${err.message}`);
      resolve({ ok: false, error: err.message });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`  Timeout after 10s`);
      resolve({ ok: false, error: 'timeout' });
    });
  });
}

async function runTests() {
  console.log('=== Testing Image URLs ===\n');
  
  for (const url of testUrls) {
    await testUrl(url);
  }
  
  console.log('\n=== Summary ===');
  console.log('If status is 200, images are publicly accessible.');
  console.log('If status is 403/404, check bucket policies.');
}

runTests();
