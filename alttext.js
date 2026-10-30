// Alt Text Overlay: the bookmarklet's code, and the page wiring that turns it
// into a draggable bookmarklet link.
//
// qaAltTextOverlay() is copied into the bookmarklet as text, so it must be fully
// self-contained: no outside variables, block comments only (a bookmark may lose
// its line breaks) and a semicolon after every statement.
function qaAltTextOverlay() {
  var KEY = '__qaAltTextOverlay';
  if (window[KEY]) { window[KEY].remove(); return; }

  var COLORS = { ok: '#4ade80', missing: '#ff6b6b', deco: '#facc15' };

  /* Shadow DOM keeps the page's CSS away from our labels. */
  var host = document.createElement('div');
  host.setAttribute('data-qa-alt-overlay', '');
  host.style.cssText = 'all:initial;position:absolute;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  var css = document.createElement('style');
  css.textContent =
    '.box{position:absolute;box-sizing:border-box;border:2px solid currentColor;pointer-events:none;}' +
    '.lbl{position:absolute;box-sizing:border-box;padding:4px 7px;max-width:640px;background:rgba(12,14,20,.9);' +
    'font:12px/1.45 Consolas,"Courier New",monospace;white-space:normal;overflow-wrap:anywhere;text-align:left;pointer-events:none;}' +
    '.panel{position:fixed;right:16px;bottom:16px;box-sizing:border-box;max-width:320px;padding:12px 14px;border-radius:10px;' +
    'background:rgba(12,14,20,.95);color:#eef1f7;font:13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:auto;}' +
    '.panel b{font-weight:700;}.panel .row{display:block;}' +
    '.panel .hint{display:block;margin-top:6px;color:#a6adbf;font-size:12px;}' +
    '.panel button{position:absolute;top:6px;right:8px;border:0;background:none;color:#a6adbf;font:20px/1 system-ui,sans-serif;cursor:pointer;}' +
    '.panel button:focus-visible{outline:2px solid #8b9dff;outline-offset:2px;}';
  root.appendChild(css);

  function hiddenBy(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.getAttribute('aria-hidden') === 'true') return n === el ? 'aria-hidden="true"' : 'aria-hidden on a parent';
    }
    return '';
  }

  /* Decide what a screen reader would get for this image. */
  function classify(el) {
    var hidden = hiddenBy(el);
    if (hidden) return { kind: 'deco', text: 'No alt text needed (hidden from screen readers: ' + hidden + ')' };
    var ids = el.getAttribute('aria-labelledby');
    if (ids) {
      var parts = ids.split(/\s+/).map(function (id) {
        var ref = document.getElementById(id);
        return ref ? ref.textContent.trim() : '';
      }).filter(Boolean);
      if (parts.length) return { kind: 'ok', text: 'Accessible name (aria-labelledby): ' + parts.join(' ') };
    }
    var label = (el.getAttribute('aria-label') || '').trim();
    if (label) return { kind: 'ok', text: 'Accessible name (aria-label): ' + label };

    var role = (el.getAttribute('role') || '').toLowerCase();
    if (role === 'presentation' || role === 'none') return { kind: 'deco', text: 'No alt text needed (marked decorative: role="' + role + '")' };

    if (el.hasAttribute('alt')) {
      var alt = el.getAttribute('alt');
      if (alt.trim() === '') return { kind: 'deco', text: 'No alt text needed (marked decorative: alt="")' };
      return { kind: 'ok', text: 'Alt text: ' + alt };
    }
    var svgTitle = el.tagName.toLowerCase() === 'svg' ? el.querySelector('title') : null;
    if (svgTitle && svgTitle.textContent.trim()) return { kind: 'ok', text: 'Accessible name (SVG title): ' + svgTitle.textContent.trim() };
    var title = (el.getAttribute('title') || '').trim();
    if (title) return { kind: 'ok', text: 'Accessible name (title only): ' + title };
    return { kind: 'missing', text: 'Missing alt text' };
  }

  var items = [];
  var counts = { ok: 0, missing: 0, deco: 0 };
  var els = document.querySelectorAll('img, input[type="image"], [role="img"]');
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) continue;
    var info = classify(el);
    counts[info.kind]++;
    var box = document.createElement('div');
    box.className = 'box';
    box.style.color = COLORS[info.kind];
    var lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.style.color = COLORS[info.kind];
    lbl.textContent = info.text;
    root.appendChild(box);
    root.appendChild(lbl);
    items.push({ el: el, box: box, lbl: lbl });
  }

  var panel = document.createElement('div');
  panel.className = 'panel';
  panel.setAttribute('role', 'status');
  var total = counts.ok + counts.missing + counts.deco;
  panel.innerHTML = '<b>Alt Text Overlay</b>' +
    '<span class="row" style="color:' + COLORS.ok + '">' + counts.ok + ' with alt text</span>' +
    '<span class="row" style="color:' + COLORS.missing + '">' + counts.missing + ' missing alt text</span>' +
    '<span class="row" style="color:' + COLORS.deco + '">' + counts.deco + ' marked decorative</span>' +
    (total ? '' : '<span class="row">No visible images found on this page.</span>') +
    '<span class="hint">Click the bookmarklet again to hide.</span>' +
    '<button type="button" aria-label="Hide alt text overlay">&times;</button>';
  root.appendChild(panel);

  /* Keep each label on top of its image as the page scrolls or resizes. */
  var frame = 0;
  function place() {
    frame = 0;
    var sx = window.pageXOffset, sy = window.pageYOffset;
    var maxW = document.documentElement.clientWidth;
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var b = it.el.getBoundingClientRect();
      var show = b.width >= 3 && b.height >= 3;
      it.box.style.display = it.lbl.style.display = show ? '' : 'none';
      if (!show) continue;
      it.box.style.left = (b.left + sx) + 'px';
      it.box.style.top = (b.top + sy) + 'px';
      it.box.style.width = b.width + 'px';
      it.box.style.height = b.height + 'px';
      var w = Math.min(Math.max(b.width, 220), 640, maxW);
      var left = Math.max(0, Math.min(b.left, maxW - w));
      it.lbl.style.left = (left + sx) + 'px';
      it.lbl.style.top = (b.top + sy) + 'px';
      it.lbl.style.width = w + 'px';
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(place); }
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  var ro = window.ResizeObserver ? new ResizeObserver(schedule) : null;
  if (ro) { for (var k = 0; k < items.length; k++) ro.observe(items[k].el); }

  function remove() {
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('load', schedule);
    if (ro) ro.disconnect();
    if (frame) cancelAnimationFrame(frame);
    host.remove();
    delete window[KEY];
  }
  panel.querySelector('button').addEventListener('click', remove);

  (document.body || document.documentElement).appendChild(host);
  place();
  window[KEY] = { remove: remove };
}

// ── Page wiring ──────────────────────────────────────────────────────
(function () {
  "use strict";
  const link = document.getElementById('alt-bookmarklet');
  if (!link) return;

  // Collapse the function onto one line so the bookmark works even if a
  // browser strips line breaks from it.
  const code = '(' + qaAltTextOverlay.toString().replace(/\s*\n\s*/g, ' ') + ')();void 0';
  link.href = 'javascript:' + encodeURIComponent(code);

  // Clicking the link (instead of dragging it) runs the overlay on this page.
  link.addEventListener('click', e => { e.preventDefault(); qaAltTextOverlay(); });
  const tryBtn = document.getElementById('alt-try');
  if (tryBtn) tryBtn.addEventListener('click', () => qaAltTextOverlay());
})();
