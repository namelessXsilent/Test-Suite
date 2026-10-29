// Test File Generator: builds dummy files of a chosen type and size in the browser
// and downloads them. Nothing is uploaded anywhere.
(function () {
  "use strict";
  const form = document.getElementById('gen-form');
  if (!form) return;
  const dimsGroup = document.getElementById('dims-group');
  const widthIn   = document.getElementById('gen-w');
  const heightIn  = document.getElementById('gen-h');
  const preview   = document.getElementById('gen-preview');
  const status    = document.getElementById('gen-status');
  const button    = form.querySelector('button[type="submit"]');

  const KB = 1024, MB = 1024 * 1024;
  // Every file (except 0 KB) is made this much bigger than the size picked,
  // so it is over a limit of that size however the app counts megabytes.
  const OVER_BY = KB;
  const MAX_SIDE = 10000, MAX_PIXELS = 50e6;

  const TYPES = {
    png:  { mime: 'image/png',        image: true },
    jpg:  { mime: 'image/jpeg',       image: true },
    gif:  { mime: 'image/gif',        image: true },
    webp: { mime: 'image/webp',       image: true },
    bmp:  { mime: 'image/bmp',        image: true },
    svg:  { mime: 'image/svg+xml',    image: true },
    pdf:  { mime: 'application/pdf' },
    txt:  { mime: 'text/plain' },
    csv:  { mime: 'text/csv' },
    json: { mime: 'application/json' },
  };

  const enc = new TextEncoder();
  const FILLER = 'QA test file - filler content for upload testing. ';

  // ── Small helpers ──────────────────────────────────────────────────
  const sizeLabel = bytes => bytes === 0 ? '0KB' : bytes < MB ? (bytes / KB) + 'KB' : (bytes / MB) + 'MB';
  const fmtBytes = n => n.toLocaleString('en-US') + ' bytes (' +
    (n >= MB ? (n / MB).toFixed(2) + ' MB' : (n / KB).toFixed(1) + ' KB') + ')';

  // n bytes of repeating ASCII text (doubling copy keeps 50 MB fast).
  function filler(n, unit = FILLER) {
    const out = new Uint8Array(Math.max(0, n));
    const u = enc.encode(unit);
    out.set(u.subarray(0, Math.min(u.length, out.length)));
    for (let len = u.length; len < out.length; len *= 2) out.copyWithin(len, 0, Math.min(len, out.length - len));
    return out;
  }

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes, crc = 0xFFFFFFFF) {
    for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    return crc;
  }
  const u32be = n => new Uint8Array([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
  const setU16le = (b, o, n) => { b[o] = n & 255; b[o + 1] = (n >>> 8) & 255; };
  const setU32le = (b, o, n) => { setU16le(b, o, n & 0xFFFF); setU16le(b, o + 2, n >>> 16); };

  // ── Image drawing ──────────────────────────────────────────────────
  // A simple test card: gradient, grid, and the dimensions in the middle.
  function drawCanvas(w, h, label) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not create an image this large. Try smaller dimensions.');
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#1d2130'); g.addColorStop(.5, '#3a2f6b'); g.addColorStop(1, '#0f3b36');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = Math.max(1, Math.min(w, h) / 400);
    const step = Math.max(8, Math.round(Math.min(w, h) / 10));
    ctx.beginPath();
    for (let x = step; x < w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = step; y < h; y += step) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();
    const fs = Math.max(6, Math.min(w / 9, h / 4));
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${fs}px Segoe UI, Arial, sans-serif`;
    ctx.fillText(`${w} × ${h}`, w / 2, h / 2 - fs * .25);
    ctx.font = `600 ${fs * .35}px Segoe UI, Arial, sans-serif`;
    ctx.fillStyle = '#ff8a8a';
    ctx.fillText(label, w / 2, h / 2 + fs * .55);
    return canvas;
  }

  const toBlob = (canvas, mime, q) => new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Your browser could not create this image. Try smaller dimensions.')), mime, q));

  // ── Padding: grow a file to the target size in a way its format allows ─
  // PNG: a tEXt comment chunk before IEND.
  function padPng(bytes, target) {
    const extra = target - bytes.length;
    if (extra < 21) return [bytes];
    const type = enc.encode('tEXt');
    const data = new Uint8Array(extra - 12);
    data.set(enc.encode('Comment\0'));
    data.set(filler(data.length - 8), 8);
    const crc = (crc32(data, crc32(type)) ^ 0xFFFFFFFF) >>> 0;
    const iend = bytes.length - 12;
    return [bytes.subarray(0, iend), u32be(data.length), type, data, u32be(crc), bytes.subarray(iend)];
  }

  // JPG: COM (comment) segments right after the start-of-image marker.
  function padJpg(bytes, target) {
    let extra = target - bytes.length;
    if (extra < 5) return [bytes];
    const out = new Uint8Array(extra);
    let o = 0;
    while (extra >= 5) {
      const payload = Math.min(65533, extra - 4);
      out[o] = 0xFF; out[o + 1] = 0xFE;
      out[o + 2] = ((payload + 2) >>> 8) & 255; out[o + 3] = (payload + 2) & 255;
      out.set(filler(payload), o + 4);
      o += payload + 4; extra -= payload + 4;
    }
    return [bytes.subarray(0, 2), out.subarray(0, o), bytes.subarray(2)];
  }

  // WebP: an extra RIFF chunk at the end, with the RIFF size updated.
  function padWebp(bytes, target) {
    let extra = target - bytes.length;
    if (extra < 10) return [bytes];
    const dataLen = (extra - 8) & ~1;
    const chunk = new Uint8Array(8 + dataLen);
    chunk.set(enc.encode('QAPD'));
    setU32le(chunk, 4, dataLen);
    chunk.set(filler(dataLen), 8);
    const head = bytes.slice(0, 8);
    setU32le(head, 4, bytes.length + chunk.length - 8);
    return [head, bytes.subarray(8), chunk];
  }

  // GIF: a comment extension before the trailer byte.
  function gifComment(extra) {
    if (extra < 5) return new Uint8Array(0);
    const blocks = Math.ceil((extra - 3) / 256);
    const dataLen = Math.max(1, extra - 3 - blocks);
    const out = new Uint8Array(3 + dataLen + Math.ceil(dataLen / 255));
    out[0] = 0x21; out[1] = 0xFE;
    let o = 2, left = dataLen;
    const text = filler(Math.min(255, dataLen));
    while (left > 0) {
      const n = Math.min(255, left);
      out[o++] = n; out.set(text.subarray(0, n), o); o += n; left -= n;
    }
    out[o] = 0;
    return out.subarray(0, o + 1);
  }

  // ── Encoders ───────────────────────────────────────────────────────
  // GIF with a fixed 128-color palette. LZW codes stay 8 bits wide because a
  // clear code is sent every 120 pixels, so each pixel is one byte.
  function encodeGif(canvas, target) {
    const w = canvas.width, h = canvas.height;
    const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const head = new Uint8Array(13 + 384 + 10 + 1);
    head.set(enc.encode('GIF89a'));
    setU16le(head, 6, w); setU16le(head, 8, h);
    head[10] = 0xF6;                                   // 128-color global table
    for (let i = 0; i < 128; i++) {
      head[13 + i * 3]     = ((i >> 5) & 3) * 85;
      head[13 + i * 3 + 1] = ((i >> 2) & 7) * 36;
      head[13 + i * 3 + 2] = (i & 3) * 85;
    }
    let o = 13 + 384;
    head[o] = 0x2C; setU16le(head, o + 5, w); setU16le(head, o + 7, h);
    head[o + 10] = 7;                                  // LZW minimum code size

    const count = w * h;
    const codes = new Uint8Array(count + Math.ceil(count / 120) + 2);
    let c = 0;
    for (let i = 0; i < count; i++) {
      if (i % 120 === 0) codes[c++] = 128;             // clear code
      const p = i * 4;
      codes[c++] = (px[p] >> 6) * 32 + (px[p + 1] >> 5) * 4 + (px[p + 2] >> 6);
    }
    codes[c++] = 129;                                  // end of information
    const blocks = new Uint8Array(c + Math.ceil(c / 255) + 1);
    let b = 0;
    for (let i = 0; i < c; i += 255) {
      const n = Math.min(255, c - i);
      blocks[b++] = n; blocks.set(codes.subarray(i, i + n), b); b += n;
    }
    blocks[b++] = 0;
    const body = [head, blocks.subarray(0, b)];
    const size = head.length + b + 1;
    return new Blob([...body, gifComment(target - size), new Uint8Array([0x3B])], { type: 'image/gif' });
  }

  // 24-bit uncompressed BMP; padding goes after the pixel data.
  function encodeBmp(canvas, target) {
    const w = canvas.width, h = canvas.height;
    const px = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const row = Math.ceil(w * 3 / 4) * 4;
    const pixels = row * h;
    const size = Math.max(54 + pixels, target);
    const out = new Uint8Array(54 + pixels);
    out[0] = 0x42; out[1] = 0x4D;
    setU32le(out, 2, size); setU32le(out, 10, 54);
    setU32le(out, 14, 40); setU32le(out, 18, w); setU32le(out, 22, h);
    setU16le(out, 26, 1); setU16le(out, 28, 24); setU32le(out, 34, pixels);
    for (let y = 0; y < h; y++) {
      const src = (h - 1 - y) * w * 4, dst = 54 + y * row;
      for (let x = 0; x < w; x++) {
        out[dst + x * 3]     = px[src + x * 4 + 2];
        out[dst + x * 3 + 1] = px[src + x * 4 + 1];
        out[dst + x * 3 + 2] = px[src + x * 4];
      }
    }
    return new Blob([out, filler(size - out.length)], { type: 'image/bmp' });
  }

  function encodeSvg(w, h, target) {
    const fs = Math.max(6, Math.round(Math.min(w / 9, h / 4)));
    const head = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d2130"/><stop offset=".5" stop-color="#3a2f6b"/><stop offset="1" stop-color="#0f3b36"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="${fs}" text-anchor="middle">${w} × ${h}</text>
  <text x="50%" y="50%" dy="${Math.round(fs * .8)}" fill="#ff8a8a" font-family="Segoe UI, Arial, sans-serif" font-weight="600" font-size="${Math.round(fs * .35)}" text-anchor="middle">SVG test file</text>
  <!-- `;
    const tail = ` -->
</svg>
`;
    const base = enc.encode(head).length + enc.encode(tail).length;
    return new Blob([head, filler(target - base), tail], { type: 'image/svg+xml' });
  }

  // One-page PDF; padding is an extra, unreferenced stream object.
  function encodePdf(target) {
    const content = 'BT /F1 36 Tf 72 690 Td (QA test file) Tj /F1 14 Tf 0 -30 Td (Dummy PDF for upload testing.) Tj ET';
    const objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    const build = padLen => {
      const parts = [enc.encode('%PDF-1.4\n')];
      const offsets = [];
      let pos = parts[0].length;
      const all = [...objs, `<< /Length ${padLen} >>\nstream\n`];
      all.forEach((body, i) => {
        offsets.push(pos);
        const isPad = i === all.length - 1;
        const text = enc.encode(`${i + 1} 0 obj\n${body}${isPad ? '' : '\nendobj\n'}`);
        parts.push(text); pos += text.length;
        if (isPad) {
          const pad = filler(padLen);
          const end = enc.encode('\nendstream\nendobj\n');
          parts.push(pad, end); pos += pad.length + end.length;
        }
      });
      const xref = 'xref\n0 ' + (all.length + 1) + '\n0000000000 65535 f \n' +
        offsets.map(off => String(off).padStart(10, '0') + ' 00000 n \n').join('') +
        `trailer\n<< /Size ${all.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
      parts.push(enc.encode(xref));
      return { parts, size: pos + enc.encode(xref).length };
    };
    const base = build(0).size;
    return new Blob(build(Math.max(0, target - base - 8)).parts, { type: 'application/pdf' });
  }

  function encodeTxt(target) {
    const head = 'QA test file\nDummy text file for upload testing.\n\n';
    return new Blob([head, filler(target - head.length, 'QA test file - filler text for upload testing.\n')], { type: 'text/plain' });
  }

  function encodeCsv(target) {
    const rows = ['id,name,email,notes'];
    let size = rows[0].length + 1;
    for (let i = 1; size < target; i++) {
      const r = `${i},Test User ${i},test.user${i}@example.com,Filler row for upload testing`;
      rows.push(r); size += r.length + 1;
    }
    return new Blob([rows.join('\n') + '\n'], { type: 'text/csv' });
  }

  function encodeJson(target) {
    const head = '{\n  "description": "QA test file for upload testing",\n  "items": [\n';
    const items = [];
    let size = head.length + 6;
    for (let i = 1; size < target || i === 1; i++) {
      const it = `    {"id": ${i}, "name": "Test item ${i}", "notes": "Filler item for upload testing"}`;
      items.push(it); size += it.length + 2;
    }
    return new Blob([head + items.join(',\n') + '\n  ]\n}\n'], { type: 'application/json' });
  }

  // ── Generate ───────────────────────────────────────────────────────
  async function generate(type, size, w, h) {
    if (size === 0) return new Blob([], { type: TYPES[type].mime });
    const target = size + OVER_BY;
    const label = `${type.toUpperCase()} test file`;
    switch (type) {
      case 'png': {
        const b = new Uint8Array(await (await toBlob(drawCanvas(w, h, label), 'image/png')).arrayBuffer());
        return new Blob(padPng(b, target), { type: 'image/png' });
      }
      case 'jpg': {
        const b = new Uint8Array(await (await toBlob(drawCanvas(w, h, label), 'image/jpeg', .92)).arrayBuffer());
        return new Blob(padJpg(b, target), { type: 'image/jpeg' });
      }
      case 'webp': {
        const blob = await toBlob(drawCanvas(w, h, label), 'image/webp', .9);
        if (blob.type !== 'image/webp') throw new Error("This browser can't create WebP files. Try Chrome, Edge or Firefox.");
        return new Blob(padWebp(new Uint8Array(await blob.arrayBuffer()), target), { type: 'image/webp' });
      }
      case 'gif':  return encodeGif(drawCanvas(w, h, label), target);
      case 'bmp':  return encodeBmp(drawCanvas(w, h, label), target);
      case 'svg':  return encodeSvg(w, h, target);
      case 'pdf':  return encodePdf(target);
      case 'txt':  return encodeTxt(target);
      case 'csv':  return encodeCsv(target);
      case 'json': return encodeJson(target);
    }
  }

  // ── Form wiring ────────────────────────────────────────────────────
  function readForm() {
    const type = form.elements.type.value;
    const size = Number(form.elements.size.value);
    // Plain text fields: accept digits only (spaces and "px" are ignored).
    const num = el => { const v = el.value.trim().replace(/\s*px$/i, ''); return /^\d+$/.test(v) ? Number(v) : NaN; };
    const w = num(widthIn), h = num(heightIn);
    const image = TYPES[type].image;
    const dim = n => Number.isNaN(n) ? '?' : n;
    const name = `test-file_${sizeLabel(size)}${image ? `_${dim(w)}x${dim(h)}` : ''}.${type}`;
    return { type, size, w, h, image, name };
  }

  function dimsError({ w, h }) {
    if (!(w >= 1 && h >= 1)) return 'Enter a width and height in whole pixels, at least 1 each.';
    if (w > MAX_SIDE || h > MAX_SIDE) return `Width and height can each be at most ${MAX_SIDE.toLocaleString('en-US')} pixels.`;
    if (w * h > MAX_PIXELS) return 'That image is too large to create in the browser. Keep width × height under 50 million pixels.';
    return '';
  }

  function update() {
    const f = readForm();
    dimsGroup.disabled = !f.image;
    preview.textContent = f.name;
  }

  form.addEventListener('change', update);
  form.addEventListener('input', update);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = readForm();
    const err = f.image ? dimsError(f) : '';
    if (err) { status.textContent = err; status.className = 'gen-status is-error'; (f.w >= 1 ? heightIn : widthIn).focus(); return; }

    button.disabled = true;
    status.className = 'gen-status';
    status.textContent = `Creating ${f.name}…`;
    try {
      // Let the status message paint before any heavy work starts.
      await new Promise(r => setTimeout(r, 30));
      const blob = await generate(f.type, f.size, f.w, f.h);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);

      let msg = `Downloaded ${f.name}: ${fmtBytes(blob.size)}.`;
      if (f.size === 0) msg += ' It is empty; only the file extension is set.';
      else if (blob.size > (f.size + OVER_BY) * 1.05) msg += ` It is larger than ${sizeLabel(f.size).replace(/(\d)([KM])/, '$1 $2')} because a ${f.w} × ${f.h} ${f.type.toUpperCase()} can't be smaller. Use smaller dimensions for a smaller file.`;
      status.textContent = msg;
      status.className = 'gen-status is-ok';
    } catch (ex) {
      status.textContent = ex.message || 'Something went wrong creating the file.';
      status.className = 'gen-status is-error';
    } finally {
      button.disabled = false;
    }
  });

  update();
})();
