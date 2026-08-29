/**
 * about.js
 *
 * Builds the mailto link at runtime instead of writing the address into
 * the HTML/JS source as a literal string. Scrapers that harvest addresses
 * by scanning static page text (or grepping deployed JS files) for an
 * "@" pattern never see one — the local part, domain, and "@" itself are
 * assembled from separate pieces only after this script runs in a browser.
 */

(function () {
  'use strict';

  var user   = 'christinatran';
  var domain = ['nyu', 'edu'].join('.');
  var at     = String.fromCharCode(64); // "@"
  var address = user + at + domain;

  var el = document.getElementById('email-link');
  if (!el) return;

  var link = document.createElement('a');
  link.href = 'mailto:' + address;
  link.textContent = address;
  el.appendChild(link);
})();
