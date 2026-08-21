/**
 * blog-listing.js
 *
 * Fetches blog.json and renders the blog post listing. The temperature
 * dial (js/temperature.js) only gates the full post body — every card
 * here always shows its title and snippet, with a small corner badge
 * marking posts above the visitor's current temperature setting. Locked
 * cards aren't clickable (cursor: not-allowed) — the full post still
 * lives behind /blog-post/, so this is just a soft deterrent.
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

  /**
   * Wraps a "quotes"-tagged post's title in quote marks — but only on
   * whichever side doesn't already have one, since some titles are
   * typed with the quote marks already included in frontmatter.
   */
  function wrapQuoteTitle(title) {
    const openQuotes = ['"', '“'];
    const closeQuotes = ['"', '”'];
    const hasOpen = openQuotes.some(q => title.startsWith(q));
    const hasClose = closeQuotes.some(q => title.endsWith(q));
    return (hasOpen ? '' : '"') + title + (hasClose ? '' : '"');
  }

  function buildCard(post, locked) {
    const card = document.createElement('div');
    card.className = 'post post-text' + (locked ? ' temp-locked' : '');

    const tagsHtml = post.tags && post.tags.length
      ? `<span class="blog-tag">${post.tags.map(escapeHtml).join(', ')}</span>`
      : '';

    const isQuote = post.tags && post.tags.includes('quotes');
    const displayTitle = isQuote ? wrapQuoteTitle(post.title) : post.title;

    const badgeHtml = locked
      ? `<span class="temp-lock-badge">${window.Temperature.LOCK_ICON}<span>${escapeHtml(post.temperature)}</span></span>`
      : '';

    card.innerHTML = `
      ${badgeHtml}
      <div class="post-content">
        <p class="blog-card-title">${escapeHtml(displayTitle)}</p>
        <p class="blog-card-snippet">${post.snippet ? escapeHtml(post.snippet) : ''}</p>
      </div>
      <div class="post-footer">
        <span class="post-date">${post.date}</span>
        <span class="post-tags">${tagsHtml}</span>
      </div>
    `;

    if (!locked) {
      card.addEventListener('click', () => {
        window.location.href = `/blog-post/${post.slug}`;
      });
    }

    if (!post.snippet) {
      const snippetEl = card.querySelector('.blog-card-snippet');
      window.Temperature.fetchSnippet(post).then(text => {
        if (text) snippetEl.textContent = text;
      });
    }

    return card;
  }

  function render(grid, posts) {
    grid.innerHTML = '';
    const tier = window.Temperature.getTier();
    posts.filter(post => !post.disabled).forEach(post => {
      const locked = !window.Temperature.isUnlocked(post.temperature, tier);
      grid.appendChild(buildCard(post, locked));
    });
  }

  fetch('/data/blog.json')
    .then(r => r.json())
    .then(posts => {
      const grid = document.getElementById('blogGrid');
      if (!grid) return;

      render(grid, posts);
      window.addEventListener(window.Temperature.EVENT_NAME, () => render(grid, posts));
    });
})();
