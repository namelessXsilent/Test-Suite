// Design Grid Overlay: the bookmarklet's code, and the page wiring that turns
// it into a draggable bookmarklet link.
//
// qaGridOverlay() is copied into the bookmarklet as text, so it must be fully
// self-contained: no outside variables, block comments only (a bookmark may
// lose its line breaks), no template literals, and a semicolon after every
// statement.
function qaGridOverlay() {
  var KEY = '__qaGridOverlay';
  if (window[KEY]) { window[KEY].remove(); return; }

  /* Responsive defaults used in Auto mode: [min width, columns, gutter, margin, max width]. */
  var AUTO = [[0, 4, 16, 16, 0], [600, 8, 24, 32, 0], [1024, 12, 24, 32, 1280]];
  var s = { baseline: true, step: 8, offset: 0, columns: true, mode: 'auto', cols: 12, gutter: 24, margin: 32, maxw: 1280, opacity: 60 };

  var host = document.createElement('div');
  host.setAttribute('data-qa-grid-overlay', '');
  host.style.cssText = 'all:initial;position:absolute;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none;';
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  var css = document.createElement('style');
  css.textContent =
    '*{box-sizing:border-box;}' +
    '.base{position:absolute;top:0;left:0;pointer-events:none;}' +
    '.cols{position:fixed;top:0;left:0;height:100vh;pointer-events:none;}' +
    '.wrap{height:100%;margin:0 auto;display:grid;}' +
    '.col{height:100%;background:rgba(255,77,77,.14);border-left:1px solid rgba(255,77,77,.55);border-right:1px solid rgba(255,77,77,.55);}' +
    '.panel{position:fixed;right:16px;bottom:16px;width:290px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);overflow:auto;' +
    'padding:12px 14px;border-radius:10px;background:rgba(12,14,20,.96);color:#eef1f7;' +
    'font:13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:auto;}' +
    '.panel b{font-weight:700;}' +
    '.panel .read{display:block;margin:4px 0 8px;color:#a6adbf;font-size:12px;}' +
    '.panel fieldset{border:1px solid #2a2f40;border-radius:8px;margin:0 0 8px;padding:6px 8px 8px;}' +
    '.panel legend{padding:0 4px;font-weight:700;}' +
    '.panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:5px;font-size:12px;color:#c9cedb;}' +
    '.panel label.chk{justify-content:flex-start;color:#eef1f7;font-size:13px;}' +
    '.panel input[type=number]{width:72px;padding:3px 6px;border-radius:6px;border:1px solid #2a2f40;background:#171a24;color:#eef1f7;font:inherit;}' +
    '.panel input[type=range]{width:120px;}' +
    '.panel input:focus-visible,.panel select:focus-visible,.panel button:focus-visible{outline:2px solid #8b9dff;outline-offset:2px;}' +
    '.panel select{padding:3px 6px;border-radius:6px;border:1px solid #2a2f40;background:#171a24;color:#eef1f7;font:inherit;}' +
    '.panel .custom[hidden]{display:none;}' +
    '.panel .hint{display:block;color:#a6adbf;font-size:12px;}' +
    '.panel .x{position:absolute;top:6px;right:8px;border:0;background:none;color:#a6adbf;font:20px/1 system-ui,sans-serif;cursor:pointer;}' +
    '.panel .min{position:absolute;top:8px;right:34px;border:0;background:none;color:#a6adbf;font:12px/1 system-ui,sans-serif;cursor:pointer;text-decoration:underline;}' +
    '.panel.small .body{display:none;}';
  root.appendChild(css);

  var base = document.createElement('div');
  base.className = 'base';
  var cols = document.createElement('div');
  cols.className = 'cols';
  var wrap = document.createElement('div');
  wrap.className = 'wrap';
  cols.appendChild(wrap);
  root.appendChild(base);
  root.appendChild(cols);

  /* ── Control panel ──────────────────────────────────────────────── */
  var panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML =
    '<b>Design Grid Overlay</b>' +
    '<button type="button" class="min" aria-expanded="true">Hide controls</button>' +
    '<button type="button" class="x" aria-label="Hide grid overlay">&times;</button>' +
    '<span class="read" role="status"></span>' +
    '<div class="body">' +
    '<fieldset><legend>Baseline grid</legend>' +
    '<label class="chk"><input type="checkbox" data-k="baseline"> Show baseline grid</label>' +
    '<label>Step (px) <input type="number" min="2" max="64" data-k="step"></label>' +
    '<label>Start at (px from top) <input type="number" min="0" max="2000" data-k="offset"></label>' +
    '</fieldset>' +
    '<fieldset><legend>Columns</legend>' +
    '<label class="chk"><input type="checkbox" data-k="columns"> Show columns</label>' +
    '<label>Layout <select data-k="mode"><option value="auto">Auto (responsive)</option><option value="custom">Custom</option></select></label>' +
    '<div class="custom">' +
    '<label>Columns <input type="number" min="1" max="24" data-k="cols"></label>' +
    '<label>Gutter (px) <input type="number" min="0" max="200" data-k="gutter"></label>' +
    '<label>Side margin (px) <input type="number" min="0" max="400" data-k="margin"></label>' +
    '<label>Max width (px, 0 = none) <input type="number" min="0" max="4000" data-k="maxw"></label>' +
    '</div>' +
    '</fieldset>' +
    '<label>Opacity <input type="range" min="10" max="100" data-k="opacity"></label>' +
    '<span class="hint">Click the bookmarklet again to hide.</span>' +
    '</div>';
  root.appendChild(panel);

  var fields = panel.querySelectorAll('[data-k]');
  function syncFields() {
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i], k = f.getAttribute('data-k');
      if (f.type === 'checkbox') f.checked = s[k]; else f.value = s[k];
    }
    panel.querySelector('.custom').hidden = s.mode !== 'custom';
  }
  function onField(e) {
    var f = e.target, k = f.getAttribute('data-k');
    if (!k) return;
    if (f.type === 'checkbox') s[k] = f.checked;
    else if (f.tagName === 'SELECT') s[k] = f.value;
    else { var n = parseInt(f.value, 10); if (isNaN(n)) return; s[k] = Math.max(Number(f.min || 0), Math.min(Number(f.max || 9999), n)); }
    panel.querySelector('.custom').hidden = s.mode !== 'custom';
    draw();
  }
  panel.addEventListener('input', onField);
  panel.addEventListener('change', onField);
  /* Keep typing in the panel from triggering the site's own keyboard shortcuts. */
  panel.addEventListener('keydown', function (e) { e.stopPropagation(); });
  panel.addEventListener('keyup', function (e) { e.stopPropagation(); });
  panel.querySelector('.min').addEventListener('click', function () {
    var small = panel.classList.toggle('small');
    this.textContent = small ? 'Show controls' : 'Hide controls';
    this.setAttribute('aria-expanded', String(!small));
  });

  /* ── Drawing ────────────────────────────────────────────────────── */
  function layout(vw) {
    if (s.mode === 'custom') return { name: 'Custom', cols: s.cols, gutter: s.gutter, margin: s.margin, maxw: s.maxw };
    var pick = AUTO[0];
    for (var i = 0; i < AUTO.length; i++) if (vw >= AUTO[i][0]) pick = AUTO[i];
    var name = pick[1] === 4 ? 'Phone' : pick[1] === 8 ? 'Tablet' : 'Desktop';
    return { name: name, cols: pick[1], gutter: pick[2], margin: pick[3], maxw: pick[4] };
  }
  var frame = 0;
  function draw() {
    frame = 0;
    var de = document.documentElement;
    var vw = de.clientWidth;
    var alpha = s.opacity / 100;

    /* Measure the page without our own layer, so it can still shrink. */
    base.style.height = '0';
    base.style.display = s.baseline ? '' : 'none';
    base.style.width = vw + 'px';
    base.style.height = Math.max(de.scrollHeight, window.innerHeight) + 'px';
    base.style.opacity = String(alpha);
    var step = s.step;
    var major = step * 4;
    base.style.backgroundImage =
      'repeating-linear-gradient(to bottom, rgba(56,189,248,.75) 0, rgba(56,189,248,.75) 1px, transparent 1px, transparent ' + major + 'px),' +
      'repeating-linear-gradient(to bottom, rgba(56,189,248,.35) 0, rgba(56,189,248,.35) 1px, transparent 1px, transparent ' + step + 'px)';
    base.style.backgroundPosition = '0 ' + s.offset + 'px';
    base.style.top = '0';

    var L = layout(vw);
    cols.style.display = s.columns ? '' : 'none';
    cols.style.width = vw + 'px';
    cols.style.opacity = String(alpha);
    var inner = vw - 2 * L.margin;
    if (L.maxw && L.maxw < inner) inner = L.maxw;
    wrap.style.width = Math.max(0, inner) + 'px';
    wrap.style.gridTemplateColumns = 'repeat(' + L.cols + ', 1fr)';
    wrap.style.columnGap = L.gutter + 'px';
    if (wrap.children.length !== L.cols) {
      wrap.innerHTML = '';
      for (var i = 0; i < L.cols; i++) { var c = document.createElement('div'); c.className = 'col'; wrap.appendChild(c); }
    }

    var colW = (Math.max(0, inner) - L.gutter * (L.cols - 1)) / L.cols;
    panel.querySelector('.read').textContent =
      'Viewport ' + vw + ' px · ' + L.name + ': ' + L.cols + ' columns, ' + L.gutter + ' px gutter, ' +
      (L.maxw && L.maxw < vw - 2 * L.margin ? Math.round(inner) + ' px content width' : L.margin + ' px margins') +
      ' · column ' + (Math.round(colW * 10) / 10) + ' px';
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  window.addEventListener('resize', schedule);
  var ro = window.ResizeObserver ? new ResizeObserver(schedule) : null;
  if (ro) ro.observe(document.documentElement);

  function remove() {
    window.removeEventListener('resize', schedule);
    if (ro) ro.disconnect();
    if (frame) cancelAnimationFrame(frame);
    host.remove();
    delete window[KEY];
  }
  panel.querySelector('.x').addEventListener('click', remove);

  (document.body || document.documentElement).appendChild(host);
  syncFields();
  draw();
  window[KEY] = { remove: remove };
}

// ── Page wiring ──────────────────────────────────────────────────────
(function () {
  "use strict";
  const link = document.getElementById('grid-bookmarklet');
  if (!link) return;

  // Collapse the function onto one line so the bookmark works even if a
  // browser strips line breaks from it.
  const code = '(' + qaGridOverlay.toString().replace(/\s*\n\s*/g, ' ') + ')();void 0';
  link.href = 'javascript:' + encodeURIComponent(code);

  // Clicking the link (instead of dragging it) runs the overlay on this page.
  link.addEventListener('click', e => { e.preventDefault(); qaGridOverlay(); });
  const tryBtn = document.getElementById('grid-try');
  if (tryBtn) tryBtn.addEventListener('click', () => qaGridOverlay());
})();
