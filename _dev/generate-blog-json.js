#!/usr/bin/env node
/**
 * generate-blog-json.js
 *
 * Reads all .md files from blog/, parses their frontmatter,
 * and writes data/blog.json sorted newest-first.
 *
 * Frontmatter fields used:
 *   title          — post title
 *   link           — URL slug
 *   published_date — "YYYY-MM-DD HH:MM" → stored as "YYYY.MM.DD"
 *   tags           — comma-separated string → array
 *   temperature    — "employable" | "personal" | "shit-talk" (appropriateness level)
 *   snippet        — optional override for the auto-extracted preview text
 *
 * Note: the `snippet` preview always ships regardless of temperature tier —
 * only the full post body is gated by the temperature dial (js/temperature.js),
 * on the individual post page. A locked listing card still shows its title
 * and snippet as normal, just with a small corner badge indicating it's gated.
 *
 * `disabled` is NOT a frontmatter field — it lives only in data/blog.json.
 * To hide a post, set "disabled": true directly on its entry in blog.json;
 * regeneration preserves whatever's already there instead of deriving it
 * from the .md file, so it survives every re-run.
 *
 * Usage:  node _dev/generate-blog-json.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const BLOG_DIR   = path.join(__dirname, '..', 'blog');
const OUTPUT     = path.join(__dirname, '..', 'data', 'blog.json');

// ---------------------------------------------------------------------------
// Frontmatter parser
// ---------------------------------------------------------------------------

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const fm = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key   = line.slice(0, colon).trim();
    let   value = line.slice(colon + 1).trim();
    // Strip surrounding quotes
    if (/^["']/.test(value) && value[0] === value[value.length - 1]) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }
  return fm;
}

// ---------------------------------------------------------------------------
// Snippet extractor — first meaningful paragraph, max 220 chars
// ---------------------------------------------------------------------------

function extractSnippet(content) {
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
  // Find first paragraph that isn't an image, video, or empty
  const paragraphs = body.split(/\n{2,}/);
  const para = (paragraphs.find(p => {
    const t = p.trim();
    return t && !t.startsWith('![') && !t.startsWith('<video') && !t.startsWith('<img');
  }) || '')
    .replace(/[#*_`>~]/g, '')   // strip markdown syntax
    .replace(/\s+/g, ' ')
    .trim();
  return para.length > 220 ? para.slice(0, 220).trimEnd() + '…' : para;
}

// ---------------------------------------------------------------------------
// Date formatter:  "2026-03-21 16:22"  →  "2026.03.21"
// ---------------------------------------------------------------------------

function formatDate(raw) {
  return (raw || '').split(' ')[0].replace(/-/g, '.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function generate() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

  // `disabled` is managed by hand directly in blog.json, not frontmatter —
  // carry forward whatever's already set so regeneration doesn't clobber it.
  let previouslyDisabled = new Set();
  if (fs.existsSync(OUTPUT)) {
    try {
      previouslyDisabled = new Set(
        JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
          .filter(p => p.disabled)
          .map(p => p.slug)
      );
    } catch {}
  }

  const posts = files.flatMap(filename => {
    const content = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8');
    const fm      = parseFrontmatter(content);

    if (!fm.title || !fm.link) {
      console.warn(`  skipped ${filename} (missing title or link)`);
      return [];
    }

    const tags = fm.tags
      ? fm.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const post = {
      slug:    fm.link,
      title:   fm.title,
      date:    formatDate(fm.published_date),
      file:    filename,
      snippet: fm.snippet || extractSnippet(content),
      tags,
    };

    if (fm.temperature) post.temperature = fm.temperature;
    if (previouslyDisabled.has(post.slug)) post.disabled = true;
    if (fm.blogOnly === 'true') post.blogOnly = true;
    if (fm.cover) post.cover = fm.cover;

    return [post];
  });

  // Sort newest-first (dates are "YYYY.MM.DD" — lexicographic is correct when zero-padded)
  posts.sort((a, b) => b.date.localeCompare(a.date));

  fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2) + '\n');
  console.log(`✓ blog.json updated — ${posts.length} posts`);
}

generate();
