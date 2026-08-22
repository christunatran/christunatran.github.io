// Stamps /css/style.css and /js/*.js references with a ?v= query string so
// browsers (and GitHub Pages' 10-minute edge cache) fetch fresh assets on
// every deploy instead of reusing a stale cached copy until a hard refresh.
// Run automatically by _dev/deploy.sh before each commit.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VERSION = Date.now().toString(36);

const TARGET_FILES = [
  'index.html',
  'about/index.html',
  'blog/index.html',
  'blog-post/index.html',
  'works/index.html',
  'work/index.html',
  'now/index.html',
  '75/index.html',
];

const CSS_RE = /(href="\/css\/style\.css)(?:\?v=[^"]*)?(")/g;
const JS_RE = /(src="\/js\/[a-zA-Z0-9_-]+\.js)(?:\?v=[^"]*)?(")/g;

for (const rel of TARGET_FILES) {
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, 'utf8');
  const updated = original
    .replace(CSS_RE, `$1?v=${VERSION}$2`)
    .replace(JS_RE, `$1?v=${VERSION}$2`);

  if (updated !== original) {
    fs.writeFileSync(file, updated);
    console.log(`bumped cache version in ${rel}`);
  }
}
