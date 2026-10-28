/* ============================================================================
 * Button Contrast Checker — fully client-side.
 * OCR: Tesseract.js (CDN). Detection + WCAG evaluation ported to the browser
 * from buttons.py (no Python backend).
 *   button fill → dominant color of a ring just outside the label (its padding)
 *   page bg     → dominant color further out, plus the image corners
 *   text color  → label pixels furthest from the fill
 * ==========================================================================*/
(function () {
  "use strict";

  const PALETTE = ['#ff4d4d','#8b9dff','#3ad0b0','#f0b429','#e879f9','#38bdf8','#fb923c','#a3e635','#22d3ee','#c084fc'];
  const PX_TO_PT = 0.75, PT_TO_PX = 1 / 0.75;
  const MAX_BUTTONS = 10;
  // Minimum color distance between the fill (button padding) and the page for a
  // label to count as sitting on a real button rather than plain page copy.
  const BUTTON_MIN_DIST = 20;
  const $ = id => document.getElementById(id);

  /* ── WCAG math ──────────────────────────────────────────────────────── */
  function hexToRgb(hex) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(c => c + c).join(''); const n = parseInt(hex, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase(); }
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function luminance(r, g, b) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
  function contrastRatio(a, b) { const l1 = luminance(...a), l2 = luminance(...b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100; }
  function isValidHex(h) { return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h.trim()); }
  function normHex(h) { h = h.trim().replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return '#' + h.toUpperCase(); }
  function isLarge(px, bold) { return px >= 24 || (bold && px >= 18.67); }
  function wcagReq(px, bold) { return isLarge(px, bold) ? 3.0 : 4.5; }
  function pxToPt(px) { return Math.round(px * PX_TO_PT); }
  function ptToPx(pt) { return Math.round(pt * PT_TO_PX); }
  function rgbDistance(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
    if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return [h, mx ? d / mx : 0, mx];
  }
  function hsvToRgb(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c; let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  // Nearest color to `src` (same hue/sat, value shifted) reaching `req` against `other`.
  function findFix(srcRgb, otherRgb, req) {
    let best = null, bestD = Infinity;
    const [h, s, v] = rgbToHsv(...srcRgb);
    for (const dir of ['darken', 'lighten']) {
      for (let i = 0; i <= 200; i++) {
        const t = i / 200, nv = dir === 'darken' ? v * (1 - t) : v + (1 - v) * t;
        const f = hsvToRgb(h, s, nv), cand = [Math.round(f[0]), Math.round(f[1]), Math.round(f[2])];
        if (contrastRatio(cand, otherRgb) >= req) {
          const d = rgbDistance(cand, srcRgb);
          if (d < bestD) { bestD = d; best = rgbToHex(...cand); }
          break;
        }
      }
    }
    if (best) return best;
    for (const cand of [[0, 0, 0], [255, 255, 255]]) if (contrastRatio(cand, otherRgb) >= req) return rgbToHex(...cand);
    return null;
  }

  /* ── WCAG evaluation (ported from buttons.py evaluate) ──────────────── */
  function evaluate(textHex, buttonHex, pageHex, fontPx, bold, hasButton) {
    const text = hexToRgb(textHex), button = hexToRgb(buttonHex), page = hexToRgb(pageHex);
    const tests = [];

    const req = wcagReq(fontPx, bold);
    const r1 = contrastRatio(text, button), p1 = r1 >= req;
    tests.push({
      name: 'Button text vs. button background', sc: 'SC 1.4.3 Contrast (Minimum)',
      detail: isLarge(fontPx, bold) ? 'large text' : 'normal text',
      required_label: req + ':1', measured_label: r1 + ':1', result: p1 ? 'PASS' : 'FAIL',
      fix_hex: p1 ? null : findFix(text, button, req), fix_label: p1 ? null : 'new text color', fix_note: null,
    });

    const r2 = contrastRatio(button, page), p2 = r2 >= 3.0;
    let fix_hex = null, fix_note = null;
    if (!p2) {
      if (hasButton) fix_hex = findFix(button, page, 3.0);
      else fix_note = 'No distinct button edge was detected — set the page background manually, or add a border/fill the checker can see.';
    }
    tests.push({
      name: 'Button background vs. page background', sc: 'SC 1.4.11 Non-text Contrast', detail: 'component boundary',
      required_label: '3.0:1', measured_label: r2 + ':1', result: p2 ? 'PASS' : 'FAIL',
      fix_hex, fix_label: fix_hex ? 'new button color' : null, fix_note,
    });

    const p3 = fontPx >= 16;
    tests.push({
      name: 'Font size', sc: 'Best practice (not a WCAG requirement)',
      detail: isLarge(fontPx, bold) ? 'qualifies as large text' : null,
      required_label: '≥ 16px', measured_label: fontPx + 'px', result: p3 ? 'PASS' : 'FAIL',
      fix_hex: null, fix_label: null, fix_note: p3 ? null : 'Increase to ≥ 16px',
    });
    return tests;
  }

  /* ══════════════════════════════════════════════════════════════════════
   * Shared state
   * ════════════════════════════════════════════════════════════════════*/
  let items = [], originalItems = [];        // button entries (manual + image)
  let sourceImageData = null, naturalW = 0, naturalH = 0;
  let detected = [];                          // boxes for the annotated overlay
  let pickMode = null;

  /* ── Color detection ────────────────────────────────────────────────── */
  function samplePixels(id, x1, y1, x2, y2, step) {
    step = step || 1; const out = [], W = id.width, d = id.data;
    x1 = Math.max(0, x1 | 0); y1 = Math.max(0, y1 | 0); x2 = Math.min(W, x2 | 0); y2 = Math.min(id.height, y2 | 0);
    for (let y = y1; y < y2; y += step) for (let x = x1; x < x2; x += step) { const i = (y * W + x) * 4; out.push([d[i], d[i + 1], d[i + 2]]); }
    return out;
  }
  function dominantColor(pixels) {
    if (!pixels.length) return [255, 255, 255];
    const buckets = new Map();
    for (const [r, g, b] of pixels) {
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      let e = buckets.get(key); if (!e) { e = { n: 0, r: 0, g: 0, b: 0 }; buckets.set(key, e); }
      e.n++; e.r += r; e.g += g; e.b += b;
    }
    let best = null; for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
    return [best.r / best.n, best.g / best.n, best.b / best.n];
  }
  // Pixels in the band `pad` px wide surrounding `box` (excludes the interior).
  function ringPixels(id, box, pad, step) {
    step = step || 2; let px = [];
    px = px.concat(samplePixels(id, box.x - pad, box.y - pad, box.x + box.w + pad, box.y, step));
    px = px.concat(samplePixels(id, box.x - pad, box.y + box.h, box.x + box.w + pad, box.y + box.h + pad, step));
    px = px.concat(samplePixels(id, box.x - pad, box.y, box.x, box.y + box.h, step));
    px = px.concat(samplePixels(id, box.x + box.w, box.y, box.x + box.w + pad, box.y + box.h, step));
    return px;
  }
  function getFill(id, labelBox) {
    const pad = Math.max(4, Math.min(16, Math.round(labelBox.h * 0.6)));
    return dominantColor(ringPixels(id, labelBox, pad, 1));
  }
  function getPage(id, buttonBox) {
    const W = id.width, H = id.height;
    const pad = Math.max(16, Math.round(0.06 * Math.min(W, H)));
    let px = ringPixels(id, buttonBox, pad, 2);
    if (buttonBox.w * buttonBox.h < 0.5 * W * H) {
      const c = 30;
      px = px.concat(samplePixels(id, 0, 0, c, c), samplePixels(id, W - c, 0, W, c),
                     samplePixels(id, 0, H - c, c, H), samplePixels(id, W - c, H - c, W, H));
    }
    return dominantColor(px);
  }
  function percentile(sorted, p) { return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] : 0; }
  function getTextColor(id, labelBox, fill) {
    const fallback = luminance(...fill) > 0.5 ? [0, 0, 0] : [255, 255, 255];
    const px = samplePixels(id, labelBox.x, labelBox.y, labelBox.x + labelBox.w, labelBox.y + labelBox.h, 1);
    if (px.length < 5) return fallback;
    const dists = px.map(p => rgbDistance(p, fill));
    const sorted = dists.slice().sort((a, b) => a - b);
    let thr = percentile(sorted, 75); if (thr < 8) thr = percentile(sorted, 50); if (thr < 4) return fallback;
    const fg = px.filter((_, i) => dists[i] >= thr);
    if (fg.length < 5) return fallback;
    const cand = dominantColor(fg);
    return contrastRatio(cand, fill) <= 1.05 ? fallback : cand;
  }

  /* ── OCR (Tesseract.js) → button label candidates ──────────────────── */
  function collectWords(data) {
    if (data.words && data.words.length) return data.words;
    const words = [];
    (data.blocks || []).forEach(bl => (bl.paragraphs || []).forEach(p => (p.lines || []).forEach(l => (l.words || []).forEach(w => words.push(w)))));
    return words;
  }
  function buildLabels(words) {
    const good = words.filter(w => w.text && w.text.trim().length && w.confidence >= 50 && /[A-Za-z0-9]/.test(w.text));
    good.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);
    // Words → lines
    const lines = [];
    for (const w of good) {
      const wh = w.bbox.y1 - w.bbox.y0; let placed = false;
      for (const line of lines) {
        const ref = line[line.length - 1].bbox;
        if (Math.min(w.bbox.y1, ref.y1) - Math.max(w.bbox.y0, ref.y0) > 0.5 * Math.min(wh, ref.y1 - ref.y0)) { line.push(w); placed = true; break; }
      }
      if (!placed) lines.push([w]);
    }
    // Each line → one or more labels, split where the horizontal gap is wide
    // enough to be a separate button.
    const labels = [];
    for (const line of lines) {
      const ws = line.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      let run = [ws[0]];
      for (let k = 1; k < ws.length; k++) {
        const prev = ws[k - 1].bbox, cur = ws[k].bbox;
        const gap = cur.x0 - prev.x1, h = Math.max(prev.y1 - prev.y0, cur.y1 - cur.y0);
        if (gap > 1.2 * h) { labels.push(run); run = [ws[k]]; } else run.push(ws[k]);
      }
      labels.push(run);
    }
    return labels.map(ws => {
      const x0 = Math.min(...ws.map(w => w.bbox.x0)), y0 = Math.min(...ws.map(w => w.bbox.y0));
      const x1 = Math.max(...ws.map(w => w.bbox.x1)), y1 = Math.max(...ws.map(w => w.bbox.y1));
      const heights = ws.map(w => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
      return {
        text: ws.map(w => w.text).join(' '),
        box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 },
        fontPx: Math.round(heights[Math.floor(heights.length / 2)] * 1.4),
      };
    }).filter(l => l.text.replace(/\s/g, '').length >= 1);
  }

  /* ── Annotated overlay ──────────────────────────────────────────────── */
  function drawAnnotated() {
    const c = $('annotated-canvas'); c.width = naturalW; c.height = naturalH;
    const ctx = c.getContext('2d'); ctx.putImageData(sourceImageData, 0, 0);
    detected.forEach((f, idx) => {
      const col = PALETTE[idx % PALETTE.length];
      if (f.hasButton) { ctx.lineWidth = Math.max(2, naturalW / 500); ctx.strokeStyle = col; ctx.strokeRect(f.buttonBox.x, f.buttonBox.y, f.buttonBox.w, f.buttonBox.h); }
      const t = f.box; ctx.lineWidth = Math.max(1.5, naturalW / 700); ctx.strokeStyle = '#f0b429';
      ctx.strokeRect(t.x, t.y, t.w, t.h);
      const rad = Math.max(9, naturalW / 90), bx = (f.hasButton ? f.buttonBox.x : t.x) + rad, by = (f.hasButton ? f.buttonBox.y : t.y);
      const cy = by - rad > rad ? by - rad : by + rad;
      ctx.beginPath(); ctx.arc(bx, cy, rad, 0, 7); ctx.fillStyle = col; ctx.fill();
      ctx.fillStyle = '#0c0d12'; ctx.font = `700 ${rad * 1.1}px Segoe UI, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(idx + 1), bx, cy);
    });
  }

  /* ── Image input ────────────────────────────────────────────────────── */
  const dropZone = $('drop-zone'), fileInput = $('file-input'), runBtn = $('run-btn');
  const btnLabel = $('btn-label'), spinner = $('spinner'), errBanner = $('error-banner');
  const imageViewer = $('image-viewer'), previewCanvas = $('preview-canvas');
  const analyzing = $('analyzing'), analyzingText = $('analyzing-text'), countBadge = $('count-badge');

  function loadImage(file) {
    hideError();
    const img = new Image();
    img.onload = () => {
      naturalW = img.naturalWidth; naturalH = img.naturalHeight;
      const c = previewCanvas; c.width = naturalW; c.height = naturalH;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      sourceImageData = ctx.getImageData(0, 0, naturalW, naturalH);
      $('annotated-canvas').width = naturalW; $('annotated-canvas').height = naturalH;
      $('annotated-canvas').getContext('2d').putImageData(sourceImageData, 0, 0);
      imageViewer.style.display = 'block'; countBadge.style.display = 'none';
      // keep any manual entry, drop previous image entries
      items = items.filter(b => b.manual); originalItems = originalItems.filter(b => b.manual);
      detected = []; renderAll();
      runBtn.disabled = false;
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => showError('Could not read that image file.');
    img.src = URL.createObjectURL(file);
  }
  fileInput.addEventListener('change', e => { if (e.target.files[0]) loadImage(e.target.files[0]); });
  ['dragover', 'dragenter'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add('drag-over'); }));
  ['dragleave', 'dragend', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.remove('drag-over'); }));
  dropZone.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) loadImage(f); });
  document.addEventListener('paste', e => {
    const items2 = (e.clipboardData || window.clipboardData).items;
    for (const it of items2) if (it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) { e.preventDefault(); loadImage(f); return; } }
  });
  function showError(msg) { errBanner.textContent = '⚠ ' + msg; errBanner.classList.add('on'); }
  function hideError() { errBanner.classList.remove('on'); }

  /* ── Analyse ────────────────────────────────────────────────────────── */
  runBtn.addEventListener('click', analyse);
  async function analyse() {
    if (!sourceImageData) return;
    if (typeof Tesseract === 'undefined') { showError('OCR library failed to load — check your internet connection and reload.'); return; }
    runBtn.disabled = true; spinner.classList.add('on'); btnLabel.textContent = 'Analysing…';
    analyzing.classList.add('on'); analyzingText.textContent = 'Loading OCR engine…'; hideError();
    try {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') analyzingText.textContent = 'Detecting buttons… ' + Math.round(m.progress * 100) + '%';
          else if (m.status) analyzingText.textContent = m.status.charAt(0).toUpperCase() + m.status.slice(1) + '…';
        }
      });
      const { data } = await worker.recognize(previewCanvas, {}, { blocks: true });
      await worker.terminate();

      const labels = buildLabels(collectWords(data));
      if (!labels.length) { analyzing.classList.remove('on'); showError('No text was detected in that image.'); return; }

      // Keep only labels that sit on a distinct button fill — plain body copy,
      // whose surroundings match the page background, is not a button.
      const manual = items.find(b => b.manual);
      const imageItems = [], det = [];
      labels.forEach(l => {
        const fill = getFill(sourceImageData, l.box);
        const grow = Math.max(20, Math.round(1.2 * l.box.h));
        const buttonBox = { x: l.box.x - grow, y: l.box.y - grow, w: l.box.w + 2 * grow, h: l.box.h + 2 * grow };
        const page = getPage(sourceImageData, buttonBox);
        if (rgbDistance(fill, page) <= BUTTON_MIN_DIST) return;   // not a button — skip copy
        const text = getTextColor(sourceImageData, l.box, fill);
        const fontPx = l.fontPx;
        imageItems.push({
          manual: false, text: l.text, has_button: true, bold_auto: false,
          text_color: rgbToHex(...text), button_color: rgbToHex(...fill), page_color: rgbToHex(...page),
          font_px: fontPx, bold: false,
          tests: evaluate(rgbToHex(...text), rgbToHex(...fill), rgbToHex(...page), fontPx, false, true),
        });
        det.push({ box: l.box, buttonBox, hasButton: true });
      });

      if (!imageItems.length) {
        analyzing.classList.remove('on');
        showError('No buttons detected — the text found doesn’t sit on a distinct button fill. Try a tighter crop around the button, or use the manual checker above.');
        return;
      }
      if (imageItems.length > MAX_BUTTONS) { imageItems.length = MAX_BUTTONS; det.length = MAX_BUTTONS; }

      items = imageItems.slice(); originalItems = JSON.parse(JSON.stringify(imageItems));
      if (manual) { items.push(manual); originalItems.push(JSON.parse(JSON.stringify(manual))); }
      detected = det;

      analyzing.classList.remove('on');
      countBadge.textContent = imageItems.length + ' button' + (imageItems.length !== 1 ? 's' : '') + ' found';
      countBadge.style.display = 'inline-block';
      drawAnnotated();
      renderAll('image');
    } catch (err) {
      analyzing.classList.remove('on'); showError('Analysis failed: ' + err.message);
    } finally {
      runBtn.disabled = false; spinner.classList.remove('on'); btnLabel.textContent = '▶ Run WCAG 2.2 Tests';
    }
  }

  /* ── Rendering ──────────────────────────────────────────────────────── */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function renderAll(focus) {
    const manualCards = $('manual-cards'), imageCards = $('image-cards');
    manualCards.innerHTML = ''; imageCards.innerHTML = '';
    let mn = 0, imn = 0;
    items.forEach((b, i) => {
      const num = b.manual ? ++mn : ++imn;
      (b.manual ? manualCards : imageCards).insertAdjacentHTML('beforeend', buildCard(b, i, num));
    });
    items.forEach((_, i) => wireCard(i));
    updateSummary();
    if (focus) $(focus === 'manual' ? 'manual-results' : 'image-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function edited(i) {
    const o = originalItems[i], c = items[i];
    return o && c && (o.text_color !== c.text_color || o.button_color !== c.button_color || o.page_color !== c.page_color || o.font_px !== c.font_px || o.bold !== c.bold);
  }

  function buildCard(b, i, num) {
    const color = PALETTE[(num - 1) % PALETTE.length], ed = edited(i);
    const warn = b.has_button ? '' : '<span class="warn-chip" title="No distinct fill was found around the label">⚠ No button edge detected</span>';
    const title = b.manual ? 'Manual entry' : `Button <span class="quoted">&ldquo;${esc(b.text)}&rdquo;</span>`;
    return `<div class="card" id="card-${i}">
      <div class="btn-card-head">
        <div class="index-badge" style="background:${color}">${num}</div>
        <div class="btn-card-title">${title}</div>
        ${warn}
        <div class="head-actions">
          <button class="btn btn-ghost btn-sm" id="reset-btn-${i}" ${ed ? '' : 'disabled'}>↺ Reset</button>
        </div>
      </div>
      <div class="controls">
        ${colorGroup('text', i, 'Button text', b.text_color, !b.manual)}
        ${colorGroup('button', i, 'Button background', b.button_color, !b.manual)}
        ${colorGroup('page', i, 'Page background', b.page_color, !b.manual)}
        <div class="control-group">
          <span class="control-label">Font size</span>
          <div class="size-field">
            <input type="number" class="size-input" id="px-input-${i}" value="${b.font_px}" min="1" max="300" step="1" aria-label="Font size px">
            <span class="size-unit">px</span>
            <input type="number" class="size-input" id="pt-input-${i}" value="${pxToPt(b.font_px)}" min="1" max="300" step="1" aria-label="Font size pt">
            <span class="size-unit">pt</span>
          </div>
          <span class="size-badge ${isLarge(b.font_px, b.bold) ? 'size-badge-large' : 'size-badge-normal'}" id="size-badge-${i}">${isLarge(b.font_px, b.bold) ? '▲ Large text' : 'Normal text'}</span>
        </div>
        <div class="control-group">
          <span class="control-label">Weight</span>
          <label class="bold-toggle" id="bold-wrap-${i}"><input type="checkbox" id="bold-input-${i}" ${b.bold ? 'checked' : ''}>Bold</label>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Test</th><th>Required</th><th>Measured</th><th>Result</th><th>Suggested fix</th></tr></thead>
          <tbody id="tests-${i}">${buildRows(b.tests)}</tbody>
        </table>
      </div>
    </div>`;
  }

  function colorGroup(kind, i, label, hex, withEye) {
    const id = `${kind}-${i}`;
    const eye = withEye ? `<button class="pick-btn" id="eye-${id}" title="Eyedropper — sample from the image">⦿</button>` : '';
    return `<div class="control-group">
      <span class="control-label">${label}</span>
      <div class="color-editor">
        <span class="swatch-btn" id="sw-${id}" style="background:${hex}" title="Open color picker"><input type="color" id="pk-${id}" value="${hex}"></span>
        <input type="text" class="hex-input" id="hex-${id}" value="${hex}" maxlength="7" spellcheck="false">
        ${eye}
      </div>
    </div>`;
  }

  function buildRows(tests) {
    return tests.map(t => {
      const pass = t.result === 'PASS';
      let fix = '<span class="muted-note">✔ No change needed</span>';
      if (!pass && t.fix_hex) fix = `<div class="swatch-row"><div class="swatch" style="background:${t.fix_hex}"></div><span class="hex">${t.fix_hex}</span>${t.fix_label ? `<span class="muted-note">${esc(t.fix_label)}</span>` : ''}</div>`;
      else if (!pass && t.fix_note) fix = `<span class="muted-note">${esc(t.fix_note)}</span>`;
      else if (!pass) fix = '<span class="muted-note">No solution at this hue</span>';
      return `<tr>
        <td><span class="test-name">${esc(t.name)}</span><span class="test-sc">${esc(t.sc)}${t.detail ? ' — ' + esc(t.detail) : ''}</span></td>
        <td style="font-weight:700;font-family:monospace">${t.required_label}</td>
        <td><span class="ratio ${pass ? 'ratio-pass' : 'ratio-fail'}">${esc(t.measured_label)}</span></td>
        <td><span class="pill ${pass ? 'pill-pass' : 'pill-fail'}">${t.result}</span></td>
        <td>${fix}</td>
      </tr>`;
    }).join('');
  }

  /* ── Wiring ─────────────────────────────────────────────────────────── */
  function wireCard(i) {
    ['text', 'button', 'page'].forEach(k => wireColor(k, i));
    wireSize(i);
    const bold = $(`bold-input-${i}`);
    if (bold) bold.addEventListener('change', () => { items[i].bold = bold.checked; $(`bold-wrap-${i}`).classList.toggle('edited', bold.checked !== originalItems[i].bold); recheck(i); });
    const rst = $(`reset-btn-${i}`);
    if (rst) rst.addEventListener('click', () => { items[i] = JSON.parse(JSON.stringify(originalItems[i])); renderAll(); });
  }
  function wireColor(kind, i) {
    const field = kind + '_color';
    const sw = $(`sw-${kind}-${i}`), pk = $(`pk-${kind}-${i}`), hx = $(`hex-${kind}-${i}`), eye = $(`eye-${kind}-${i}`);
    pk.addEventListener('input', () => { const hex = pk.value.toUpperCase(); hx.value = hex; sw.style.background = hex; hx.classList.remove('invalid'); hx.classList.add('edited'); sw.classList.add('edited-swatch'); items[i][field] = hex; recheck(i); });
    hx.addEventListener('input', () => {
      const raw = hx.value.trim(); if (!raw) return;
      if (isValidHex(raw)) { const hex = normHex(raw); hx.classList.remove('invalid'); hx.classList.add('edited'); sw.style.background = hex; sw.classList.add('edited-swatch'); pk.value = hex; items[i][field] = hex; recheck(i); }
      else { hx.classList.add('invalid'); hx.classList.remove('edited'); }
    });
    hx.addEventListener('blur', () => { if (isValidHex(hx.value)) hx.value = normHex(hx.value); });
    if (eye) eye.addEventListener('click', () => startPick(i, kind, eye));
  }
  function wireSize(i) {
    const px = $(`px-input-${i}`), pt = $(`pt-input-${i}`);
    const valid = v => { const n = parseFloat(v); return !isNaN(n) && n > 0 && n <= 300; };
    px.addEventListener('input', () => { if (!valid(px.value)) { px.classList.add('invalid'); return; } px.classList.remove('invalid'); px.classList.add('edited'); const v = Math.round(parseFloat(px.value)); pt.value = pxToPt(v); items[i].font_px = v; refreshBadge(i); recheck(i); });
    pt.addEventListener('input', () => { if (!valid(pt.value)) { pt.classList.add('invalid'); return; } pt.classList.remove('invalid'); pt.classList.add('edited'); const v = ptToPx(parseFloat(pt.value)); px.value = v; items[i].font_px = v; refreshBadge(i); recheck(i); });
  }
  function refreshBadge(i) {
    const large = isLarge(items[i].font_px, items[i].bold), el = $(`size-badge-${i}`);
    if (el) { el.className = `size-badge ${large ? 'size-badge-large' : 'size-badge-normal'}`; el.textContent = large ? '▲ Large text' : 'Normal text'; }
  }
  function recheck(i) {
    const b = items[i];
    if (!isValidHex(b.text_color) || !isValidHex(b.button_color) || !isValidHex(b.page_color) || !b.font_px) return;
    b.tests = evaluate(b.text_color, b.button_color, b.page_color, b.font_px, b.bold, b.has_button);
    const body = $(`tests-${i}`);
    if (body) { body.innerHTML = buildRows(b.tests); const card = $(`card-${i}`); card.classList.remove('updated-flash'); void card.offsetWidth; card.classList.add('updated-flash'); }
    const rst = $(`reset-btn-${i}`); if (rst) rst.disabled = !edited(i);
    updateSummary();
  }

  /* ── Eyedropper (image cards only) ──────────────────────────────────── */
  function startPick(i, kind, btn) {
    document.querySelectorAll('.pick-btn.active').forEach(b => b.classList.remove('active'));
    if (pickMode && pickMode.row === i && pickMode.kind === kind) { stopPick(); return; }
    pickMode = { row: i, kind, btn }; btn.classList.add('active'); previewCanvas.classList.add('picking');
  }
  function stopPick() { if (pickMode) pickMode.btn.classList.remove('active'); previewCanvas.classList.remove('picking'); pickMode = null; }
  previewCanvas.addEventListener('click', e => {
    if (!pickMode || !sourceImageData) return;
    const rect = previewCanvas.getBoundingClientRect();
    const x = Math.min(naturalW - 1, Math.floor((e.clientX - rect.left) / rect.width * naturalW));
    const y = Math.min(naturalH - 1, Math.floor((e.clientY - rect.top) / rect.height * naturalH));
    const d = sourceImageData.data, idx = (y * naturalW + x) * 4, hex = rgbToHex(d[idx], d[idx + 1], d[idx + 2]);
    const { row, kind } = pickMode;
    items[row][kind + '_color'] = hex;
    $(`hex-${kind}-${row}`).value = hex; $(`pk-${kind}-${row}`).value = hex; $(`sw-${kind}-${row}`).style.background = hex;
    $(`sw-${kind}-${row}`).classList.add('edited-swatch'); $(`hex-${kind}-${row}`).classList.add('edited');
    recheck(row); stopPick();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') stopPick(); });

  /* ── Summary ────────────────────────────────────────────────────────── */
  function updateSummary() {
    const g = { manual: { n: 0, total: 0, pass: 0, fail: 0 }, image: { n: 0, total: 0, pass: 0, fail: 0 } };
    items.forEach(b => { const s = g[b.manual ? 'manual' : 'image']; s.n++; b.tests.forEach(t => { s.total++; t.result === 'PASS' ? s.pass++ : s.fail++; }); });
    $('m-stat-total').textContent = g.manual.total; $('m-stat-pass').textContent = g.manual.pass; $('m-stat-fail').textContent = g.manual.fail;
    $('manual-results').style.display = g.manual.n ? 'block' : 'none';
    $('i-stat-buttons').textContent = g.image.n; $('i-stat-total').textContent = g.image.total;
    $('i-stat-pass').textContent = g.image.pass; $('i-stat-fail').textContent = g.image.fail;
    $('image-results').style.display = g.image.n ? 'block' : 'none';
  }

  /* ══════════════════════════════════════════════════════════════════════
   * MANUAL ENTRY
   * ════════════════════════════════════════════════════════════════════*/
  const MANUAL_KINDS = { text: 'button text', button: 'button background', page: 'page background' };
  const manualHex = kind => $(`hex-m-${kind}`).value.trim();

  function updateManualPreview() {
    const px = parseFloat($('m-px').value), bold = $('m-bold').checked;
    const btn = $('m-preview-btn'), wrap = $('m-preview');
    if (isValidHex(manualHex('text'))) btn.style.color = normHex(manualHex('text'));
    if (isValidHex(manualHex('button'))) btn.style.background = normHex(manualHex('button'));
    if (isValidHex(manualHex('page'))) wrap.style.background = normHex(manualHex('page'));
    if (!isNaN(px) && px > 0) btn.style.fontSize = px + 'px';
    btn.style.fontWeight = bold ? '700' : '400';
    const large = !isNaN(px) && isLarge(px, bold), badge = $('m-size-badge');
    badge.className = `size-badge ${large ? 'size-badge-large' : 'size-badge-normal'}`;
    badge.textContent = large ? '▲ Large text' : 'Normal text';
  }
  function wireManual() {
    Object.keys(MANUAL_KINDS).forEach(kind => {
      const sw = $(`sw-m-${kind}`), pk = $(`pk-m-${kind}`), hx = $(`hex-m-${kind}`);
      pk.addEventListener('input', () => { const hex = pk.value.toUpperCase(); hx.value = hex; hx.classList.remove('invalid'); sw.style.background = hex; updateManualPreview(); });
      hx.addEventListener('input', () => { if (isValidHex(hx.value)) { const hex = normHex(hx.value); hx.classList.remove('invalid'); sw.style.background = hex; pk.value = hex; updateManualPreview(); } else hx.classList.add('invalid'); });
      hx.addEventListener('blur', () => { if (isValidHex(hx.value)) hx.value = normHex(hx.value); });
      hx.addEventListener('keydown', e => { if (e.key === 'Enter') runManual(); });
    });
    const px = $('m-px'), pt = $('m-pt');
    const valid = v => { const n = parseFloat(v); return !isNaN(n) && n > 0 && n <= 300; };
    px.addEventListener('input', () => { if (!valid(px.value)) { px.classList.add('invalid'); return; } px.classList.remove('invalid'); pt.classList.remove('invalid'); pt.value = pxToPt(Math.round(parseFloat(px.value))); updateManualPreview(); });
    pt.addEventListener('input', () => { if (!valid(pt.value)) { pt.classList.add('invalid'); return; } pt.classList.remove('invalid'); px.classList.remove('invalid'); px.value = ptToPx(parseFloat(pt.value)); updateManualPreview(); });
    [px, pt].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') runManual(); }));
    $('m-bold').addEventListener('change', () => { $('m-bold-wrap').classList.toggle('edited', $('m-bold').checked); updateManualPreview(); });
    $('manual-run').addEventListener('click', runManual);
    updateManualPreview();
  }
  function showManualError(msg) { const e = $('manual-error'); e.textContent = '⚠ ' + msg; e.classList.add('on'); }
  function hideManualError() { $('manual-error').classList.remove('on'); }
  function runManual() {
    hideManualError();
    const colors = {};
    for (const [kind, label] of Object.entries(MANUAL_KINDS)) {
      if (!isValidHex(manualHex(kind))) { showManualError(`Enter a valid hex for ${label} — for example #0F62FE.`); $(`hex-m-${kind}`).focus(); return; }
      colors[kind] = normHex(manualHex(kind));
    }
    const px = Math.round(parseFloat($('m-px').value));
    if (isNaN(px) || px <= 0 || px > 300) { showManualError('Enter a font size between 1 and 300 px.'); $('m-px').focus(); return; }
    const bold = $('m-bold').checked;
    const entry = {
      manual: true, text: 'Manual entry', has_button: true, bold_auto: false,
      text_color: colors.text, button_color: colors.button, page_color: colors.page, font_px: px, bold,
      tests: evaluate(colors.text, colors.button, colors.page, px, bold, true),
    };
    const i = items.findIndex(b => b.manual);
    if (i >= 0) { items[i] = entry; originalItems[i] = JSON.parse(JSON.stringify(entry)); }
    else { items.push(entry); originalItems.push(JSON.parse(JSON.stringify(entry))); }
    renderAll('manual');
  }

  /* ── Criteria accordion + boot ──────────────────────────────────────── */
  $('criteria-toggle').addEventListener('click', function () { const body = $('criteria-body'), open = body.classList.toggle('open'); this.setAttribute('aria-expanded', open); });
  wireManual();
})();
