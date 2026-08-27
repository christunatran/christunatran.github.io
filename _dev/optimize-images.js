#!/usr/bin/env node
/**
 * optimize-images.js
 *
 * Shrinks oversized images in place so pages load fast. Runs automatically
 * as part of deploy.sh, and is safe to re-run any time (already-optimized
 * files are skipped).
 *
 * What it does:
 *   1. Every .jpg/.jpeg/.png in assets/, blog/assets/, and works/ gets
 *      resized so its longest side is at most MAX_DIM pixels (screens don't
 *      need more), and JPEGs over RECOMPRESS_BYTES are re-encoded at
 *      QUALITY. A file is only replaced if the result is actually smaller.
 *   2. data/works.json gets coverW/coverH pixel dimensions stamped onto
 *      each entry whose cover file exists — the masonry layouts use these
 *      to reserve space for lazy-loaded covers before they load.
 *
 * Uses macOS's built-in `sips` — no dependencies to install.
 *
 * Usage:  node _dev/optimize-images.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

const SCAN_DIRS        = ['assets', path.join('blog', 'assets'), 'works'];
const MAX_DIM          = 2000;          // longest side, px
const QUALITY          = '80';          // jpeg re-encode quality
const RECOMPRESS_BYTES = 600 * 1024;    // jpegs bigger than this get re-encoded even if small enough
const MIN_BYTES        = 400 * 1024;    // files smaller than this are left alone (keeps deploys fast)

const IMG_RE  = /\.(jpe?g|png)$/i;
const JPEG_RE = /\.jpe?g$/i;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (IMG_RE.test(entry.name)) out.push(full);
  }
  return out;
}

function dimensions(file) {
  try {
    if (/\.(mp4|mov)$/i.test(file)) {
      // video covers — sips can't read these, ffprobe can
      const out = execFileSync('ffprobe', [
        '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file,
      ], { encoding: 'utf8' });
      const [w, h] = out.trim().split(',').map(Number);
      return w && h ? { w, h } : null;
    }
    const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
    const w = out.match(/pixelWidth: (\d+)/);
    const h = out.match(/pixelHeight: (\d+)/);
    return w && h ? { w: Number(w[1]), h: Number(h[1]) } : null;
  } catch {
    return null;
  }
}

function kb(bytes) { return Math.round(bytes / 1024) + 'KB'; }

// ---------------------------------------------------------------------------
// 1. Resize / recompress
// ---------------------------------------------------------------------------

let savedTotal = 0, touched = 0, skipped = 0;

for (const dir of SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;

  for (const file of walk(abs)) {
    const before = fs.statSync(file).size;
    if (before < MIN_BYTES) { skipped++; continue; }
    const dims   = dimensions(file);
    if (!dims) { skipped++; continue; }

    const isJpeg        = JPEG_RE.test(file);
    const needResize    = Math.max(dims.w, dims.h) > MAX_DIM;
    const needRecompress = isJpeg && before > RECOMPRESS_BYTES;
    if (!needResize && !needRecompress) { skipped++; continue; }

    const tmp  = file + '.tmp' + path.extname(file);
    const args = [];
    if (isJpeg)      args.push('-s', 'format', 'jpeg', '-s', 'formatOptions', QUALITY);
    if (needResize)  args.push('--resampleHeightWidthMax', String(MAX_DIM));
    args.push(file, '--out', tmp);

    try {
      execFileSync('sips', args, { stdio: 'pipe' });
    } catch (e) {
      console.warn(`  ! failed: ${path.relative(ROOT, file)}`);
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      skipped++;
      continue;
    }

    // Only replace when the saving is meaningful — a re-encode at the same
    // quality shaves a few bytes every run, which would churn files into
    // git on every deploy.
    const after = fs.statSync(tmp).size;
    const saved = before - after;
    if (saved > before * 0.1 || saved > 200 * 1024) {
      fs.renameSync(tmp, file);
      savedTotal += before - after;
      touched++;
      console.log(`  ✓ ${path.relative(ROOT, file)}  ${kb(before)} → ${kb(after)}`);
    } else {
      fs.unlinkSync(tmp);
      skipped++;
    }
  }
}

console.log(`\n✓ images: ${touched} shrunk, ${skipped} already fine — saved ${kb(savedTotal)} total`);

// ---------------------------------------------------------------------------
// 2. Stamp cover dimensions into data/works.json
// ---------------------------------------------------------------------------

const WORKS_JSON = path.join(ROOT, 'data', 'works.json');
const works = JSON.parse(fs.readFileSync(WORKS_JSON, 'utf8'));
let stamped = 0;

for (const work of works) {
  if (!work.cover) continue;
  const coverFile = path.join(ROOT, work.cover);
  if (!fs.existsSync(coverFile)) continue;
  const dims = dimensions(coverFile);
  if (!dims) continue;
  if (work.coverW !== dims.w || work.coverH !== dims.h) {
    work.coverW = dims.w;
    work.coverH = dims.h;
    stamped++;
  }
}

fs.writeFileSync(WORKS_JSON, JSON.stringify(works, null, 2) + '\n');
console.log(`✓ works.json: cover dimensions ${stamped ? `updated for ${stamped} work(s)` : 'all up to date'}`);
