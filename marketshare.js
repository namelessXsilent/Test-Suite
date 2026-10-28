// Renders the US vs Worldwide bar charts on marketshare.html from marketshare-data.js.
(function () {
  "use strict";
  const root = document.getElementById('shares');
  const sections = window.MARKET_SHARE;
  if (!root || !Array.isArray(sections)) return;

  // Rows under this share (%), or past this many rows, are folded into "Other"
  // so each chart stays short.
  const MIN_SHARE = 1;
  const MAX_ROWS = 10;

  // Browser families, matched against the start of a row's name, so browser
  // versions ("Chrome 150.0") take their browser's color. Longest names first.
  const BROWSERS = ['samsung internet', 'uc browser', 'chrome', 'edge', 'safari', 'firefox', 'opera', 'brave'];

  // Categorical colors for "entity" sections, handed out in order of first
  // appearance. Only safe for a few names (e.g. Desktop / Mobile): past three or
  // so, neighbouring colors stop passing color-blind checks, so use one color.
  const PALETTE = ['#3987e5', '#d95926', '#199e70'];
  const entityColors = {};   // section id -> { name -> color }

  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Parse a StatCounter CSV export: a header row, then "Name",value rows.
  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const header = lines.shift() || '';
    const period = (header.match(/\(([^)]+)\)/) || [])[1] || '';
    const rows = lines.map(line => {
      const m = line.match(/^"?(.*?)"?,\s*([\d.]+)\s*$/);
      return m ? { name: m[1], value: parseFloat(m[2]) } : null;
    }).filter(Boolean);

    const shown = rows.filter(r => r.name !== 'Other' && r.value >= MIN_SHARE).slice(0, MAX_ROWS);
    const other = rows.filter(r => !shown.includes(r)).reduce((sum, r) => sum + r.value, 0);
    if (other > 0) shown.push({ name: 'Other', value: Math.round(other * 100) / 100, other: true });
    return { period, rows: shown };
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // Color for one bar, per the section's `colors` setting (see marketshare-data.js).
  // Browser colors live in marketshare.css under data-key; the rest are set inline.
  function colorBar(li, name, section) {
    if (section.colors === 'browser') {
      const family = BROWSERS.find(b => name.toLowerCase().startsWith(b));
      li.dataset.key = slug(family || name);
    } else if (section.colors === 'entity') {
      const map = entityColors[section.id] ||= {};
      if (!map[name]) map[name] = PALETTE[Object.keys(map).length] || PALETTE[PALETTE.length - 1];
      li.style.setProperty('--bar', map[name]);
    } else if (section.colors) {
      li.style.setProperty('--bar', section.colors);
    }
  }

  // One chart. `scale` is shared by the US and Worldwide charts in a section
  // so equal shares draw as equal bar lengths on both sides.
  function renderChart(region, data, source, scale, section) {
    const fig = el('figure', 'chart');
    fig.appendChild(el('h3', null, region));

    const list = el('ol', 'bars');
    data.rows.forEach(r => {
      const li = el('li', r.other ? 'bar is-other' : 'bar');
      if (!r.other) colorBar(li, r.name, section);
      li.appendChild(el('span', 'bar-label', r.name));
      const track = el('span', 'bar-track');
      track.setAttribute('aria-hidden', 'true');
      const fill = el('span', 'bar-fill');
      fill.style.width = (r.value / scale * 100) + '%';
      track.appendChild(fill);
      li.appendChild(track);
      li.appendChild(el('span', 'bar-value', r.value + '%'));
      list.appendChild(li);
    });
    fig.appendChild(list);

    const cap = el('figcaption', null, data.period.replace(' - ', ' – ') + '. Source: ');
    const a = el('a', null, 'StatCounter Global Stats');
    a.href = source; a.target = '_blank'; a.rel = 'noopener';
    a.appendChild(el('span', 'sr-only', ' (opens in a new tab)'));
    cap.appendChild(a);
    fig.appendChild(cap);
    return fig;
  }

  sections.forEach(s => {
    const us = parseCsv(s.us.csv);
    const ww = parseCsv(s.ww.csv);
    const max = Math.max(...us.rows.map(r => r.value), ...ww.rows.map(r => r.value));
    const scale = Math.ceil(max / 10) * 10;

    const section = el('section', 'share');
    const h2 = el('h2', null, s.title);
    h2.id = s.id + '-h';
    section.setAttribute('aria-labelledby', h2.id);
    section.appendChild(h2);

    const split = el('div', 'split');
    split.appendChild(renderChart('United States', us, s.us.source, scale, s));
    split.appendChild(renderChart('Worldwide', ww, s.ww.source, scale, s));
    section.appendChild(split);
    root.appendChild(section);
  });
})();
