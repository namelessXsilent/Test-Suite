/* ============================================================================
 * Text Contrast Checker — fully client-side.
 * OCR: Tesseract.js (CDN). Color detection + WCAG math: ported to the browser
 * from wcag_contrast.py (no Python backend). Copy is detected bottom-up —
 * words → lines → paragraph blocks — so each block is measured as one object.
 * ==========================================================================*/
(function () {
  "use strict";

  const PALETTE = ['#ff4d4d','#8b9dff','#3ad0b0','#f0b429','#e879f9','#38bdf8','#fb923c','#a3e635','#22d3ee','#c084fc'];
  const PX_TO_PT = 0.75, PT_TO_PX = 1 / 0.75;

  const $ = id => document.getElementById(id);

  /* ── WCAG math ──────────────────────────────────────────────────────── */
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function luminance(r, g, b) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
  function contrastRatio(rgb1, rgb2) {
    const l1 = luminance(...rgb1), l2 = luminance(...rgb2);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  }
  function contrastHex(h1, h2) { return contrastRatio(hexToRgb(h1), hexToRgb(h2)); }
  function isValidHex(h) { return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h.trim()); }
  function normHex(h) { h = h.trim().replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return '#' + h.toUpperCase(); }
  function isLarge(px, bold) { return px >= 24 || (bold && px >= 18.67); }
  function wcagReq(px, bold) { return isLarge(px, bold) ? 3.0 : 4.5; }
  function pxToPt(px) { return Math.round(px * PX_TO_PT); }
  function ptToPx(pt) { return Math.round(pt * PT_TO_PX); }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return [h, mx ? d / mx : 0, mx];
  }
  function hsvToRgb(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }
  // Nearest color to the text (same hue/sat, value shifted) that reaches `req`.
  function findFix(textRgb, bgRgb, req) {
    let best = null, bestD = Infinity;
    const [h, s, v] = rgbToHsv(...textRgb);
    for (const dir of ['darken', 'lighten']) {
      for (let i = 0; i <= 200; i++) {
        const t = i / 200;
        const nv = dir === 'darken' ? v * (1 - t) : v + (1 - v) * t;
        const f = hsvToRgb(h, s, nv);
        const cand = [Math.round(f[0]), Math.round(f[1]), Math.round(f[2])];  // check the rounded color we return
        if (contrastRatio(cand, bgRgb) >= req) {
          const d = Math.hypot(cand[0] - textRgb[0], cand[1] - textRgb[1], cand[2] - textRgb[2]);
          if (d < bestD) { bestD = d; best = rgbToHex(...cand); }
          break;
        }
      }
    }
    if (best) return best;
    for (const cand of [[0, 0, 0], [255, 255, 255]]) if (contrastRatio(cand, bgRgb) >= req) return rgbToHex(...cand);
    return '#000000';
  }
  function findFixHex(textHex, bgHex, req) { return findFix(hexToRgb(textHex), hexToRgb(bgHex), req); }

  /* ══════════════════════════════════════════════════════════════════════
   * MANUAL ENTRY — no screenshot needed; updates live.
   * ════════════════════════════════════════════════════════════════════*/
  const manual = { text: '#767676', bg: '#FFFFFF', px: 16, bold: false };

  function wireManualColor(kind) {
    const key = kind === 'text' ? 'text' : 'bg';
    const sw = $(`sw-m-${kind}`), pk = $(`pk-m-${kind}`), hx = $(`hex-m-${kind}`);
    pk.addEventListener('input', () => {
      const hex = pk.value.toUpperCase();
      hx.value = hex; hx.classList.remove('invalid'); sw.style.background = hex;
      manual[key] = hex; updateManual();
    });
    hx.addEventListener('input', () => {
      const raw = hx.value.trim(); if (!raw) return;
      if (isValidHex(raw)) {
        const hex = normHex(raw);
        hx.classList.remove('invalid'); sw.style.background = hex; pk.value = hex;
        manual[key] = hex; updateManual();
      } else hx.classList.add('invalid');
    });
    hx.addEventListener('blur', () => { if (isValidHex(hx.value)) hx.value = normHex(hx.value); });
  }

  function wireManual() {
    wireManualColor('text'); wireManualColor('bg');
    const px = $('m-px'), pt = $('m-pt'), bold = $('m-bold');
    const valid = v => { const n = parseFloat(v); return !isNaN(n) && n > 0 && n <= 300; };
    px.addEventListener('input', () => { if (!valid(px.value)) return; manual.px = Math.round(parseFloat(px.value)); pt.value = pxToPt(manual.px); updateManual(); });
    pt.addEventListener('input', () => { if (!valid(pt.value)) return; manual.px = ptToPx(parseFloat(pt.value)); px.value = manual.px; updateManual(); });
    bold.addEventListener('change', () => { manual.bold = bold.checked; $('m-bold-wrap').classList.toggle('edited', bold.checked); updateManual(); });
    $('m-fix-apply').addEventListener('click', () => {
      const hex = $('m-fix-hex').textContent; if (!isValidHex(hex)) return;
      $('hex-m-text').value = hex; $('pk-m-text').value = hex; $('sw-m-text').style.background = hex;
      manual.text = hex; updateManual();
    });
    updateManual();
  }

  function updateManual() {
    const { text, bg, px, bold } = manual;
    const large = isLarge(px, bold), req = wcagReq(px, bold), ratio = contrastHex(text, bg), passed = ratio >= req;

    const badge = $('m-size-badge');
    badge.className = `size-badge ${large ? 'size-badge-large' : 'size-badge-normal'}`;
    badge.textContent = large ? '▲ Large text' : 'Normal text';

    const preview = $('m-preview'), sample = $('m-preview-text');
    preview.style.background = bg;
    sample.style.color = text; sample.style.fontSize = px + 'px'; sample.style.fontWeight = bold ? '700' : '400';

    const rEl = $('m-ratio');
    rEl.textContent = ratio + ':1'; rEl.className = `ratio ${passed ? 'ratio-pass' : 'ratio-fail'}`;
    $('m-required').textContent = req + ':1';
    const pill = $('m-pill');
    pill.textContent = passed ? 'PASS' : 'FAIL'; pill.className = `pill ${passed ? 'pill-pass' : 'pill-fail'}`;

    const wrap = $('m-fix-wrap'), apply = $('m-fix-apply');
    if (passed) { wrap.style.display = 'none'; apply.style.display = 'none'; return; }
    const fix = findFixHex(text, bg, req);
    $('m-fix-swatch').style.background = fix; $('m-fix-hex').textContent = fix;
    wrap.style.display = 'flex'; apply.style.display = 'inline-flex';
  }

  /* ══════════════════════════════════════════════════════════════════════
   * IMAGE CHECKER — OCR + auto color sampling.
   * ════════════════════════════════════════════════════════════════════*/
  const dropZone = $('drop-zone'), fileInput = $('file-input'), runBtn = $('run-btn');
  const btnLabel = $('btn-label'), spinner = $('spinner');
  const errBanner = $('error-banner');
  const imageViewer = $('image-viewer');
  const previewCanvas = $('preview-canvas'), annotatedCanvas = $('annotated-canvas');
  const analyzing = $('analyzing'), analyzingText = $('analyzing-text');
  const countBadge = $('count-badge');
  const resultsSection = $('results-section'), resultsBody = $('results-body');
  const statTotal = $('stat-total'), statPass = $('stat-pass'), statFail = $('stat-fail');
  const recheckAllBtn = $('recheck-all-btn'), resetAllBtn = $('reset-all-btn');

  let sourceImageData = null, naturalW = 0, naturalH = 0;
  let originalResults = [], currentResults = [];
  let pickMode = null;

  /* ── Color detection (ported from wcag_contrast.py) ─────────────────── */
  function samplePixels(id, x1, y1, x2, y2, step) {
    step = step || 1;
    const out = [], W = id.width, d = id.data;
    x1 = Math.max(0, x1 | 0); y1 = Math.max(0, y1 | 0);
    x2 = Math.min(W, x2 | 0); y2 = Math.min(id.height, y2 | 0);
    for (let y = y1; y < y2; y += step)
      for (let x = x1; x < x2; x += step) {
        const i = (y * W + x) * 4;
        out.push([d[i], d[i + 1], d[i + 2]]);
      }
    return out;
  }
  // Dominant color via coarse (4-bit/channel) histogram, averaged within the top bucket.
  function dominantColor(pixels) {
    if (!pixels.length) return [255, 255, 255];
    const buckets = new Map();
    for (const [r, g, b] of pixels) {
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      let e = buckets.get(key);
      if (!e) { e = { n: 0, r: 0, g: 0, b: 0 }; buckets.set(key, e); }
      e.n++; e.r += r; e.g += g; e.b += b;
    }
    let best = null;
    for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
    return [best.r / best.n, best.g / best.n, best.b / best.n];
  }
  function getBackground(id, box) {
    const { x, y, w, h } = box, W = id.width, H = id.height;
    const PAD = Math.max(16, Math.min(48, Math.round(0.05 * Math.min(W, H))));
    let px = [];
    px = px.concat(samplePixels(id, x - PAD, y - PAD, x + w + PAD, y, 2));
    px = px.concat(samplePixels(id, x - PAD, y + h, x + w + PAD, y + h + PAD, 2));
    px = px.concat(samplePixels(id, x - PAD, y, x, y + h, 2));
    px = px.concat(samplePixels(id, x + w, y, x + w + PAD, y + h, 2));
    if (w * h < 0.5 * W * H) {
      const c = 30;
      px = px.concat(samplePixels(id, 0, 0, c, c), samplePixels(id, W - c, 0, W, c),
                     samplePixels(id, 0, H - c, c, H), samplePixels(id, W - c, H - c, W, H));
    }
    return dominantColor(px);
  }
  function percentile(sorted, p) {
    if (!sorted.length) return 0;
    return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  }
  // Ink color: pixels (from the word boxes) furthest from the background.
  function getTextColor(id, wordBoxes, bg) {
    const fallback = luminance(...bg) > 0.5 ? [0, 0, 0] : [255, 255, 255];
    let px = [];
    for (const b of wordBoxes) px = px.concat(samplePixels(id, b.x, b.y, b.x + b.w, b.y + b.h, 1));
    if (px.length < 5) return fallback;
    const dists = px.map(p => Math.hypot(p[0] - bg[0], p[1] - bg[1], p[2] - bg[2]));
    const sorted = dists.slice().sort((a, b) => a - b);
    let thr = percentile(sorted, 80);
    if (thr < 8) thr = percentile(sorted, 50);
    if (thr < 4) return fallback;
    const fg = px.filter((_, i) => dists[i] >= thr);
    if (fg.length < 5) return fallback;
    const cand = dominantColor(fg);
    if (contrastRatio(cand, bg) <= 1.1) return fallback;
    return cand;
  }

  /* ── OCR (Tesseract.js) → words → lines → paragraph blocks ──────────── */
  function collectWords(data) {
    if (data.words && data.words.length) return data.words;
    const words = [];
    (data.blocks || []).forEach(bl =>
      (bl.paragraphs || []).forEach(p =>
        (p.lines || []).forEach(l =>
          (l.words || []).forEach(w => words.push(w)))));
    return words;
  }

  function buildBlocks(words) {
    const good = words.filter(w =>
      w.text && w.text.trim().length && w.confidence >= 40 && /[A-Za-z0-9]/.test(w.text));
    good.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0);

    // Words → lines (share a row when their vertical spans overlap).
    const lines = [];
    for (const w of good) {
      const wh = w.bbox.y1 - w.bbox.y0;
      let placed = false;
      for (const line of lines) {
        const ref = line.words[line.words.length - 1].bbox;
        const overlap = Math.min(w.bbox.y1, ref.y1) - Math.max(w.bbox.y0, ref.y0);
        if (overlap > 0.5 * Math.min(wh, ref.y1 - ref.y0)) { line.words.push(w); placed = true; break; }
      }
      if (!placed) lines.push({ words: [w] });
    }
    const lineObjs = lines.map(line => {
      const ws = line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0);
      const x0 = Math.min(...ws.map(w => w.bbox.x0)), y0 = Math.min(...ws.map(w => w.bbox.y0));
      const x1 = Math.max(...ws.map(w => w.bbox.x1)), y1 = Math.max(...ws.map(w => w.bbox.y1));
      const heights = ws.map(w => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
      return {
        words: ws, x0, y0, x1, y1,
        text: ws.map(w => w.text).join(' '),
        h: heights[Math.floor(heights.length / 2)],
      };
    }).sort((a, b) => a.y0 - b.y0);

    // Lines → paragraph blocks (adjacent lines with a small vertical gap and
    // overlapping x-range belong to the same block).
    const paras = [];
    for (const line of lineObjs) {
      const cur = paras[paras.length - 1];
      if (cur) {
        const last = cur.lines[cur.lines.length - 1];
        const gap = line.y0 - last.y1;
        const overlapX = Math.min(line.x1, cur.x1) - Math.max(line.x0, cur.x0);
        if (gap <= 0.9 * Math.max(line.h, last.h) && overlapX > 0) {
          cur.lines.push(line);
          cur.x0 = Math.min(cur.x0, line.x0); cur.y0 = Math.min(cur.y0, line.y0);
          cur.x1 = Math.max(cur.x1, line.x1); cur.y1 = Math.max(cur.y1, line.y1);
          continue;
        }
      }
      paras.push({ lines: [line], x0: line.x0, y0: line.y0, x1: line.x1, y1: line.y1 });
    }

    return paras.map(p => {
      const allWords = p.lines.flatMap(l => l.words);
      const heights = allWords.map(w => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
      const medH = heights[Math.floor(heights.length / 2)];
      return {
        text: p.lines.map(l => l.text).join(' '),
        box: { x: p.x0, y: p.y0, w: p.x1 - p.x0, h: p.y1 - p.y0 },
        lineBoxes: p.lines.map(l => ({ x: l.x0, y: l.y0, w: l.x1 - l.x0, h: l.y1 - l.y0 })),
        wordBoxes: allWords.map(w => ({ x: w.bbox.x0, y: w.bbox.y0, w: w.bbox.x1 - w.bbox.x0, h: w.bbox.y1 - w.bbox.y0 })),
        fontPx: Math.round(medH * 1.35),
        lineCount: p.lines.length,
        wordCount: allWords.length,
      };
    }).filter(b => b.text.replace(/\s/g, '').length >= 2);
  }

  /* ── Annotated overlay ──────────────────────────────────────────────── */
  function drawAnnotated() {
    const c = annotatedCanvas;
    c.width = naturalW; c.height = naturalH;
    const ctx = c.getContext('2d');
    ctx.putImageData(sourceImageData, 0, 0);
    currentResults.forEach((r, i) => {
      // Faint boxes for the individual lines that make up a multi-line block.
      if (r.lineCount > 1) {
        ctx.lineWidth = Math.max(1, naturalW / 900); ctx.strokeStyle = 'rgba(203,213,225,.7)';
        r.lineBoxes.forEach(b => ctx.strokeRect(b.x, b.y, b.w, b.h));
      }
      const passed = r.result === 'PASS';
      const stroke = passed ? '#3ad0b0' : '#ff6b6b';
      const fill = passed ? 'rgba(58,208,176,.20)' : 'rgba(255,107,107,.20)';
      const { x, y, w, h } = r.box;
      ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
      ctx.lineWidth = Math.max(2, naturalW / 500); ctx.strokeStyle = stroke; ctx.strokeRect(x, y, w, h);
      const rad = Math.max(9, naturalW / 90), cy = y - rad > rad ? y - rad : y + rad;
      ctx.beginPath(); ctx.arc(x + rad, cy, rad, 0, 7); ctx.fillStyle = stroke; ctx.fill();
      ctx.fillStyle = '#0c0d12'; ctx.font = `700 ${rad * 1.1}px Segoe UI, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), x + rad, cy);
    });
  }

  /* ── Image input ────────────────────────────────────────────────────── */
  function loadImage(file) {
    hideError();
    const img = new Image();
    img.onload = () => {
      naturalW = img.naturalWidth; naturalH = img.naturalHeight;
      const c = previewCanvas; c.width = naturalW; c.height = naturalH;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      sourceImageData = ctx.getImageData(0, 0, naturalW, naturalH);
      annotatedCanvas.width = naturalW; annotatedCanvas.height = naturalH;
      annotatedCanvas.getContext('2d').putImageData(sourceImageData, 0, 0);
      imageViewer.style.display = 'block';
      resultsSection.style.display = 'none';
      countBadge.style.display = 'none';
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
    const items = (e.clipboardData || window.clipboardData).items;
    for (const it of items) if (it.type.startsWith('image/')) { const f = it.getAsFile(); if (f) { e.preventDefault(); loadImage(f); return; } }
  });

  function showError(msg) { errBanner.textContent = '⚠ ' + msg; errBanner.classList.add('on'); }
  function hideError() { errBanner.classList.remove('on'); }

  /* ── Analyse ────────────────────────────────────────────────────────── */
  runBtn.addEventListener('click', analyse);

  async function analyse() {
    if (!sourceImageData) return;
    if (typeof Tesseract === 'undefined') { showError('OCR library failed to load — check your internet connection and reload.'); return; }
    runBtn.disabled = true; spinner.classList.add('on'); btnLabel.textContent = 'Analysing…';
    analyzing.classList.add('on'); analyzingText.textContent = 'Loading OCR engine…';
    resultsSection.style.display = 'none'; hideError();
    try {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') analyzingText.textContent = 'Detecting text… ' + Math.round(m.progress * 100) + '%';
          else if (m.status) analyzingText.textContent = m.status.charAt(0).toUpperCase() + m.status.slice(1) + '…';
        }
      });
      const { data } = await worker.recognize(previewCanvas, {}, { blocks: true });
      await worker.terminate();

      const blocks = buildBlocks(collectWords(data));
      if (!blocks.length) { analyzing.classList.remove('on'); showError('No readable text was detected in that image.'); return; }

      currentResults = blocks.map(b => {
        const bgRgb = getBackground(sourceImageData, b.box);
        const textRgb = getTextColor(sourceImageData, b.wordBoxes, bgRgb);
        const textHex = rgbToHex(...textRgb), bgHex = rgbToHex(...bgRgb);
        const req = wcagReq(b.fontPx, false);
        const ratio = contrastRatio(textRgb, bgRgb);
        const passed = ratio >= req;
        return {
          text: b.text.length > 90 ? b.text.slice(0, 90) + '…' : b.text,
          box: b.box, lineBoxes: b.lineBoxes, lineCount: b.lineCount, wordCount: b.wordCount,
          fontPx: b.fontPx, bold: false, textColor: textHex, bgColor: bgHex,
          required: req, measured: ratio, result: passed ? 'PASS' : 'FAIL',
          fix: passed ? textHex : findFix(textRgb, bgRgb, req),
        };
      });
      originalResults = JSON.parse(JSON.stringify(currentResults));

      analyzing.classList.remove('on');
      countBadge.textContent = blocks.length + ' block' + (blocks.length !== 1 ? 's' : '') + ' found';
      countBadge.style.display = 'inline-block';
      renderResults();
    } catch (err) {
      analyzing.classList.remove('on');
      showError('Analysis failed: ' + err.message);
    } finally {
      runBtn.disabled = false; spinner.classList.remove('on'); btnLabel.textContent = '▶ Run WCAG 2.2 Tests';
    }
  }

  /* ── Rendering ──────────────────────────────────────────────────────── */
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function renderResults() {
    drawAnnotated();
    resultsBody.innerHTML = '';
    currentResults.forEach((r, i) => resultsBody.insertAdjacentHTML('beforeend', buildRow(r, i)));
    currentResults.forEach((_, i) => wireRow(i));
    updateSummary();
    resultsSection.style.display = 'block';
    updateToolbar();
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  function edited(i) {
    const o = originalResults[i], c = currentResults[i];
    return o && c && (o.textColor !== c.textColor || o.bgColor !== c.bgColor || o.fontPx !== c.fontPx || o.bold !== c.bold);
  }

  function buildRow(r, i) {
    const pass = r.result === 'PASS', color = PALETTE[i % PALETTE.length], ed = edited(i);
    const fix = pass
      ? `<span class="no-change">✔ No change needed</span>`
      : `<span class="fix-swatch"><span class="sw" style="background:${r.fix}"></span><span class="hex">${r.fix}</span></span>`;
    return `<tr id="row-${i}" class="${ed ? 'row-edited' : ''}">
      <td><span class="index-badge" style="background:${color}">${i + 1}</span></td>
      <td>
        <div class="snippet">${esc(r.text)}</div>
        <div class="block-meta">
          <span class="meta-chip">${r.lineCount} line${r.lineCount === 1 ? '' : 's'}</span>
          <span class="meta-chip">${r.wordCount} word${r.wordCount === 1 ? '' : 's'}</span>
        </div>
      </td>
      <td>${sizeEditor(i, r)}</td>
      <td>${colorEditor('text', i, r.textColor)}</td>
      <td>${colorEditor('bg', i, r.bgColor)}</td>
      <td class="ratio" id="req-${i}">${r.required}:1</td>
      <td id="ratio-${i}"><span class="ratio ${pass ? 'ratio-pass' : 'ratio-fail'}">${r.measured}:1</span></td>
      <td id="pill-${i}"><span class="pill ${pass ? 'pill-pass' : 'pill-fail'}">${r.result}</span></td>
      <td id="fix-${i}">${fix}</td>
      <td><button class="btn btn-ghost btn-sm" id="reset-${i}" ${ed ? '' : 'disabled'}>↺</button></td>
    </tr>`;
  }

  function sizeEditor(i, r) {
    const large = isLarge(r.fontPx, r.bold);
    return `<div class="size-editor">
      <div class="size-field"><span class="size-label">px</span>
        <input type="number" class="size-input" id="px-${i}" value="${r.fontPx}" min="1" max="300" step="1"></div>
      <div class="size-field"><span class="size-label">pt</span>
        <input type="number" class="size-input" id="pt-${i}" value="${pxToPt(r.fontPx)}" min="1" max="300" step="1"></div>
      <label class="bold-toggle"><input type="checkbox" id="bold-${i}" ${r.bold ? 'checked' : ''}>Bold</label>
      <span class="size-badge ${large ? 'size-badge-large' : 'size-badge-normal'}" id="sizebadge-${i}">${large ? '▲ Large' : 'Normal'}</span>
    </div>`;
  }

  function colorEditor(kind, i, hex) {
    const id = `${kind}-${i}`;
    return `<div class="color-editor">
      <span class="swatch-btn" id="sw-${id}" style="background:${hex}" title="Open color picker">
        <input type="color" id="pk-${id}" value="${hex}">
      </span>
      <input type="text" class="hex-input" id="hex-${id}" value="${hex}" maxlength="7" spellcheck="false">
      <button class="pick-btn" id="eye-${id}" title="Eyedropper — sample from the image">⦿</button>
    </div>`;
  }

  function wireRow(i) {
    wireColor('text', i); wireColor('bg', i); wireSize(i);
    const reset = $(`reset-${i}`);
    if (reset) reset.addEventListener('click', () => resetRow(i));
  }

  function wireColor(kind, i) {
    const field = kind === 'text' ? 'textColor' : 'bgColor';
    const sw = $(`sw-${kind}-${i}`), pk = $(`pk-${kind}-${i}`), hx = $(`hex-${kind}-${i}`), eye = $(`eye-${kind}-${i}`);
    pk.addEventListener('input', () => {
      const hex = pk.value.toUpperCase();
      hx.value = hex; sw.style.background = hex; hx.classList.remove('invalid');
      currentResults[i][field] = hex; applyEdit(i);
    });
    hx.addEventListener('input', () => {
      const raw = hx.value.trim(); if (!raw) return;
      if (isValidHex(raw)) {
        const hex = normHex(raw);
        hx.classList.remove('invalid'); sw.style.background = hex; pk.value = hex;
        currentResults[i][field] = hex; applyEdit(i);
      } else hx.classList.add('invalid');
    });
    hx.addEventListener('blur', () => { if (isValidHex(hx.value)) hx.value = normHex(hx.value); });
    eye.addEventListener('click', () => startPick(i, kind, eye));
  }

  function wireSize(i) {
    const px = $(`px-${i}`), pt = $(`pt-${i}`), bold = $(`bold-${i}`);
    const valid = v => { const n = parseFloat(v); return !isNaN(n) && n > 0 && n <= 300; };
    px.addEventListener('input', () => { if (!valid(px.value)) return; const v = Math.round(parseFloat(px.value)); pt.value = pxToPt(v); currentResults[i].fontPx = v; applyEdit(i); });
    pt.addEventListener('input', () => { if (!valid(pt.value)) return; const v = ptToPx(parseFloat(pt.value)); px.value = v; currentResults[i].fontPx = v; applyEdit(i); });
    bold.addEventListener('change', () => { currentResults[i].bold = bold.checked; applyEdit(i); });
  }

  // Recompute a row's verdict live after any edit.
  function applyEdit(i) {
    const r = currentResults[i];
    if (!isValidHex(r.textColor) || !isValidHex(r.bgColor) || !r.fontPx) return;
    r.required = wcagReq(r.fontPx, r.bold);
    r.measured = contrastHex(r.textColor, r.bgColor);
    r.result = r.measured >= r.required ? 'PASS' : 'FAIL';
    r.fix = r.result === 'PASS' ? r.textColor : findFixHex(r.textColor, r.bgColor, r.required);
    const pass = r.result === 'PASS', large = isLarge(r.fontPx, r.bold);
    $(`req-${i}`).textContent = r.required + ':1';
    $(`ratio-${i}`).innerHTML = `<span class="ratio ${pass ? 'ratio-pass' : 'ratio-fail'}">${r.measured}:1</span>`;
    $(`pill-${i}`).innerHTML = `<span class="pill ${pass ? 'pill-pass' : 'pill-fail'}">${r.result}</span>`;
    $(`fix-${i}`).innerHTML = pass
      ? `<span class="no-change">✔ No change needed</span>`
      : `<span class="fix-swatch"><span class="sw" style="background:${r.fix}"></span><span class="hex">${r.fix}</span></span>`;
    const badge = $(`sizebadge-${i}`);
    badge.className = `size-badge ${large ? 'size-badge-large' : 'size-badge-normal'}`;
    badge.textContent = large ? '▲ Large' : 'Normal';
    $(`row-${i}`).classList.toggle('row-edited', edited(i));
    $(`reset-${i}`).disabled = !edited(i);
    updateSummary(); updateToolbar(); drawAnnotated();
  }

  function resetRow(i) {
    currentResults[i] = JSON.parse(JSON.stringify(originalResults[i]));
    const tmp = document.createElement('tbody');
    tmp.innerHTML = buildRow(currentResults[i], i);
    $(`row-${i}`).replaceWith(tmp.firstElementChild);
    wireRow(i); updateSummary(); updateToolbar(); drawAnnotated();
  }

  /* ── Eyedropper (sample a pixel from the original image) ────────────── */
  function startPick(i, kind, btn) {
    document.querySelectorAll('.pick-btn.active').forEach(b => b.classList.remove('active'));
    if (pickMode && pickMode.row === i && pickMode.kind === kind) { stopPick(); return; }
    pickMode = { row: i, kind, btn };
    btn.classList.add('active');
    previewCanvas.classList.add('picking');
  }
  function stopPick() {
    if (pickMode) pickMode.btn.classList.remove('active');
    previewCanvas.classList.remove('picking');
    pickMode = null;
  }
  previewCanvas.addEventListener('click', e => {
    if (!pickMode || !sourceImageData) return;
    const rect = previewCanvas.getBoundingClientRect();
    const x = Math.min(naturalW - 1, Math.floor((e.clientX - rect.left) / rect.width * naturalW));
    const y = Math.min(naturalH - 1, Math.floor((e.clientY - rect.top) / rect.height * naturalH));
    const d = sourceImageData.data, idx = (y * naturalW + x) * 4;
    const hex = rgbToHex(d[idx], d[idx + 1], d[idx + 2]);
    const { row, kind } = pickMode;
    currentResults[row][kind === 'text' ? 'textColor' : 'bgColor'] = hex;
    $(`hex-${kind}-${row}`).value = hex; $(`pk-${kind}-${row}`).value = hex; $(`sw-${kind}-${row}`).style.background = hex;
    applyEdit(row); stopPick();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') stopPick(); });

  /* ── Summary + toolbar ──────────────────────────────────────────────── */
  function updateSummary() {
    const pass = currentResults.filter(r => r.result === 'PASS').length;
    statTotal.textContent = currentResults.length;
    statPass.textContent = pass;
    statFail.textContent = currentResults.length - pass;
  }
  function updateToolbar() {
    recheckAllBtn.style.display = 'none';   // live recheck makes this redundant
    resetAllBtn.style.display = currentResults.some((_, i) => edited(i)) ? 'inline-flex' : 'none';
  }
  resetAllBtn.addEventListener('click', () => { currentResults = JSON.parse(JSON.stringify(originalResults)); renderResults(); });

  /* ── Criteria accordion ─────────────────────────────────────────────── */
  $('criteria-toggle').addEventListener('click', function () {
    const body = $('criteria-body'), open = body.classList.toggle('open');
    this.setAttribute('aria-expanded', open);
  });

  /* ── Boot ───────────────────────────────────────────────────────────── */
  wireManual();
})();
