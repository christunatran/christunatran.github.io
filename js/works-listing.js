/**
 * works-listing.js
 *
 * Fetches works.json and renders the works gallery grid.
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

  function normalizeDate(d) {
    return d.split('.').map((p, i) => i === 0 ? p : p.padStart(2, '0')).join('.');
  }

  fetch('/data/works.json')
    .then(r => r.json())
    .then(works => {
      const grid = document.getElementById('works-grid');
      if (!grid) return;

      works.sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));

      // Two explicit columns, alternating left/right so works fill newest-first
      // left-to-right rather than top-to-bottom via CSS column-count.
      const colLeft  = document.createElement('div');
      const colRight = document.createElement('div');
      colLeft.className  = 'works-col';
      colRight.className = 'works-col';
      grid.appendChild(colLeft);
      grid.appendChild(colRight);

      works.forEach((work, i) => {
        const card = document.createElement('div');
        card.className = 'work-card';
        card.innerHTML = `
          ${work.cover ? `<img class="work-cover" src="/${work.cover}" alt="${escapeHtml(work.title)}" loading="lazy">` : ''}
          <div class="work-meta">
            <span class="work-title">${escapeHtml(work.title)}</span>
            <span class="work-subtitle">${escapeHtml(work.subtitle)}</span>
            <span class="work-date">${work.date}</span>
          </div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `/work/?slug=${work.slug}`;
        });
        (i % 2 === 0 ? colLeft : colRight).appendChild(card);
      });
    });
})();
