#!/usr/bin/env node
/**
 * new-blog.js — scaffold a new blog post
 * Usage: node _dev/new-blog.js "My Post Title"
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const title = process.argv[2];
if (!title) {
  console.error('Usage: node _dev/new-blog.js "My Post Title"');
  process.exit(1);
}

const slug     = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const filename = title + '.md';
const filepath = path.join(__dirname, '..', 'blog', filename);

if (fs.existsSync(filepath)) {
  console.error(`Already exists: blog/${filename}`);
  process.exit(1);
}

const now     = new Date();
const pad     = n => String(n).padStart(2, '0');
const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

const template = `---
title: ${title}
link: ${slug}
published_date: ${dateStr}
tags:
---

Write your post here.
`;

fs.writeFileSync(filepath, template, 'utf8');
console.log(`✓ created: blog/${filename}`);
console.log(`  slug: ${slug}`);
console.log(`  → open the file, write your post, then deploy`);
