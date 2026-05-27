/**
 * blog-listing.js
 *
 * Fetches blog.json and renders the blog post listing.
 */

(function () {
  'use strict';

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
      const grid = document.getElementById('blogGrid');
      if (!grid) return;

      posts.filter(post => !post.disabled).forEach(post => {
        const card = document.createElement('div');

        const tagsHtml = post.tags && post.tags.length
          ? `<span class="blog-tag">${post.tags.map(escapeHtml).join(', ')}</span>`
          : '';

        card.className = 'post post-text';
        const isQuote = post.tags && post.tags.includes('quotes');
        const displayTitle = isQuote ? `"${post.title}"` : post.title;
        card.innerHTML = `
          <div class="post-content">
            <p class="blog-card-title">${escapeHtml(displayTitle)}</p>
            ${post.snippet ? `<p class="blog-card-snippet">${escapeHtml(post.snippet)}</p>` : ''}
          </div>
          <div class="post-footer">
            <span class="post-date">${post.date}</span>
            <span class="post-tags">${tagsHtml}</span>
          </div>
        `;

        card.addEventListener('click', () => {
          window.location.href = `/blog-post/?slug=${post.slug}`;
        });

        grid.appendChild(card);
      });
    });
})();
