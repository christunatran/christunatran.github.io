/**
 * home.js — masonry grid for the home page.
 *
 * Items (works, blog posts, static images) are sorted newest-first and placed
 * into a two-column absolute-position masonry layout. Heights are measured
 * after images decode so the layout is always accurate.
 */

(function () {
  'use strict';

  const GAP = 20; // px gap between cards and columns

  const STATIC_IMAGES = [
    { src: '/assets/my professional headshot.jpg', date: '2025.02' },
    { src: '/assets/hard mode winner.png', date: '2026.03.08', href: '/work/?slug=closer-to-the-fire' },
  ];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'post post-image';
    card.innerHTML = `
      <div class="post-content">
        <img src="${image.src}" alt="">
      </div>
      <span class="post-date">${image.date}</span>
    `;
    if (image.href) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => { window.location.href = image.href; });
    }
    return card;
  }

  function createWorkCard(work) {
    const card = document.createElement('div');
    card.className = 'post post-image';
    card.innerHTML = `
      <div class="post-content">
        ${work.cover ? `<img src="${work.cover}" alt="${escapeHtml(work.title)}">` : ''}
      </div>
      <span class="post-date">${work.date}</span>
    `;
    card.addEventListener('click', () => { window.location.href = `/work/?slug=${work.slug}`; });
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
    card.addEventListener('click', () => { window.location.href = `/blog-post/?slug=${post.slug}`; });
    return card;
  }

  function normalizeDate(d) {
    return d.split('.').map((p, i) => i === 0 ? p : p.padStart(2, '0')).join('.');
  }

  function masonry(grid, cards) {
    // Mobile: skip absolute positioning (CSS handles single-column)
    if (window.innerWidth <= 768) return;

    const w = grid.clientWidth;
    if (!w) return;
    const colW = Math.floor((w - GAP) / 2);

    // Set column width on each card so text wraps correctly before measuring
    cards.forEach(c => {
      c.style.position = 'absolute';
      c.style.width = colW + 'px';
      c.style.visibility = 'hidden';
    });

    // Force reflow so offsetHeight reflects correct column width
    void grid.offsetHeight;

    // Greedy: place each card into the shorter column
    const ys = [0, 0];
    cards.forEach(c => {
      const col = ys[0] <= ys[1] ? 0 : 1;
      c.style.left  = (col * (colW + GAP)) + 'px';
      c.style.top   = ys[col] + 'px';
      c.style.visibility = 'visible';
      ys[col] += c.offsetHeight + GAP;
    });

    grid.style.height = Math.max(...ys) + 'px';
  }

  function buildGrid(works, posts) {
    const items = [
      ...STATIC_IMAGES.map(i => ({ type: 'image', date: i.date, data: i })),
      ...works.map(w =>         ({ type: 'work',  date: w.date, data: w })),
      ...posts.filter(p => !p.disabled).map(p => ({ type: 'blog', date: p.date, data: p })),
    ].sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));

    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    const creators = { image: createImageCard, work: createWorkCard, blog: createBlogCard };
    const cards = [];

    items.forEach(item => {
      const card = creators[item.type]?.(item.data);
      if (!card) return;
      grid.appendChild(card);
      cards.push(card);
    });

    function doLayout() { masonry(grid, cards); }

    // Wait for all images to decode, then layout
    const imgs = Array.from(grid.querySelectorAll('img'));
    Promise.all(imgs.map(i => i.decode().catch(() => {}))).then(doLayout);

    // Re-layout as any lazy/slow images finish loading
    const ro = new ResizeObserver(doLayout);
    imgs.forEach(i => ro.observe(i));

    // Re-layout on resize
    window.addEventListener('resize', doLayout);
  }

  Promise.all([
    fetch('/data/works.json').then(r => r.json()),
    fetch('/data/blog.json').then(r => r.json()),
  ]).then(([works, posts]) => buildGrid(works, posts));
})();
