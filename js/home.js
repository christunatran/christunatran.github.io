/**
 * home.js
 *
 * Builds the two-column masonry grid on the home page by merging static
 * images, works, and blog posts, sorted newest-first. Items alternate
 * left/right so both columns fill evenly top-to-bottom.
 */

(function () {
  'use strict';

  const STATIC_IMAGES = [
    { src: '/assets/my professional headshot.jpg', date: '2026.03.16' },
  ];

  /** Escapes user-supplied strings before inserting into innerHTML. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'post post-image';
    card.innerHTML = `
      <div class="post-content">
        <img src="${image.src}" alt="" loading="lazy">
      </div>
      <span class="post-date">${image.date}</span>
    `;
    return card;
  }

  function createWorkCard(work) {
    const card = document.createElement('div');
    card.className = 'post post-image';
    card.innerHTML = `
      <div class="post-content">
        ${work.cover ? `<img src="${work.cover}" alt="${escapeHtml(work.title)}" loading="lazy">` : ''}
      </div>
      <span class="post-date">${work.date}</span>
    `;
    card.addEventListener('click', () => {
      window.location.href = `/work/?slug=${work.slug}`;
    });
    return card;
  }

  function createBlogCard(post) {
    const card = document.createElement('div');
    card.className = 'post post-text';
    card.innerHTML = `
      <div class="post-content">
        <p class="blog-card-title">${escapeHtml(post.title)}</p>
        ${post.snippet ? `<p class="blog-card-snippet">${escapeHtml(post.snippet)}</p>` : ''}
      </div>
      <span class="post-date">${post.date}</span>
    `;
    card.addEventListener('click', () => {
      window.location.href = `/blog-post/?slug=${post.slug}`;
    });
    return card;
  }

  function buildGrid(works, posts) {
    const items = [
      ...STATIC_IMAGES.map(i => ({ type: 'image', date: i.date, data: i })),
      ...works.map(w =>         ({ type: 'work',  date: w.date, data: w })),
      ...posts.filter(p => !p.disabled).map(p => ({ type: 'blog', date: p.date, data: p })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    const colL = document.createElement('div');
    const colR = document.createElement('div');
    colL.className = 'posts-col';
    colR.className = 'posts-col';
    grid.appendChild(colL);
    grid.appendChild(colR);

    const creators = { image: createImageCard, work: createWorkCard, blog: createBlogCard };

    items.forEach((item, idx) => {
      const card = creators[item.type]?.(item.data);
      if (card) (idx % 2 === 0 ? colL : colR).appendChild(card);
    });
  }

  Promise.all([
    fetch('/data/works.json').then(r => r.json()),
    fetch('/data/blog.json').then(r => r.json()),
  ]).then(([works, posts]) => buildGrid(works, posts));
})();
