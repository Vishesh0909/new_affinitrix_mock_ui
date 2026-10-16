/**
 * AFINTRIX ERP — Visual primitives for numeric figures
 *
 * Small, composable graphics that sit next to a number and show its shape:
 * proportional bars, stacked splits, radial gauges and sparklines.
 *
 * Two rules every primitive follows:
 *
 *  1. Nothing is invented. A visual is only drawn when the underlying values
 *     genuinely exist, and a comparison bar always states its basis so the
 *     reader knows what 100% means.
 *  2. The resting state is the finished state. Animation is applied with CSS
 *     `animation` over a transform or a dash offset, never by setting a
 *     "from" value in the element's own style — so a dropped frame or a
 *     disabled animation still leaves a correct, fully drawn graphic.
 */

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const clampPct = (n) => Math.max(0, Math.min(100, n));

/* ----------------------------------------------------------------------- */
/* Proportional bar                                                         */
/* ----------------------------------------------------------------------- */

/**
 * A single bar showing `value` against `max`.
 * @param {object} o  { value, max, tone, basis, delay }
 */
export function microBar(o) {
  if (!o || !o.max) return '';
  const pct = clampPct((o.value / o.max) * 100);
  const tone = o.tone || 'brand';
  const basis = o.basis ? ` of ${esc(o.basis)}` : '';
  return `
    <span class="afx-microbar" role="img" aria-label="${pct.toFixed(0)}%${basis}"
          title="${pct.toFixed(0)}%${basis}">
      <span class="afx-microbar-fill is-${tone}"
            style="width:${pct}%;animation-delay:${o.delay || 0}ms"></span>
    </span>`;
}

/* ----------------------------------------------------------------------- */
/* Stacked split                                                            */
/* ----------------------------------------------------------------------- */

/**
 * A stacked bar of parts that together make a whole.
 * @param {Array} segments  [{ value, color, label }]
 */
export function stackBar(segments) {
  const parts = (segments || []).filter((s) => s && s.value > 0);
  if (!parts.length) return '';
  const total = parts.reduce((sum, s) => sum + s.value, 0);
  if (!total) return '';

  const label = parts.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ');

  return `
    <span class="afx-stackbar" role="img" aria-label="${esc(label)}">
      ${parts
        .map(
          (s, i) => `<span class="afx-stackbar-seg" title="${esc(s.label)}"
                 style="width:${(s.value / total) * 100}%;background:${s.color};animation-delay:${i * 90}ms"></span>`
        )
        .join('')}
    </span>`;
}

/* ----------------------------------------------------------------------- */
/* Radial gauge                                                             */
/* ----------------------------------------------------------------------- */

/**
 * A ring gauge for a genuine ratio (a percentage or an x-of-y).
 * @param {object} o  { pct, size, tone, caption }
 */
export function ring(o) {
  const size = o.size || 54;
  const stroke = o.stroke || 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = clampPct(o.pct);
  const offset = circ * (1 - pct / 100);
  const tone = o.tone || 'brand';

  return `
    <span class="afx-ring" role="img" aria-label="${pct.toFixed(1)}%${o.caption ? ' ' + esc(o.caption) : ''}">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="afx-ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}"
                fill="none" stroke-width="${stroke}"/>
        <circle class="afx-ring-value is-${tone}" cx="${size / 2}" cy="${size / 2}" r="${r}"
                fill="none" stroke-width="${stroke}" stroke-linecap="round"
                transform="rotate(-90 ${size / 2} ${size / 2})"
                style="--circ:${circ};stroke-dasharray:${circ};stroke-dashoffset:${offset}"/>
      </svg>
      <span class="afx-ring-label">${o.label !== undefined ? esc(o.label) : `${Math.round(pct)}%`}</span>
    </span>`;
}

/* ----------------------------------------------------------------------- */
/* Sparkline                                                                */
/* ----------------------------------------------------------------------- */

/**
 * A bare trend line. Drawn only when there are at least two real readings —
 * a single point has no trend and would be decoration.
 * @param {number[]} values
 */
export function sparkline(values, o = {}) {
  if (!Array.isArray(values) || values.length < 2) return '';
  const w = o.width || 92;
  const h = o.height || 26;
  const pad = 2;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const x = (i) => (w / (values.length - 1)) * i;
  const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);

  const coords = values.map((v, i) => [x(i), y(v)]);
  const pts = coords.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const last = values[values.length - 1];

  // Measure the path so the draw-in animation matches its actual length
  // rather than relying on a fixed dash estimate.
  let len = 0;
  for (let i = 1; i < coords.length; i += 1) {
    len += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1]);
  }
  len = Math.ceil(len);
  const tone = o.tone || (last < 0 ? 'neg' : 'brand');

  // Shade the region below zero when the series crosses it.
  const zeroLine =
    min < 0 && max > 0
      ? `<line x1="0" y1="${y(0).toFixed(1)}" x2="${w}" y2="${y(0).toFixed(1)}"
               class="afx-spark-zero"/>`
      : '';

  return `
    <span class="afx-spark" role="img" aria-label="${esc(o.label || 'Trend')}">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        ${zeroLine}
        <polyline class="afx-spark-line is-${tone}" points="${pts}" fill="none"
                  style="--len:${len};stroke-dasharray:${len};stroke-dashoffset:0"/>
        <circle class="afx-spark-dot is-${tone}" cx="${x(values.length - 1).toFixed(1)}"
                cy="${y(last).toFixed(1)}" r="2.4"/>
      </svg>
    </span>`;
}

/* ----------------------------------------------------------------------- */
/* Table enhancers                                                          */
/* ----------------------------------------------------------------------- */

/**
 * Draw a proportional bar behind the numbers in one column, so relative
 * magnitude is readable without comparing digits. Values are parsed from the
 * rendered text, so this works on server-rendered tables too.
 *
 * @param {HTMLElement} scope   table or tbody
 * @param {number} columnIndex  zero-based
 */
export function cellBars(scope, columnIndex, tone = 'brand') {
  if (!scope) return;
  const rows = Array.from(scope.querySelectorAll('tbody tr, tr')).filter((r) =>
    r.querySelector('td')
  );
  if (!rows.length) return;

  const read = (row) => {
    const cell = row.children[columnIndex];
    if (!cell) return null;
    const n = parseFloat(cell.textContent.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? { cell, value: Math.abs(n) } : null;
  };

  const entries = rows.map(read).filter(Boolean);
  if (entries.length < 2) return;

  const max = Math.max(...entries.map((e) => e.value));
  if (!max) return;

  entries.forEach((e, i) => {
    if (e.cell.querySelector('.afx-cellbar')) return;
    e.cell.classList.add('afx-has-cellbar');
    const bar = document.createElement('span');
    bar.className = `afx-cellbar is-${tone}`;
    bar.style.width = `${clampPct((e.value / max) * 100)}%`;
    bar.style.animationDelay = `${i * 60}ms`;
    bar.setAttribute('aria-hidden', 'true');
    e.cell.appendChild(bar);
  });
}

/**
 * Turn plain "87%" cells into a labelled bar. Purely additive: a cell whose
 * text is not a bare percentage is left untouched.
 */
export function percentCells(root = document) {
  root.querySelectorAll('table.saas-table td, table.data-table td').forEach((cell) => {
    // Rewriting innerHTML would destroy a link or badge living in the cell.
    if (cell.children.length) return;
    const text = cell.textContent.trim();
    const m = /^(\d{1,3}(?:\.\d+)?)\s*%$/.exec(text);
    if (!m) return;

    const pct = clampPct(parseFloat(m[1]));
    const tone = pct >= 100 ? 'pos' : pct === 0 ? 'muted' : 'brand';
    cell.innerHTML = `
      <span class="afx-pct">
        <span class="afx-pct-value">${esc(text)}</span>
        <span class="afx-microbar">
          <span class="afx-microbar-fill is-${tone}" style="width:${pct}%"></span>
        </span>
      </span>`;
  });
}
