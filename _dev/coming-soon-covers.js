#!/usr/bin/env node
/**
 * coming-soon-covers.js
 *
 * For every work in data/works.json marked `"comingSoon": true`, renders a
 * dithered, low-res stand-in for its cover so the home page and works page
 * can tease the project without showing it. The real cover is never sent to
 * those pages — js/components.js (window.Covers) swaps in `coverObscured`
 * and overlays a "coming soon" label.
 *
 *   still covers (.jpg/.png/...)  → works/<slug>/assets/coming-soon-cover.png
 *   animated covers (.gif/.mp4)   → works/<slug>/assets/coming-soon-cover.gif
 *
 * The output is ~DITHER_WIDTH px wide, a handful of colors, ordered (bayer)
 * dither — CSS scales it back up with `image-rendering: pixelated`.
 * Re-renders only when the cover is newer than its stand-in. To launch a
 * work, delete `comingSoon` (and `coverObscured`) from its works.json entry.
 *
 * Runs automatically as part of deploy.sh. Needs ffmpeg.
 *
 * Usage:  node _dev/coming-soon-covers.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT       = path.join(__dirname, '..');
const WORKS_JSON = path.join(ROOT, 'data', 'works.json');

const DITHER_WIDTH = 72;  // px — lower = more obscured
const COLORS       = 6;
const ANIM_FPS     = 6;

const ANIMATED_RE = /\.(gif|mp4|mov)$/i;

const works = JSON.parse(fs.readFileSync(WORKS_JSON, 'utf8'));
let changed = 0;

for (const work of works) {
  if (!work.comingSoon || !work.cover) continue;

  const src = path.join(ROOT, work.cover);
  if (!fs.existsSync(src)) {
    console.warn(`  ! ${work.slug}: cover not found (${work.cover})`);
    continue;
  }

  const animated = ANIMATED_RE.test(src);
  const rel      = path.posix.join(path.posix.dirname(work.cover), `coming-soon-cover.${animated ? 'gif' : 'png'}`);
  const out      = path.join(ROOT, rel);

  const stale = !fs.existsSync(out) || fs.statSync(src).mtimeMs > fs.statSync(out).mtimeMs;
  if (stale) {
    const pre   = animated ? `fps=${ANIM_FPS},` : '';
    const graph = `${pre}scale=${DITHER_WIDTH}:-2:flags=area,split[a][b];` +
                  `[a]palettegen=max_colors=${COLORS}:stats_mode=full[p];` +
                  `[b][p]paletteuse=dither=bayer:bayer_scale=1`;
    const args  = ['-v', 'error', '-y', '-i', src, '-vf', graph];
    if (!animated) args.push('-frames:v', '1', '-update', '1');
    args.push(out);
    execFileSync('ffmpeg', args, { stdio: 'inherit' });
    console.log(`  ✓ ${work.slug}: dithered → ${rel}`);
  }

  if (work.coverObscured !== rel) {
    work.coverObscured = rel;
    changed++;
  }
}

if (changed) fs.writeFileSync(WORKS_JSON, JSON.stringify(works, null, 2) + '\n', 'utf8');
console.log(`✓ coming-soon covers: ${changed ? `updated ${changed} work(s)` : 'all up to date'}`);
