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

  var user   = 'christina.tran';
  var domain = ['nyu', 'edu'].join('.');
  var at     = String.fromCharCode(64); // "@"
  var address = user + at + domain;

  var el = document.getElementById('email-link');
  if (!el) return;

  var link = document.createElement('a');
  link.href = 'mailto:' + address;
  link.textContent = 'email';
  el.appendChild(link);
})();

(function () {
  'use strict';

  function makeCycler(elementId, words) {
    var index = 0;
    var el = document.getElementById(elementId);
    if (!el) return;

    function advance() {
      index = (index + 1) % words.length;
      el.textContent = words[index];
    }

    el.addEventListener('click', advance);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    });
  }

  makeCycler('craft-cycle', ['traditional crafts', 'woodworking', 'lantern-making', 'metal working', 'sewing and weaving']);
  makeCycler('dance-cycle', ['dancing', 'locking', 'street styles', 'hip hop', 'house', 'freestyle']);
  makeCycler('coffee-cycle', ['coffee', 'specialty coffee', 'pourover coffee', 'robusta coffee']);
  makeCycler('asia-cycle', ['the world', 'Vietnam', 'South Korea', 'Hong Kong', 'Japan', 'Thailand', 'Taiwan', 'Denmark', 'Sweden', 'Germany', 'Czech Republic', 'France', 'Belgium', 'Netherlands', 'Mexico', 'Honduras']);
  makeCycler('hci-cycle', ['HCI', 'interfaces', 'building a healthier relationship with technology']);
  makeCycler('sports-cycle', ['sports', 'weight-training', 'tennis', 'pickleball', 'spikeball']);
  makeCycler('gatherings-cycle', ['hosting gatherings', 'dinners', 'parties', 'hackathons', 'powerpoint nights', 'coworking sessions']);
})();
