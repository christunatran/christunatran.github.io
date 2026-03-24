#!/usr/bin/env node
/**
 * setup-jsonbin.js
 *
 * Creates a JSONbin.io bin pre-populated with the current 75hard-progress.json,
 * then patches the JSONBIN_KEY and JSONBIN_BIN constants into 75/index.html.
 *
 * Usage:
 *   node _dev/setup-jsonbin.js <your-jsonbin-master-key>
 *
 * Get your master key from: https://jsonbin.io/app/app/apikeys
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const masterKey = process.argv[2];
if (!masterKey) {
  console.error('Usage: node _dev/setup-jsonbin.js <your-jsonbin-master-key>');
  process.exit(1);
}

const progressPath = path.join(__dirname, '../data/75hard-progress.json');
const progress     = fs.readFileSync(progressPath, 'utf8');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('→ creating JSONbin...');

  const { status, body } = await request({
    hostname: 'api.jsonbin.io',
    path: '/v3/b',
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'X-Master-Key':  masterKey,
      'X-Bin-Name':    '75hard-progress',
      'X-Bin-Private': 'false',
    },
  }, progress);

  if (status !== 200 || !body.metadata) {
    console.error('Failed to create bin (status ' + status + '):', JSON.stringify(body));
    process.exit(1);
  }

  const binId = body.metadata.id;
  console.log(`✓ bin created: ${binId}`);
  console.log(`  view at: https://jsonbin.io/app/bins/${binId}`);

  // Patch 75/index.html
  const htmlPath = path.join(__dirname, '../75/index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  if (!html.includes("const JSONBIN_KEY    = '';")) {
    console.error('Cannot find JSONBIN_KEY placeholder — already set up?');
    process.exit(1);
  }

  html = html
    .replace("const JSONBIN_KEY    = '';", `const JSONBIN_KEY    = '${masterKey}';`)
    .replace("const JSONBIN_BIN    = '';", `const JSONBIN_BIN    = '${binId}';`);

  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✓ patched 75/index.html with credentials');
  console.log('');
  console.log('→ run: bash _dev/deploy.sh "connect jsonbin live sync"');
}

main().catch(console.error);
