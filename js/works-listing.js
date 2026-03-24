/**
 * works-listing.js
 *
 * Fetches works.json and renders the works gallery grid.
 * Uses greedy estimated-height balancing (same pattern as home.js)
 * to avoid the row-alignment gaps that CSS grid creates with
 * variable-height cards.
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

      const colLeft  = document.createElement('div');
      const colRight = document.createElement('div');
      colLeft.className  = 'works-col';
      colRight.className = 'works-col';
      grid.appendChild(colLeft);
      grid.appendChild(colRight);

      // Estimated card height: cover image (~240px) + meta section (~80px)
      const EST_WITH_COVER    = 320;
      const EST_WITHOUT_COVER = 80;

      let heightLeft = 0, heightRight = 0;

      works.forEach(work => {
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

        const est = work.cover ? EST_WITH_COVER : EST_WITHOUT_COVER;
        if (heightLeft <= heightRight) {
          colLeft.appendChild(card);
          heightLeft += est;
        } else {
          colRight.appendChild(card);
          heightRight += est;
        }
      });
    });
})();
