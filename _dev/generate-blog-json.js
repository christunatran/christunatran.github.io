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
 *   disabled       — "true" to hide the post
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
  const para = body.split(/\n{2,}/)[0]
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
      snippet: extractSnippet(content),
      tags,
    };

    if (fm.disabled === 'true') post.disabled = true;

    return [post];
  });

  // Sort newest-first (dates are "YYYY.MM.DD" — lexicographic is correct when zero-padded)
  posts.sort((a, b) => b.date.localeCompare(a.date));

  fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2) + '\n');
  console.log(`✓ blog.json updated — ${posts.length} posts`);
}

generate();
