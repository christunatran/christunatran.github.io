/**
 * script.js
 *
 * Shared behaviours that run on every page:
 *   1. Custom scrollbar
 *   2. Side-panel live time + temperature
 *   3. Swimming fish (desktop only)
 *   4. Active nav-link highlighting
 *
 * Load order (all deferred): components.js → script.js → page-specific js.
 * components.js injects the nav and side panel before this script runs,
 * so getElementById calls for side-time, side-temp, and nav links succeed.
 */

// ============================================================
// CUSTOM SCROLLBAR
// ============================================================

(function () {
  'use strict';

  const track = document.createElement('div');
  track.id    = 'custom-scrollbar';

  const thumb = document.createElement('div');
  thumb.id    = 'scrollbar-thumb';

  track.appendChild(thumb);
  document.body.appendChild(track);

  function updateThumb() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const trackH    = track.offsetHeight;
    const thumbH    = Math.max(30, (winHeight / docHeight) * trackH);
    const maxScroll = docHeight - winHeight;
    const thumbTop  = maxScroll > 0 ? (scrollTop / maxScroll) * (trackH - thumbH) : 0;
    thumb.style.height = thumbH + 'px';
    thumb.style.top    = thumbTop + 'px';
  }

  window.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  updateThumb();

  // Click track to jump
  track.addEventListener('click', e => {
    if (e.target === thumb) return;
    const rect  = track.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    window.scrollTo({
      top:      ratio * (document.documentElement.scrollHeight - window.innerHeight),
      behavior: 'smooth',
    });
  });

  // Drag thumb
  let dragging = false, startY = 0, startScroll = 0;

  thumb.addEventListener('mousedown', e => {
    dragging    = true;
    startY      = e.clientY;
    startScroll = window.scrollY;
    thumb.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const delta = (e.clientY - startY) / track.offsetHeight
      * (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, startScroll + delta);
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
    thumb.classList.remove('dragging');
  });
})();

// ============================================================
// SIDE PANEL — live time + temperature
// ============================================================

function updateTime() {
  const el = document.getElementById('side-time');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   true,
  });
}

async function updateTemp() {
  const el = document.getElementById('side-temp');
  if (!el) return;
  try {
    const res  = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=40.6782&longitude=-73.9442&current=temperature_2m&temperature_unit=fahrenheit&forecast_days=1'
    );
    const data = await res.json();
    el.textContent = Math.round(data.current.temperature_2m) + '°f';
  } catch {
    el.textContent = '--°f';
  }
}

updateTime();
setInterval(updateTime, 1_000);

updateTemp();
setInterval(updateTemp, 10 * 60 * 1_000);

// ============================================================
// SWIMMING FISH
// ============================================================

(function () {
  'use strict';

  if (window.innerWidth <= 768) return;

  const FISH      = { right: ">)))'>", left: "<'(((<" };
  const COUNT     = 10;
  const MAX_SPEED = 2.2;
  const STEER     = 0.06;
  const SEPARATION = 55;
  const REPEL     = 0.15;

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  const fish = Array.from({ length: COUNT }, () => ({
    x:  Math.random() * window.innerWidth,
    y:  Math.random() * window.innerHeight,
    dx: (Math.random() - 0.5) * 2,
    dy: (Math.random() - 0.5) * 1,
  }));

  const NYANS = [
    '/assets/nyan tunas/fish 1.png',
    '/assets/nyan tunas/fish 2.png',
    '/assets/nyan tunas/fish 3.png',
    '/assets/nyan tunas/fish 4.png',
  ];
  const useNyan = Math.random() < 0.5;

  const els = fish.map(() => {
    let el;
    if (useNyan) {
      el       = document.createElement('img');
      el.src   = NYANS[Math.floor(Math.random() * NYANS.length)];
      el.style.cssText = 'position:fixed;width:40px;height:auto;pointer-events:none;z-index:1;opacity:0.7;user-select:none;';
      el._isImg = true;
    } else {
      el             = document.createElement('span');
      el.style.cssText = 'position:fixed;font-family:monospace;font-size:13px;pointer-events:none;z-index:1;opacity:0.3;white-space:nowrap;user-select:none;';
      el.textContent = FISH.right;
      el._isImg      = false;
    }
    document.body.appendChild(el);
    return el;
  });

  function tick() {
    fish.forEach((f, i) => {
      // Steer toward cursor
      const tdx  = mouse.x - f.x;
      const tdy  = mouse.y - f.y;
      const dist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (dist > 5) {
        f.dx += (tdx / dist) * STEER;
        f.dy += (tdy / dist) * STEER;
      }

      // Separate from other fish
      fish.forEach((other, j) => {
        if (j === i) return;
        const sx = f.x - other.x;
        const sy = f.y - other.y;
        const d  = Math.sqrt(sx * sx + sy * sy);
        if (d < SEPARATION && d > 0) {
          const force = (SEPARATION - d) / SEPARATION * REPEL;
          f.dx += (sx / d) * force;
          f.dy += (sy / d) * force;
        }
      });

      // Clamp speed
      const speed = Math.sqrt(f.dx * f.dx + f.dy * f.dy);
      if (speed > MAX_SPEED) {
        f.dx = (f.dx / speed) * MAX_SPEED;
        f.dy = (f.dy / speed) * MAX_SPEED;
      }

      f.x += f.dx;
      f.y += f.dy;

      const el = els[i];
      if (el._isImg) {
        el.style.transform = f.dx >= 0 ? 'scaleX(1)' : 'scaleX(-1)';
      } else {
        el.textContent = f.dx >= 0 ? FISH.right : FISH.left;
      }
      el.style.left = f.x + 'px';
      el.style.top  = f.y + 'px';
    });
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

// ============================================================
// ACTIVE NAV LINK
// ============================================================

// Runs after components.js has injected the nav links (both are deferred
// and DOMContentLoaded fires after all deferred scripts complete).
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const isHome    = href === '/' && (path === '/' || path === '');
    const isSection = href !== '/' && (
      path === href || path === href + '/' || path.startsWith(href + '/')
    );

    if (isHome || isSection) link.classList.add('active');
  });
});
