#!/usr/bin/env node
/**
 * watch-blog.js
 *
 * Watches blog/ for new or changed .md files and auto-regenerates
 * data/blog.json via generate-blog-json.js.
 *
 * Usage:  node _dev/watch-blog.js
 *   (run this in the background while you write posts)
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const { execSync } = require('child_process');

const BLOG_DIR  = path.join(__dirname, '..', 'blog');
const GENERATOR = path.join(__dirname, 'generate-blog-json.js');

function run() {
  try {
    execSync(`node "${GENERATOR}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

// Run once on start so blog.json is always fresh when you launch the watcher
run();

let debounce = null;
fs.watch(BLOG_DIR, (event, filename) => {
  if (!filename || !filename.endsWith('.md')) return;
  // Debounce rapid saves (editors often write twice)
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`\n→ ${event}: ${filename}`);
    run();
  }, 200);
});

console.log(`\nWatching blog/ for changes… (Ctrl+C to stop)\n`);
