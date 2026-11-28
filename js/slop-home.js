/**
 * slop-home.js — fills the Slopstrap landing page (index.html) with real
 * content: the newest works as a bento grid and the latest blog posts as
 * left-bordered glass cards. Stat counters are set from the real counts.
 *
 * Blog posts respect the temperature gate (js/temperature.js): only
 * "employable"-tier, non-disabled posts are shown here, since this page
 * has no dial to unlock the others.
 */

(function () {
  'use strict';

  const BENTO_SPANS = ['slop-bento-7', 'slop-bento-5', 'slop-bento-4', 'slop-bento-4', 'slop-bento-4', 'slop-bento-5', 'slop-bento-7'];
  const BORDERS     = ['purple', 'cyan', 'pink', 'emerald', 'amber', 'indigo', 'rose'];
  const BADGES      = ['slop-badge-ai', 'slop-badge-cyan', 'slop-badge-pink', 'slop-badge-emerald', 'slop-badge-amber'];
  const WORK_COUNT  = BENTO_SPANS.length;
  const POST_COUNT  = 6;

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // "2026.10.27" / "2026.10" → sortable number
  function dateKey(d) {
    const [y = 0, m = 0, day = 0] = String(d || '').split('.').map(Number);
    return y * 10000 + m * 100 + day;
  }

  function setStat(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('data-slop-count', String(value));
    // already animated (it was on screen before the fetch finished)
    if (el.dataset.slopCounted === 'true') el.textContent = String(value);
  }

  function renderWorks(works) {
    const grid = document.getElementById('home-works');
    if (!grid) return;
    const visible = works.filter(w => !w.disabled);
    setStat('stat-works', visible.length);

    const items = visible
      .slice()
      .sort((a, b) => dateKey(b.date) - dateKey(a.date))
      .slice(0, WORK_COUNT);

    grid.innerHTML = items.map((w, i) => {
      const beam  = i === 0 ? ' slop-card-beam' : '';
      const badge = w.comingSoon
        ? '<span class="slop-badge slop-badge-amber">🚧 COMING SOON</span>'
        : `<span class="slop-badge ${BADGES[i % BADGES.length]}">${esc(w.subtitle || 'work')}</span>`;
      return `
        <a class="slop-card${beam} slop-border-l-${BORDERS[i % BORDERS.length]} ${BENTO_SPANS[i]} home-work"
           href="/work/${esc(w.slug)}" data-index="${i}">
          <div class="home-work-cover">${window.Covers ? window.Covers.html(w, 'home-work-img') : ''}</div>
          <div class="slop-row-between">
            ${badge}
            <span class="slop-mono slop-muted" style="font-size:0.75rem">${esc(w.date)}</span>
          </div>
          <h3 class="slop-h3">${esc(w.title)}</h3>
        </a>`;
    }).join('');

    // route comingSoon works through the site's warning dialog
    grid.querySelectorAll('.home-work').forEach(card => {
      card.addEventListener('click', e => {
        if (!window.openWork) return;
        e.preventDefault();
        window.openWork(items[Number(card.dataset.index)]);
      });
    });

    if (window.Covers) window.Covers.activate(grid);
  }

  function renderPosts(posts) {
    const grid = document.getElementById('home-posts');
    if (!grid) return;
    const visible = posts.filter(p => !p.disabled);
    setStat('stat-posts', visible.length);

    const items = visible
      .filter(p => !p.temperature || p.temperature === 'employable')
      .sort((a, b) => dateKey(b.date) - dateKey(a.date))
      .slice(0, POST_COUNT);

    grid.innerHTML = items.map((p, i) => {
      const tags = (p.tags || []).slice(0, 2)
        .map(t => `<span class="slop-badge ${BADGES[(i + 1) % BADGES.length]}">${esc(t)}</span>`)
        .join(' ');
      return `
        <a class="slop-card slop-border-l-${BORDERS[(i + 2) % BORDERS.length]} home-post" href="/blog-post/${esc(p.slug)}">
          <div class="slop-row-between">
            <span class="home-post-date">${esc(p.date)}</span>
            <span class="slop-dot slop-dot-${i === 0 ? 'green' : 'purple'}"></span>
          </div>
          <h3 class="slop-h3">${esc(p.title)}</h3>
          ${p.snippet ? `<p class="slop-muted">${esc(p.snippet)}</p>` : ''}
          <div>${tags}</div>
        </a>`;
    }).join('') || '<div class="slop-card slop-muted">No posts yet — stay tuned 🚀</div>';
  }

  function fail(id, what) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="slop-card slop-border-l-rose slop-muted">⚠️ Couldn't load ${what}. Even the AI is confused.</div>`;
  }

  Promise.allSettled([
    fetch('/data/works.json').then(r => r.json()).then(renderWorks).catch(() => fail('home-works', 'works')),
    fetch('/data/blog.json').then(r => r.json()).then(renderPosts).catch(() => fail('home-posts', 'posts')),
  ]).then(() => {
    // hydrate spotlights etc. on the cards we just injected (all guarded)
    if (window.Slopstrap) window.Slopstrap.init();
  });
})();
