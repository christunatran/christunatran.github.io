/**
 * works-listing.js — masonry grid for the works page.
 *
 * Uses the same absolute-position masonry approach as home.js:
 * measure actual card heights after images decode, then greedily
 * place each card into the shorter column.
 */

(function () {
  'use strict';

  const GAP = 20;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function normalizeDate(d) {
    return d.split('.').map((p, i) => i === 0 ? p : p.padStart(2, '0')).join('.');
  }

  function masonry(grid, cards) {
    if (window.innerWidth <= 768) return;

    const w = grid.clientWidth;
    if (!w) return;
    const colW = Math.floor((w - GAP) / 2);

    cards.forEach(c => {
      c.style.position = 'absolute';
      c.style.width = colW + 'px';
      c.style.visibility = 'hidden';
    });

    void grid.offsetHeight;

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

  fetch('/data/works.json')
    .then(r => r.json())
    .then(works => {
      const grid = document.getElementById('works-grid');
      if (!grid) return;

      works.sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));

      const cards = [];
      works.forEach(work => {
        const card = document.createElement('div');
        card.className = 'work-card';
        card.innerHTML = `
          ${work.cover ? `<img class="work-cover" src="/${work.cover}" alt="${escapeHtml(work.title)}">` : ''}
          <div class="work-meta">
            <span class="work-title">${escapeHtml(work.title)}</span>
            <span class="work-subtitle">${escapeHtml(work.subtitle)}</span>
            <span class="work-date">${work.date}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `/work/?slug=${work.slug}`;
        });
        grid.appendChild(card);
        cards.push(card);
      });

      function doLayout() { masonry(grid, cards); }

      const imgs = Array.from(grid.querySelectorAll('img'));
      Promise.all(imgs.map(i => i.decode().catch(() => {}))).then(doLayout);

      const ro = new ResizeObserver(doLayout);
      imgs.forEach(i => ro.observe(i));

      window.addEventListener('resize', doLayout);
    });
})();
