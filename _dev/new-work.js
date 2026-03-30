#!/usr/bin/env node
/**
 * new-work.js — scaffold a new works post
 * Usage: node _dev/new-work.js "My Work Title" "subtitle" "2026.04"
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const [,, title, subtitle = '', date = ''] = process.argv;
if (!title) {
  console.error('Usage: node _dev/new-work.js "My Work Title" "subtitle" "2026.04"');
  process.exit(1);
}

const slug     = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const workDir  = path.join(__dirname, '..', 'works', slug);
const assetsDir = path.join(workDir, 'assets');

if (fs.existsSync(workDir)) {
  console.error(`Already exists: works/${slug}/`);
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });

const template = `# ${title}

Write your description here.

![cover image](assets/cover.jpg)
`;

fs.writeFileSync(path.join(workDir, 'index.md'), template, 'utf8');

// Add entry to works.json
const worksPath = path.join(__dirname, '..', 'data', 'works.json');
const works     = JSON.parse(fs.readFileSync(worksPath, 'utf8'));

const entry = { slug, title, subtitle, date, cover: `works/${slug}/assets/cover.jpg` };
works.unshift(entry);
fs.writeFileSync(worksPath, JSON.stringify(works, null, 2) + '\n', 'utf8');

console.log(`✓ created: works/${slug}/`);
console.log(`✓ added entry to data/works.json`);
console.log(`  → drop your cover image into works/${slug}/assets/`);
console.log(`  → update the cover filename in data/works.json if it differs from cover.jpg`);
console.log(`  → write your post in works/${slug}/index.md`);
console.log(`  → deploy when ready`);
