/**
 * temperature.js — shared "content temperature" gate.
 *
 * Blog posts carry a `temperature` field: "employable" < "personal" <
 * "shit-talk", roughly ordered by how comfortable the content is for a
 * wider audience. The visitor picks a tier with the dial (mounted on the
 * home, blog listing, and individual post pages); posts above that tier
 * stay redacted.
 *
 * The choice is stored in localStorage and broadcast via a window event
 * ("temperature:change") so every mounted listing/dial on the page can
 * react without a full reload.
 *
 * Gated snippets are never shipped in /data/blog.json (see
 * _dev/generate-blog-json.js) — they're fetched from the post's own
 * markdown file, and only once the dial has actually unlocked that tier.
 */

(function () {
  'use strict';

  const TIERS = ['employable', 'personal', 'shit-talk'];
  const STORAGE_KEY = 'tunapee-temperature';
  const EVENT_NAME = 'temperature:change';

  function tierIndex(tier) {
    const i = TIERS.indexOf(tier);
    return i === -1 ? 0 : i;
  }

  function getTier() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return TIERS.includes(stored) ? stored : TIERS[0];
    } catch {
      return TIERS[0];
    }
  }

  function setTier(tier) {
    if (!TIERS.includes(tier)) return getTier();
    try { window.localStorage.setItem(STORAGE_KEY, tier); } catch {}
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { tier } }));
    return tier;
  }

  function isUnlocked(postTemperature, currentTier) {
    const postTier = TIERS.includes(postTemperature) ? postTemperature : TIERS[0];
    return tierIndex(postTier) <= tierIndex(currentTier || getTier());
  }

  // Mirrors the snippet extraction in _dev/generate-blog-json.js exactly,
  // so a lazily-fetched snippet matches what would've been pre-generated.
  function extractSnippet(rawMarkdown) {
    const body = rawMarkdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
    const paragraphs = body.split(/\n{2,}/);
    const para = (paragraphs.find(p => {
      const t = p.trim();
      return t && !t.startsWith('![') && !t.startsWith('<video') && !t.startsWith('<img');
    }) || '')
      .replace(/[#*_`>~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return para.length > 220 ? para.slice(0, 220).trimEnd() + '…' : para;
  }

  const snippetCache = new Map();

  // Only fetches the post's markdown (and thus its content) once — used as
  // a fallback for the rare post missing a `snippet` in blog.json (the
  // listing preview isn't gated, so this runs regardless of lock state).
  // Honors an explicit `snippet:` frontmatter override (see
  // _dev/generate-blog-json.js), falling back to auto-extraction.
  function fetchSnippet(post) {
    if (snippetCache.has(post.slug)) return snippetCache.get(post.slug);
    const promise = fetch('/blog/' + encodeURIComponent(post.file))
      .then(r => r.ok ? r.text() : Promise.reject(new Error('not found')))
      .then(raw => {
        const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (fmMatch) {
          const line = fmMatch[1].split('\n').find(l => l.trim().startsWith('snippet:'));
          if (line) return line.slice(line.indexOf(':') + 1).trim();
        }
        return extractSnippet(raw);
      })
      .catch(() => '');
    snippetCache.set(post.slug, promise);
    return promise;
  }

  // ==========================================================
  // DIAL WIDGET
  // ==========================================================

  const MIN_ANGLE = -133;
  const MAX_ANGLE = 133;
  const TICK_COUNT = 25;

  const KNOB_CENTER_X = 159;
  const KNOB_CENTER_Y = 156;
  const KNOB_RADIUS = 82;
  const TICK_OUTER_RADIUS = 100;
  const POINTER_RADIUS = KNOB_RADIUS * 0.72;
  const POINTER_WIDTH = 20;
  const POINTER_HEIGHT = 11;

  const TIER_BOUNDS = [0, 100 / 3, 200 / 3, 100];
  const TIER_CENTERS = TIERS.map((_, i) => (TIER_BOUNDS[i] + TIER_BOUNDS[i + 1]) / 2);

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function valueToAngle(v) {
    return MIN_ANGLE + (clamp(v, 0, 100) / 100) * (MAX_ANGLE - MIN_ANGLE);
  }

  function angleToValue(a) {
    return ((clamp(a, MIN_ANGLE, MAX_ANGLE) - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100;
  }

  function tierIndexFromValue(v) {
    if (v < TIER_BOUNDS[1]) return 0;
    if (v < TIER_BOUNDS[2]) return 1;
    return 2;
  }

  function shortestAngleDelta(current, previous) {
    let delta = current - previous;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
  }

  function mountDial(container) {
    container.innerHTML = `
      <div class="td-stage" role="slider" aria-label="content temperature"
           aria-valuemin="0" aria-valuemax="2" tabindex="0">
        <div class="td-ticks"></div>
        <div class="td-knob"></div>
        <div class="td-indicator"></div>
        <div class="td-label"></div>
      </div>
    `;

    const stage     = container.querySelector('.td-stage');
    const ticksEl   = container.querySelector('.td-ticks');
    const indicator = container.querySelector('.td-indicator');
    const label     = container.querySelector('.td-label');

    let currentTierIdx = tierIndex(getTier());
    let angle = valueToAngle(TIER_CENTERS[currentTierIdx]);
    let dragging = false;
    let previousPointerAngle = null;

    // Skip i=0 and i=TICK_COUNT-1 — no tick mark at the very first/last position,
    // angles are still computed against the full range so the rest don't shift.
    for (let i = 1; i < TICK_COUNT - 1; i++) {
      const tick = document.createElement('div');
      tick.className = 'td-tick';
      const tickAngle = MIN_ANGLE + (i / (TICK_COUNT - 1)) * (MAX_ANGLE - MIN_ANGLE);
      tick.style.left = KNOB_CENTER_X + 'px';
      tick.style.top = KNOB_CENTER_Y + 'px';
      tick.style.transformOrigin = `50% ${TICK_OUTER_RADIUS}px`;
      tick.style.translate = `-50% -${TICK_OUTER_RADIUS}px`;
      tick.style.transform = `rotate(${tickAngle}deg)`;
      ticksEl.appendChild(tick);
    }
    const ticks = [...ticksEl.children];

    function pointerAngle(ev) {
      const rect = stage.getBoundingClientRect();
      const scaleX = rect.width / 316;
      const scaleY = rect.height / 340;
      const cx = rect.left + KNOB_CENTER_X * scaleX;
      const cy = rect.top + KNOB_CENTER_Y * scaleY;
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      return Math.atan2(dx, -dy) * 180 / Math.PI;
    }

    function render() {
      const value = angleToValue(angle);
      const liveTierIdx = tierIndexFromValue(value);

      const rad = angle * Math.PI / 180;
      const x = KNOB_CENTER_X + Math.sin(rad) * POINTER_RADIUS;
      const y = KNOB_CENTER_Y - Math.cos(rad) * POINTER_RADIUS;
      indicator.style.left = x + 'px';
      indicator.style.top = y + 'px';
      indicator.style.width = POINTER_WIDTH + 'px';
      indicator.style.height = POINTER_HEIGHT + 'px';
      indicator.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;

      const activeIndex = Math.round((value / 100) * (ticks.length - 1));
      ticks.forEach((tick, i) => tick.classList.toggle('active', i <= activeIndex));

      stage.setAttribute('aria-valuenow', liveTierIdx);
      stage.setAttribute('aria-valuetext', TIERS[liveTierIdx]);
      label.textContent = TIERS[liveTierIdx];

      return liveTierIdx;
    }

    function commit(tierIdx) {
      currentTierIdx = tierIdx;
      setTier(TIERS[tierIdx]);
    }

    function snapToCurrentTier() {
      angle = valueToAngle(TIER_CENTERS[currentTierIdx]);
      render();
    }

    function goToTier(tierIdx) {
      tierIdx = clamp(tierIdx, 0, TIERS.length - 1);
      angle = valueToAngle(TIER_CENTERS[tierIdx]);
      render();
      commit(tierIdx);
    }

    function beginDrag(ev) {
      dragging = true;
      stage.classList.add('dragging');
      stage.setPointerCapture?.(ev.pointerId);
      previousPointerAngle = pointerAngle(ev);
    }

    function moveDrag(ev) {
      if (!dragging) return;
      const currentPointerAngle = pointerAngle(ev);
      let delta = shortestAngleDelta(currentPointerAngle, previousPointerAngle);
      delta = clamp(delta, -45, 45);
      angle = clamp(angle + delta, MIN_ANGLE, MAX_ANGLE);
      previousPointerAngle = currentPointerAngle;
      const liveTierIdx = render();
      if (liveTierIdx !== currentTierIdx) commit(liveTierIdx);
    }

    function endDrag(ev) {
      if (!dragging) return;
      dragging = false;
      previousPointerAngle = null;
      stage.classList.remove('dragging');
      try { stage.releasePointerCapture?.(ev.pointerId); } catch {}
      snapToCurrentTier();
    }

    stage.addEventListener('pointerdown', beginDrag);
    stage.addEventListener('pointermove', moveDrag);
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('lostpointercapture', endDrag);

    stage.addEventListener('keydown', (ev) => {
      if (['ArrowRight', 'ArrowUp'].includes(ev.key)) { goToTier(currentTierIdx + 1); ev.preventDefault(); }
      else if (['ArrowLeft', 'ArrowDown'].includes(ev.key)) { goToTier(currentTierIdx - 1); ev.preventDefault(); }
      else if (ev.key === 'Home') { goToTier(0); ev.preventDefault(); }
      else if (ev.key === 'End') { goToTier(TIERS.length - 1); ev.preventDefault(); }
    });

    // Another dial (or programmatic change) on this same page moved the tier.
    window.addEventListener(EVENT_NAME, (ev) => {
      const idx = tierIndex(ev.detail.tier);
      if (idx === currentTierIdx) return;
      currentTierIdx = idx;
      snapToCurrentTier();
    });

    render();
  }

  function injectDial() {
    if (document.getElementById('temperature-dial')) return;
    const el = document.createElement('div');
    el.id = 'temperature-dial';
    document.body.appendChild(el);
    mountDial(el);
  }

  // Shared padlock icon markup so every locked-post placeholder matches exactly.
  const LOCK_ICON = '<svg class="temp-lock-icon" viewBox="0 0 24 24" width="10" height="10" '
    + 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="1.5">'
    + '</rect><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11"></path></svg>';

  window.Temperature = {
    TIERS, getTier, setTier, tierIndex, isUnlocked,
    extractSnippet, fetchSnippet, mountDial, EVENT_NAME, LOCK_ICON,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectDial);
  } else {
    injectDial();
  }
})();
