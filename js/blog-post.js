/**
 * blog-post.js
 *
 * Fetches and renders an individual blog post. Reads the slug from the
 * clean URL path (/blog-post/<slug>) to look up the post's markdown
 * filename in blog.json, then fetches and renders the markdown body via
 * marked.js (loaded separately via CDN).
 *
 * Gate: if the post's temperature tier is above the visitor's current
 * dial setting (js/temperature.js), the markdown is never fetched — only
 * the title and a redacted placeholder are shown. This exists so a direct
 * link/URL to a gated post can't bypass the blog listing's redaction.
 */

(function () {
  'use strict';

  const contentEl = document.getElementById('work-content');
  let slug = new URLSearchParams(window.location.search).get('slug');

  if (slug) {
    // legacy ?slug= link — switch the address bar to the clean URL
    history.replaceState(null, '', '/blog-post/' + encodeURIComponent(slug));
  } else {
    const parts = window.location.pathname.split('/').filter(Boolean);
    slug = parts.length > 1 ? decodeURIComponent(parts[1]) : null;
  }

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

  function displayTitle(post) {
    const isQuote = post.tags && post.tags.includes('quotes');
    return isQuote ? `"${post.title}"` : post.title;
  }

  function metaRowHtml(post) {
    const tagsHtml = post.tags && post.tags.length
      ? `<span class="blog-tag">${post.tags.map(escapeHtml).join(', ')}</span>`
      : '';
    return `
      <div class="post-meta-row">
        <span class="now-meta">${post.date}</span>
        ${tagsHtml ? `<span class="post-tags">${tagsHtml}</span>` : ''}
      </div>
    `;
  }

  function renderLocked(post) {
    const title = displayTitle(post);
    contentEl.innerHTML = `
      <h1>${escapeHtml(title)}</h1>
      ${metaRowHtml(post)}
      <p class="temp-redacted" style="display:inline-flex;">${window.Temperature.LOCK_ICON}<span>turn the temperature dial up to "${escapeHtml(post.temperature)}" to read this post</span></p>
    `;
    document.title = `${title} — tunapee`;
  }

  fetch('/data/blog.json')
    .then(r => r.json())
    .then(posts => {
      const post = posts.find(p => p.slug === slug);
      if (!post) throw new Error('not found');

      let renderedHtml = null; // cache so re-unlocking doesn't re-fetch

      function fetchAndRender() {
        if (renderedHtml) {
          contentEl.innerHTML = renderedHtml;
          initLightbox(contentEl);
          document.title = `${displayTitle(post)} — tunapee`;
          return Promise.resolve();
        }

        return fetch('/blog/' + encodeURIComponent(post.file))
          .then(r => {
            if (!r.ok) throw new Error('not found');
            return r.text();
          })
          .then(raw => {
            const { meta, body: rawBody } = parseFrontmatter(raw);
            // Rewrite relative asset paths so they resolve from /blog/, not /blog-post/
            const body = rawBody.replace(/\((?!https?:\/\/)(assets\/[^)]+)\)/g, '(/blog/$1)');
            const title = displayTitle({ ...post, title: meta.title || post.title });

            const normalizedBody = body
              .replace(/[‘’]/g, "'")
              .replace(/[“”]/g, '"');

            let rendered = window.marked
              ? marked.parse(normalizedBody, { gfm: true })
              : normalizedBody;

            // Convert bare YouTube URLs (on their own line) into embeds.
            rendered = rendered.replace(
              /<p>\s*https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)[^\s<]*\s*<\/p>/g,
              (_, id) => `<div class="video-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
            );

            // marked.js is loaded via CDN before this script.
            contentEl.innerHTML = `
              <h1>${escapeHtml(title)}</h1>
              ${metaRowHtml(post)}
              ${rendered}
            `;
            autoGridConsecutiveImages(contentEl);
            renderedHtml = contentEl.innerHTML; // cache post-grid HTML
            initLightbox(contentEl);
            document.title = `${title} — tunapee`;
          });
      }

      /**
       * Initialises GLightbox on all images in the container. Mirrors
       * work-detail.js's version of this helper.
       */
      function initLightbox(container) {
        if (!window.GLightbox) return;
        const images   = Array.from(container.querySelectorAll('img'));
        const elements = images.map(img => ({ href: img.src, type: 'image' }));
        const lb       = GLightbox({ elements, touchNavigation: true });

        images.forEach((img, idx) => {
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => lb.openAt(idx));
        });
      }

      /**
       * Groups runs of consecutive single-image paragraphs into CSS grid
       * wrappers (.img-grid--2/3/4) for a side-by-side layout. Mirrors
       * work-detail.js's version of this helper.
       */
      function autoGridConsecutiveImages(container) {
        const children = Array.from(container.children);
        let i = 0;

        while (i < children.length) {
          const el              = children[i];
          const isSingleImgPara = el.tagName === 'P'
            && el.children.length === 1
            && el.children[0].tagName === 'IMG';

          if (!isSingleImgPara) { i++; continue; }

          const run = [el];
          let j = i + 1;
          while (j < children.length) {
            const next = children[j];
            if (next.tagName === 'P' && next.children.length === 1 && next.children[0].tagName === 'IMG') {
              run.push(next);
              j++;
            } else {
              break;
            }
          }

          if (run.length >= 2) {
            for (let k = 0; k < run.length;) {
              const chunk = run.slice(k, k + 4);
              const grid  = document.createElement('div');
              grid.className = `img-grid img-grid--${chunk.length}`;
              chunk[0].parentNode.insertBefore(grid, chunk[0]);
              chunk.forEach(p => grid.appendChild(p.children[0]));
              chunk.forEach(p => p.remove());
              k += 4;
            }
          }

          i = j;
        }
      }

      function update() {
        const locked = !window.Temperature.isUnlocked(post.temperature, window.Temperature.getTier());
        if (locked) {
          renderLocked(post);
        } else {
          fetchAndRender().catch(() => {
            contentEl.innerHTML = '<p>post not found.</p>';
          });
        }
      }

      update();
      window.addEventListener(window.Temperature.EVENT_NAME, update);
    })
    .catch(() => {
      contentEl.innerHTML = '<p>post not found.</p>';
    });
})();
