/**
 * work-detail.js
 *
 * Fetches and renders an individual work project from its markdown file.
 * Reads ?slug= from the URL to find the project under /works/<slug>/index.md.
 *
 * Dependencies (loaded via CDN before this script):
 *   - marked.js  — markdown → HTML
 *   - GLightbox  — image lightbox
 */

(function () {
  'use strict';

  const slug      = new URLSearchParams(window.location.search).get('slug');
  const contentEl = document.getElementById('work-content');

  if (!slug) {
    contentEl.innerHTML = '<p>no work specified.</p>';
    return;
  }

  fetch(`/works/${slug}/index.md`)
    .then(r => {
      if (!r.ok) throw new Error('not found');
      return r.text();
    })
    .then(md => {
      // Rewrite relative asset paths to root-relative so they resolve correctly
      // regardless of the URL the page is served from.
      md = md.replace(/\((?!https?:\/\/)(assets\/[^)]+)\)/g, `(/works/${slug}/$1)`);

      contentEl.innerHTML = marked.parse(md);

      replaceVideoLinksWithElements(contentEl);
      autoGridConsecutiveImages(contentEl);
      initLightbox(contentEl);
      initInstagramEmbeds(contentEl);
      updatePageTitle(contentEl);
    })
    .catch(() => {
      contentEl.innerHTML = '<p>work not found.</p>';
    });

  /**
   * Converts <a> and <img> elements pointing at video files (.mov, .mp4)
   * into <video> elements with controls.
   */
  function replaceVideoLinksWithElements(container) {
    container.querySelectorAll('a, img').forEach(el => {
      const src = el.tagName === 'A' ? el.href : el.src;
      if (/\.(mov|mp4|MOV|MP4)$/.test(src)) {
        const video = document.createElement('video');
        video.src      = src;
        video.controls = true;
        el.replaceWith(video);
      }
    });
  }

  /**
   * Groups runs of consecutive single-image paragraphs into CSS grid
   * wrappers (.img-grid--2/3/4) for a tighter gallery layout.
   */
  function autoGridConsecutiveImages(container) {
    const children = Array.from(container.children);
    let i = 0;

    while (i < children.length) {
      const el               = children[i];
      const isSingleImgPara  = el.tagName === 'P'
        && el.children.length === 1
        && el.children[0].tagName === 'IMG';

      if (!isSingleImgPara) { i++; continue; }

      // Collect the contiguous run of single-image paragraphs.
      const run = [el];
      let j = i + 1;
      while (j < children.length) {
        const next = children[j];
        if (next.tagName === 'P' && next.children.length === 1 && next.children[0].tagName === 'IMG') {
          run.push(next);
          j++;
        } else {
          break;
        }
      }

      if (run.length >= 2) {
        for (let k = 0; k < run.length;) {
          const chunk = run.slice(k, k + 4);
          const grid  = document.createElement('div');
          grid.className = `img-grid img-grid--${chunk.length}`;
          chunk[0].parentNode.insertBefore(grid, chunk[0]);
          chunk.forEach(p => grid.appendChild(p.children[0]));
          chunk.forEach(p => p.remove());
          k += 4;
        }
      }

      i = j;
    }
  }

  /**
   * Initialises GLightbox on all images in the container.
   */
  function initLightbox(container) {
    const images   = Array.from(container.querySelectorAll('img'));
    const elements = images.map(img => ({ href: img.src, type: 'image' }));
    const lb       = GLightbox({ elements, touchNavigation: true });

    images.forEach((img, idx) => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => lb.openAt(idx));
    });
  }

  /**
   * Activates any Instagram embed blockquotes in the container.
   * Instagram's embed.js must be loaded to transform blockquotes into iframes.
   * Since innerHTML doesn't execute <script> tags, we load it dynamically here
   * and call instgrm.Embeds.process() once it's ready.
   */
  function initInstagramEmbeds(container) {
    if (!container.querySelector('.instagram-media')) return;

    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }

    const script  = document.createElement('script');
    script.src    = '//www.instagram.com/embed.js';
    script.async  = true;
    script.onload = () => window.instgrm && window.instgrm.Embeds.process();
    document.body.appendChild(script);
  }

  function updatePageTitle(container) {
    const h1 = container.querySelector('h1');
    if (h1) document.title = `${h1.textContent.toLowerCase()} — tunapee`;
  }
})();
