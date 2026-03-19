// ============================================================
// CUSTOM SCROLLBAR — positioned left of nav
// ============================================================

(function () {
  const track = document.createElement('div');
  track.id = 'custom-scrollbar';
  const thumb = document.createElement('div');
  thumb.id = 'scrollbar-thumb';
  track.appendChild(thumb);
  document.body.appendChild(track);

  function updateThumb() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight;
    const winHeight  = window.innerHeight;
    const trackH     = track.offsetHeight;
    const thumbH     = Math.max(30, (winHeight / docHeight) * trackH);
    const maxScroll  = docHeight - winHeight;
    const thumbTop   = maxScroll > 0 ? (scrollTop / maxScroll) * (trackH - thumbH) : 0;
    thumb.style.height = thumbH + 'px';
    thumb.style.top    = thumbTop + 'px';
  }

  window.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  updateThumb();

  // Click track to jump
  track.addEventListener('click', (e) => {
    if (e.target === thumb) return;
    const rect  = track.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    window.scrollTo({ top: ratio * (document.documentElement.scrollHeight - window.innerHeight), behavior: 'smooth' });
  });

  // Drag thumb
  let dragging = false, startY = 0, startScroll = 0;
  thumb.addEventListener('mousedown', (e) => {
    dragging = true;
    startY = e.clientY;
    startScroll = window.scrollY;
    thumb.classList.add('dragging');
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const delta = (e.clientY - startY) / track.offsetHeight * (docHeight - winHeight);
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
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

async function updateTemp() {
  const el = document.getElementById('side-temp');
  if (!el) return;
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=40.6782&longitude=-73.9442&current=temperature_2m&temperature_unit=fahrenheit&forecast_days=1'
    );
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    el.textContent = temp + '°f';
  } catch {
    el.textContent = '--°f';
  }
}

updateTime();
setInterval(updateTime, 1000);
updateTemp();
setInterval(updateTemp, 10 * 60 * 1000); // refresh every 10 minutes

/* ============================================================
// GLITCH HOVER — ascii art → headshot
// ============================================================

function setupGlitch() {
  const img = document.getElementById('side-art');
  if (!img) return;

  // Wrap the img so canvas can overlay it exactly
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;line-height:0;display:block;';
  img.parentNode.insertBefore(wrap, img);
  wrap.appendChild(img);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
  wrap.appendChild(canvas);

  const headshot = new Image();
  headshot.src = 'assets/my professional headshot.jpg';

  let raf;
  let progress = 0; // 0 = ascii art, 1 = headshot
  let direction = 0;

  // Draw headshot center-cropped to fill w×h (like object-fit: cover)
  function drawHeadshot(ctx, w, h, dx) {
    const iw = headshot.naturalWidth;
    const ih = headshot.naturalHeight;
    const scale = Math.max(w / iw, h / ih);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (iw - sw) / 2;
    const sy = 0;
    ctx.drawImage(headshot, sx, sy, sw, sh, dx, 0, w, h);
  }

  function draw() {
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    if (progress <= 0 && direction <= 0) return;
    if (progress >= 1 && direction >= 0) {
      drawHeadshot(ctx, w, h, 0);
      return;
    }

    // Chaos peaks in the middle of the transition
    const chaos = Math.pow(Math.sin(progress * Math.PI), 0.6);

    // --- Horizontal slice scramble ---
    const numSlices = Math.floor(8 + chaos * 40);
    const sliceH = h / numSlices;

    for (let i = 0; i < numSlices; i++) {
      const y = i * sliceH;
      const jitter = (Math.random() - 0.5) * chaos * 28;
      const useHead = Math.random() < progress + (Math.random() - 0.5) * chaos * 0.6;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, w, sliceH + 1);
      ctx.clip();
      if (useHead) drawHeadshot(ctx, w, h, jitter);
      else ctx.drawImage(img, jitter, 0, w, h);

      // RGB fringe on some slices
      if (chaos > 0.15 && Math.random() < chaos * 0.5) {
        const channel = Math.random() > 0.5 ? 'rgba(0,255,255,0.25)' : 'rgba(255,0,255,0.25)';
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = channel;
        ctx.fillRect(jitter > 0 ? -jitter : 0, y, w, sliceH);
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.restore();
    }

    // --- Static noise bursts (fast rects, not per-pixel) ---
    if (chaos > 0.1) {
      const numSpeckles = Math.floor(chaos * 180);
      for (let s = 0; s < numSpeckles; s++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        const sw = Math.random() * 6 + 1;
        const sh = Math.random() * 3 + 1;
        ctx.fillStyle = Math.random() > 0.5
          ? `rgba(255,255,255,${0.4 + Math.random() * 0.6})`
          : `rgba(0,0,0,${0.4 + Math.random() * 0.6})`;
        ctx.fillRect(sx, sy, sw, sh);
      }
    }

    // --- Advance progress ---
    const speed = direction === 1 ? 0.018 : 0.03;
    progress = Math.max(0, Math.min(1, progress + direction * speed));
    raf = requestAnimationFrame(draw);
  }

  wrap.addEventListener('mouseenter', () => {
    cancelAnimationFrame(raf);
    direction = 1;
    raf = requestAnimationFrame(draw);
  });

  wrap.addEventListener('mouseleave', () => {
    cancelAnimationFrame(raf);
    direction = -1;
    raf = requestAnimationFrame(draw);
  });
}

window.addEventListener('load', setupGlitch);

*/

// ============================================================
// CLICKABLE POSTS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.post').forEach(post => {
    post.addEventListener('click', () => {
      window.location.href = post.dataset.href || 'index.html';
    });
  });
});

// ============================================================
// SWIMMING FISH
// ============================================================

(function () {
  const FISH = { right: ">)))'>" , left: "<'(((<" };
  const COUNT = 10;
  const MAX_SPEED = 2.2;
  const STEER = 0.06;
  const SEPARATION = 55;
  const REPEL = 0.15;

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  const fish = Array.from({ length: COUNT }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    dx: (Math.random() - 0.5) * 2,
    dy: (Math.random() - 0.5) * 1,
  }));

  const NYANS = ['assets/nyan tunas/fish 1.png','assets/nyan tunas/fish 2.png','assets/nyan tunas/fish 3.png','assets/nyan tunas/fish 4.png'];
  const useNyan = Math.random() < 0.5;

  const els = fish.map(_f => {
    let el;
    if (useNyan) {
      el = document.createElement('img');
      el.src = NYANS[Math.floor(Math.random() * NYANS.length)];
      el.style.cssText = 'position:fixed;width:40px;height:auto;pointer-events:none;z-index:1;opacity:0.7;user-select:none;';
      el._isImg = true;
    } else {
      el = document.createElement('span');
      el.style.cssText = 'position:fixed;font-family:monospace;font-size:13px;pointer-events:none;z-index:1;opacity:0.3;white-space:nowrap;user-select:none;';
      el.textContent = FISH.right;
      el._isImg = false;
    }
    document.body.appendChild(el);
    return el;
  });

  function tick() {
    fish.forEach((f, i) => {
      const tdx = mouse.x - f.x;
      const tdy = mouse.y - f.y;
      const dist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (dist > 5) {
        f.dx += (tdx / dist) * STEER;
        f.dy += (tdy / dist) * STEER;
      }

      // Separation from other fish
      fish.forEach((other, j) => {
        if (j === i) return;
        const sx = f.x - other.x;
        const sy = f.y - other.y;
        const d = Math.sqrt(sx * sx + sy * sy);
        if (d < SEPARATION && d > 0) {
          const force = (SEPARATION - d) / SEPARATION * REPEL;
          f.dx += (sx / d) * force;
          f.dy += (sy / d) * force;
        }
      });

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

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPage = href.split('/').pop();
    if (linkPage === page || (page === '' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });
});
