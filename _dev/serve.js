#!/usr/bin/env node
/**
 * serve.js — local preview server (`site preview`)
 *
 * Serves the site exactly the way GitHub Pages does, including the 404.html
 * fallback that powers clean URLs like /work/<slug> and /blog-post/<slug> —
 * so what you see locally is what deploys.
 *
 * Also regenerates data/blog.json on start and watches blog/ for changes
 * (same job as watch-blog.js), so new/edited posts show up on refresh.
 *
 * Usage:  node _dev/serve.js [port]     (default port 5500)
 */

'use strict';

const fs   = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 5500;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
};

// ── blog.json: fresh on start, regenerate on every save in blog/ ──────────

function regenerate() {
  try {
    execSync(`node "${path.join(__dirname, 'generate-blog-json.js')}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('blog.json error:', e.message);
  }
}

regenerate();

let debounce = null;
fs.watch(path.join(ROOT, 'blog'), (event, filename) => {
  if (!filename || !filename.endsWith('.md')) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`→ ${filename} changed, regenerating blog.json`);
    regenerate();
  }, 200);
});

// ── static server with GitHub-Pages-style 404 fallback ────────────────────

function send(res, status, file) {
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, urlPath);

  // no escaping the site root
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }

  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    send(res, 200, file);
  } else {
    // GitHub Pages serves 404.html for unknown paths — its inline script
    // resolves clean URLs like /work/<slug> from there.
    send(res, 404, path.join(ROOT, '404.html'));
  }
}).listen(PORT, () => {
  console.log(`\n✓ previewing at  http://localhost:${PORT}`);
  console.log(`  watching blog/ for changes — ctrl+c to stop\n`);
});
