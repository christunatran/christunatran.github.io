/**
 * blog-post.js
 *
 * Fetches and renders an individual blog post. Reads ?slug= from the URL
 * to look up the post's markdown filename in blog.json, then fetches and
 * renders the markdown body via marked.js (loaded separately via CDN).
 */

(function () {
  'use strict';

  const slug      = new URLSearchParams(window.location.search).get('slug');
  const contentEl = document.getElementById('work-content');

  if (!slug) {
    contentEl.innerHTML = '<p>no post specified.</p>';
    return;
  }

  /**
   * Extracts YAML-style frontmatter from a markdown string.
   * Returns { meta: Object, body: string }.
   */
  function parseFrontmatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: text };

    const meta = {};
    match[1].split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        meta[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
      }
    });

    return { meta, body: match[2] };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  fetch('/data/blog.json')
    .then(r => r.json())
    .then(posts => {
      const post = posts.find(p => p.slug === slug);
      if (!post) throw new Error('not found');

      return fetch('/blog/' + encodeURIComponent(post.file))
        .then(r => {
          if (!r.ok) throw new Error('not found');
          return r.text();
        })
        .then(raw => {
          const { meta, body: rawBody } = parseFrontmatter(raw);
          // Rewrite relative asset paths so they resolve from /blog/, not /blog-post/
          const body = rawBody.replace(/\((?!https?:\/\/)(assets\/[^)]+)\)/g, '(/blog/$1)');
          const title    = meta.title || post.title;
          const tagsHtml = post.tags && post.tags.length
            ? `<span class="blog-tag">${post.tags.map(escapeHtml).join(', ')}</span>`
            : '';

          let rendered = window.marked
            ? marked.parse(body, { gfm: true })
            : body;

          // Convert bare YouTube URLs (on their own line) into embeds.
          rendered = rendered.replace(
            /<p>\s*https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)[^\s<]*\s*<\/p>/g,
            (_, id) => `<div class="video-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
          );

          // marked.js is loaded via CDN before this script.
          contentEl.innerHTML = `
            <h1>${escapeHtml(title)}</h1>
            <div class="post-meta-row">
              <span class="now-meta">${post.date}</span>
              ${tagsHtml ? `<span class="post-tags">${tagsHtml}</span>` : ''}
            </div>
            ${rendered}
          `;

          document.title = `${title} — tunapee`;
        });
    })
    .catch(() => {
      contentEl.innerHTML = '<p>post not found.</p>';
    });
})();
