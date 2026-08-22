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
    { src: '/assets/hard mode winner.png', date: '2026.03.08', href: '/work/closer-to-the-fire' },
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
    card.addEventListener('click', () => { window.location.href = `/work/${work.slug}`; });
    return card;
  }

  // Only the full post body is gated (js/blog-post.js) — the preview here
  // (cover image or title+snippet) always shows normally. A locked post
  // just gets a small corner badge marking it as gated.
  function createBlogCard(post, locked) {
    const card = document.createElement('div');
    const lockClass = locked ? ' temp-locked' : '';
    const badgeHtml = locked
      ? `<span class="temp-lock-badge">${window.Temperature.LOCK_ICON}<span>${escapeHtml(post.temperature)}</span></span>`
      : '';

    if (post.cover) {
      card.className = 'post post-image' + lockClass;
      card.innerHTML = `
        ${badgeHtml}
        <div class="post-content">
          <img src="${escapeHtml(post.cover)}" alt="${escapeHtml(post.title)}">
        </div>
        <span class="post-date">${post.date}</span>
      `;
    } else {
      card.className = 'post post-text' + lockClass;
      card.innerHTML = `
        ${badgeHtml}
        <div class="post-content">
          <p class="blog-card-title">${escapeHtml(post.title)}</p>
          <p class="blog-card-snippet">${post.snippet ? escapeHtml(post.snippet) : ''}</p>
        </div>
        <span class="post-date">${post.date}</span>
      `;
    }

    if (!locked) {
      card.addEventListener('click', () => { window.location.href = `/blog-post/${post.slug}`; });
    }

    if (!post.cover && !post.snippet) {
      const snippetEl = card.querySelector('.blog-card-snippet');
      window.Temperature.fetchSnippet(post).then(text => {
        if (text) snippetEl.textContent = text;
      });
    }

    return card;
  }

  function normalizeDate(d) {
    return d.split('.').map((p, i) => i === 0 ? p : p.padStart(2, '0')).join('.');
  }

  function masonry(grid, cards) {
    // CSS grid handles layout
    return;

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

    // Strict left-to-right: 1st→col0, 2nd→col1, 3rd→col0, ...
    const ys = [0, 0];
    cards.forEach((c, idx) => {
      const col = idx % 2;
      c.style.left  = (col * (colW + GAP)) + 'px';
      c.style.top   = ys[col] + 'px';
      c.style.visibility = 'visible';
      ys[col] += c.offsetHeight + GAP;
    });

    grid.style.height = Math.max(...ys) + 'px';
  }

  // ── "now" preview box — sits above the ascii art in the side panel.
  // Nav no longer links to /now directly; this box (and its header link)
  // is the only way to reach it besides typing the URL.
  function injectNowPreview() {
    const panel = document.getElementById('side-panel');
    if (!panel) return;

    const box = document.createElement('div');
    box.id = 'now-box';
    box.innerHTML = `
      <a href="/now" class="now-box-header">now</a>
      <div class="now-box-body" id="now-box-body"></div>
    `;
    panel.insertBefore(box, panel.firstChild);

    fetch('/now/index.md', { cache: 'no-store' })
      .then(r => r.text())
      .then(md => {
        document.getElementById('now-box-body').innerHTML = marked.parse(md);
      })
      .catch(() => {});
  }

  injectNowPreview();

  const MOBILE_BREAKPOINT = 768;

  function buildGrid(works, posts) {
    const items = [
      ...STATIC_IMAGES.map(i => ({ type: 'image', date: i.date, data: i })),
      ...works.map(w =>         ({ type: 'work',  date: w.date, data: w })),
      ...posts.filter(p => !p.disabled && !p.blogOnly).map(p => ({ type: 'blog', date: p.date, data: p })),
    ].sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));

    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const creators = { image: createImageCard, work: createWorkCard };
    const tier = window.Temperature.getTier();
    function createItemCard(item) {
      if (item.type === 'blog') {
        return createBlogCard(item.data, !window.Temperature.isUnlocked(item.data.temperature, tier));
      }
      return creators[item.type]?.(item.data);
    }

    // Mobile stacks columns vertically (see .posts-grid { flex-direction: column }
    // in style.css), so a single chronological column keeps the feed in date order.
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      const col = document.createElement('div');
      col.className = 'posts-col';
      grid.appendChild(col);
      items.forEach((item) => {
        const card = createItemCard(item);
        if (card) col.appendChild(card);
      });
      return;
    }

    const col0 = document.createElement('div');
    const col1 = document.createElement('div');
    col0.className = 'posts-col';
    col1.className = 'posts-col';
    grid.appendChild(col0);
    grid.appendChild(col1);

    items.forEach((item) => {
      const card = createItemCard(item);
      if (!card) return;
      (col0.scrollHeight <= col1.scrollHeight ? col0 : col1).appendChild(card);
    });
  }

  Promise.all([
    fetch('/data/works.json').then(r => r.json()),
    fetch('/data/blog.json').then(r => r.json()),
  ]).then(([works, posts]) => {
    const filteredWorks = works.filter(w => !w.hidden);
    let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    buildGrid(filteredWorks, posts);

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const nowMobile = window.innerWidth <= MOBILE_BREAKPOINT;
        if (nowMobile !== isMobile) {
          isMobile = nowMobile;
          buildGrid(filteredWorks, posts);
        }
      }, 150);
    });

    window.addEventListener(window.Temperature.EVENT_NAME, () => buildGrid(filteredWorks, posts));
  });
})();
