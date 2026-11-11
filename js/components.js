/**
 * components.js
 *
 * Injects shared page chrome (navigation, side panel) into placeholder
 * elements that exist on every page. Centralising this here means a
 * single edit propagates everywhere instead of requiring updates to
 * every HTML file.
 *
 * Execution order guarantee: this script is loaded with `defer` and is
 * listed before script.js in every page's <head>, so the nav and panel
 * are in the DOM by the time script.js runs its active-nav detection.
 */

(function () {
  'use strict';

  const NAV_LINKS = [
    { href: '/',      label: 'home'  },
    { href: '/about', label: 'about' },
    { href: '/works', label: 'works' },
    { href: '/blog',  label: 'blog'  },
    { href: '/2ndbrain', label: 'brain' },
    { href: '/75',    label: '75'    },
  ];

  function injectFavicon() {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐟</text></svg>';
    document.head.appendChild(link);
  }

  function injectNav() {
    const nav = document.getElementById('fixed-nav');
    if (!nav) return;
    nav.innerHTML = NAV_LINKS
      .map(({ href, label }) =>
        `<a href="${href}" class="nav-link" data-label="${label}">${label}</a>`
      )
      .join('');
  }

  function injectSidePanel() {
    const panel = document.getElementById('side-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div id="side-art-box">
        <img id="side-art" src="/assets/ascii-art.png" alt="" aria-hidden="true">
      </div>
      <div id="side-info-box">
        <p>location: brooklyn, nyc </p>
        <p>time: <span id="side-time">--:--</span></p>
        <p>temperature: <span id="side-temp">--</span></p>
      </div>
    `;
  }

  // Hovering the ascii tuna swaps in the dithered profile picture. The
  // dithered image is square while the ascii art is taller, so the img box
  // is pinned to its current size first (and the swap fills it with
  // object-fit: cover) — otherwise the side panel would jump on hover.
  const SIDE_ART_HOVER = '/assets/tunapee-dithered.png';
  function initSideArtHover() {
    const img = document.getElementById('side-art');
    if (!img) return;
    const original = img.getAttribute('src');
    new Image().src = SIDE_ART_HOVER; // preload so the swap is instant

    img.addEventListener('mouseenter', () => {
      img.style.width  = img.offsetWidth + 'px';
      img.style.height = img.offsetHeight + 'px';
      img.classList.add('side-art--dithered');
      img.src = SIDE_ART_HOVER;
    });
    img.addEventListener('mouseleave', () => {
      img.src = original;
      img.classList.remove('side-art--dithered');
      img.style.width = img.style.height = '';
    });
  }

  injectFavicon();
  injectNav();
  injectSidePanel();
  initSideArtHover();

  // ── shared cover rendering (home + works listings) ──────────────────────
  //
  // Renders a work/post cover as an <img> — or a <video> loop for .mp4
  // covers (used where an animated gif would be too heavy). Covers load
  // lazily; the explicit aspect-ratio (coverW/coverH from works.json,
  // stamped by _dev/optimize-images.js) reserves the right amount of space
  // so the masonry layouts can position cards before anything loads.
  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── "coming soon" warning dialog (home + works listings) ────────────────
  //
  // Clicking a comingSoon work opens a notepad-style window (same look as
  // the popups in /doomscroll) instead of navigating straight there.
  // "acknowledge" continues to the work page; "go back", ×, Esc, or a
  // click on the backdrop closes it.
  const ComingSoon = (() => {
    let backdrop, win, ackBtn, pendingHref = null;

    function build() {
      backdrop = document.createElement('div');
      backdrop.className = 'np-backdrop';
      backdrop.innerHTML = `
        <div class="np-window" role="dialog" aria-modal="true" aria-labelledby="np-message">
          <div class="np-titlebar">
            <span>work in progress - Notepad</span>
            <div class="np-controls">
              <button type="button" tabindex="-1" aria-hidden="true">_</button>
              <button type="button" tabindex="-1" aria-hidden="true">□</button>
              <button type="button" class="np-close" aria-label="close">×</button>
            </div>
          </div>
          <div class="np-menubar" aria-hidden="true">
            <span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span>
          </div>
          <p class="np-body" id="np-message">this is a work in progress.<br>you can take a peek because i struggle to keep anything a secret.</p>
          <div class="np-actions">
            <button type="button" class="np-btn np-btn--primary" data-action="ack">acknowledge</button>
            <button type="button" class="np-btn" data-action="back">go back</button>
          </div>
          <div class="np-statusbar" aria-hidden="true">Ln 1, Col 1</div>
        </div>`;
      document.body.appendChild(backdrop);

      win    = backdrop.querySelector('.np-window');
      ackBtn = backdrop.querySelector('[data-action="ack"]');

      ackBtn.addEventListener('click', () => {
        const href = pendingHref;
        flash(ackBtn);
        setTimeout(() => { if (href) window.location.href = href; }, 150);
      });
      backdrop.querySelector('[data-action="back"]').addEventListener('click', close);
      backdrop.querySelector('.np-close').addEventListener('click', close);
      backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && backdrop.classList.contains('open')) close();
      });

      // drag by the titlebar, like the doomscroll notepad
      const bar = backdrop.querySelector('.np-titlebar');
      let dragging = false, ox = 0, oy = 0;
      bar.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return;
        dragging = true;
        const r = win.getBoundingClientRect();
        ox = e.clientX - r.left;
        oy = e.clientY - r.top;
        bar.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      bar.addEventListener('pointermove', e => {
        if (!dragging) return;
        win.style.left = (e.clientX - ox) + 'px';
        win.style.top  = (e.clientY - oy) + 'px';
        win.style.transform = 'none';
      });
      bar.addEventListener('pointerup', () => { dragging = false; });
    }

    function flash(btn) {
      btn.classList.remove('pressed');
      void btn.offsetWidth; // restart the animation
      btn.classList.add('pressed');
    }

    function open(href) {
      if (!backdrop) build();
      pendingHref = href;
      // re-center each time in case it was dragged last time
      win.style.left = win.style.top = win.style.transform = '';
      backdrop.classList.add('open');
      ackBtn.focus();
    }

    function close() {
      pendingHref = null;
      backdrop.classList.remove('open');
    }

    return { open };
  })();

  // Navigate to a work, routing comingSoon works through the warning dialog.
  window.openWork = function (work) {
    const href = `/work/${work.slug}`;
    if (work.comingSoon) ComingSoon.open(href);
    else window.location.href = href;
  };

  window.Covers = {
    html(item, className) {
      if (!item.cover) return '';
      const ratio = item.coverW && item.coverH
        ? ` style="aspect-ratio:${item.coverW}/${item.coverH}"`
        : '';
      // "comingSoon" works show a dithered stand-in (rendered by
      // _dev/coming-soon-covers.js) under a label — the real cover is
      // never requested.
      if (item.comingSoon && item.coverObscured) {
        const obscured = '/' + String(item.coverObscured).replace(/^\//, '');
        return `<div class="coming-soon">` +
          `<img class="${className} coming-soon-cover" src="${escapeAttr(obscured)}" alt="" loading="lazy" decoding="async"${ratio}>` +
          `<span class="coming-soon-label">coming soon</span></div>`;
      }
      // work covers are stored without a leading slash, blog covers with one
      const src   = '/' + String(item.cover).replace(/^\//, '');
      if (/\.(mp4|mov)$/i.test(src)) {
        return `<video class="${className}" src="${escapeAttr(src)}" autoplay muted loop playsinline preload="metadata"${ratio}></video>`;
      }
      return `<img class="${className}" src="${escapeAttr(src)}" alt="${escapeAttr(item.title || '')}" loading="lazy" decoding="async"${ratio}>`;
    },

    // Some browsers ignore the `muted` attribute on videos created via
    // innerHTML, which blocks autoplay — set the property directly.
    activate(container) {
      container.querySelectorAll('video').forEach(v => {
        v.muted = true;
        v.play?.().catch?.(() => {});
      });
    },
  };
})();
