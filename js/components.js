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
    { href: '/now',   label: 'now'   },
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
        <p>location: brooklyn, nyc</p>
        <p>time: <span id="side-time">--:--</span></p>
        <p>temperature: <span id="side-temp">--</span></p>
      </div>
    `;
  }

  injectFavicon();
  injectNav();
  injectSidePanel();
})();
