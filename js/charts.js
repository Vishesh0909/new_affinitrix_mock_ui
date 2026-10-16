/**
 * AFINTRIX ERP — Chart Engine
 *
 * Dependency-free SVG charting sized against the container's real pixel width
 * (rather than a scaled viewBox) so axis labels stay at their true type size
 * from mobile through ultrawide.
 *
 * Every chart:
 *   - reads brand colours from CSS custom properties, so it follows the theme
 *   - exposes hover AND keyboard focus for each data point
 *   - animates on entry unless the user prefers reduced motion
 *   - renders an explicit empty state rather than drawing a zero line
 *
 * Each factory returns { update(data), destroy() }.
 */

import { axisLabel, compact, money, share } from './data.js';

const NS = 'http://www.w3.org/2000/svg';

const reduceMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  return node;
}

/** Resolve a CSS custom property to a concrete colour at render time. */
function token(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Re-render on container resize and on theme change, coalesced into one frame
 * so a drag-resize does not thrash layout.
 */
function observe(container, render) {
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  };

  const ro = new ResizeObserver(schedule);
  ro.observe(container);

  const mo = new MutationObserver(schedule);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    mo.disconnect();
  };
}

/**
 * Pick a "nice" axis step (1, 2, 2.5, 5 or 10 x a power of ten) so gridlines
 * land on round currency values instead of arbitrary fractions of the range.
 */
function niceScale(min, max, targetTicks = 4) {
  const range = max - min || Math.abs(max) || 1;
  const raw = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  let mult;
  if (norm <= 1) mult = 1;
  else if (norm <= 2) mult = 2;
  else if (norm <= 2.5) mult = 2.5;
  else if (norm <= 5) mult = 5;
  else mult = 10;
  const step = mult * mag;
  return {
    step,
    bottom: Math.floor(min / step) * step,
    top: Math.ceil(max / step) * step,
  };
}

/** Shared floating tooltip, positioned against the chart wrapper. */
function createTooltip(wrapper) {
  const tip = document.createElement('div');
  tip.className = 'afx-chart-tip';
  tip.setAttribute('role', 'status');
  tip.setAttribute('aria-live', 'polite');
  tip.hidden = true;
  wrapper.appendChild(tip);

  return {
    node: tip,
    show(html, x, y) {
      tip.innerHTML = html;
      tip.hidden = false;
      const bounds = wrapper.getBoundingClientRect();
      const width = tip.offsetWidth;
      // Keep the tip inside the card at both edges.
      const left = Math.max(8, Math.min(x - width / 2, bounds.width - width - 8));
      tip.style.transform = `translate(${left}px, ${y}px)`;
      tip.classList.add('is-visible');
    },
    hide() {
      tip.classList.remove('is-visible');
      tip.hidden = true;
    },
    destroy() {
      tip.remove();
    },
  };
}

function emptyState(wrapper, message) {
  const box = document.createElement('div');
  box.className = 'afx-chart-empty';
  box.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 3v18h18v-2H5V3H3zm6 12h2v4H9v-4zm4-4h2v8h-2v-8zm4 6h2v2h-2v-2z"/>
    </svg>
    <span>${message}</span>`;
  wrapper.appendChild(box);
}

/** Prepare a wrapper + sized <svg>, returning null when too small to draw. */
function prepare(container, height) {
  container.textContent = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'afx-chart-wrap';
  container.appendChild(wrapper);

  const width = Math.floor(wrapper.clientWidth || container.clientWidth);
  if (width < 80) return null;

  const svg = el('svg', {
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    class: 'afx-chart-svg',
  });
  wrapper.appendChild(svg);
  return { wrapper, svg, width, height };
}

/* ======================================================================== */
/* Operating trajectory — grouped revenue/expense bars + net line           */
/* ======================================================================== */

/**
 * @param {HTMLElement} container
 * @param {object} opts  { height, onSelect }
 */
export function trajectoryChart(container, opts = {}) {
  const height = opts.height || 300;
  let periods = [];
  let hidden = new Set();
  let teardown = () => {};
  let tooltip = null;

  function render() {
    if (tooltip) tooltip.destroy();
    const base = prepare(container, height);
    if (!base) return;
    const { wrapper, svg, width } = base;
    tooltip = createTooltip(wrapper);

    const recorded = periods.filter((p) => p.recorded);
    if (!recorded.length) {
      emptyState(wrapper, 'No activity recorded for this period');
      return;
    }

    const colors = {
      revenue: token('--chart-1', '#1E39D6'),
      expense: token('--chart-2', '#D5AA55'),
      net: token('--chart-3', '#0D824D'),
      grid: token('--border-subtle', '#EDF1F7'),
      axis: token('--border', '#E2E6EF'),
      ink: token('--ink-muted', '#828FA6'),
      inkSoft: token('--ink-faint', '#B1BACB'),
      ghost: token('--chart-ghost', '#EDF1F7'),
    };

    const pad = { top: 18, right: 14, bottom: 34, left: 46 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    if (plotW < 40) return;

    const visible = (key) => !hidden.has(key);
    const values = [];
    recorded.forEach((p) => {
      if (visible('revenue')) values.push(p.revenue);
      if (visible('expense')) values.push(p.expense);
      if (visible('net')) values.push(p.net);
    });
    // 8% headroom so the tallest bar never collides with the top gridline.
    const max = Math.max(...values, 1) * 1.08;
    const scale = niceScale(0, max, 5);
    const top = scale.top;
    const y = (v) => pad.top + plotH - (v / top) * plotH;

    const slot = plotW / periods.length;
    const barW = Math.max(4, Math.min(26, slot * 0.3));
    const gap = 3;

    svg.setAttribute(
      'aria-label',
      `Monthly revenue, expense and net operating result. Activity recorded for ${recorded
        .map((p) => `${p.label} ${p.year}`)
        .join(' and ')}.`
    );

    /* Gridlines + value axis */
    for (let v = 0; v <= top + 1; v += scale.step) {
      const i = v === 0 ? 0 : 1;
      const gy = y(v);
      svg.appendChild(
        el('line', {
          x1: pad.left,
          y1: gy,
          x2: width - pad.right,
          y2: gy,
          stroke: i === 0 ? colors.axis : colors.grid,
          'stroke-width': i === 0 ? 1.25 : 1,
        })
      );
      const label = el('text', {
        x: pad.left - 10,
        y: gy + 3.5,
        'text-anchor': 'end',
        class: 'afx-axis-text',
        fill: colors.ink,
      });
      label.textContent = axisLabel(v);
      svg.appendChild(label);
    }

    /* Unrecorded region — hatched, never drawn as zero. A flat tint reads as
       "these months were zero"; diagonal hatching reads as "not yet known". */
    const firstGhost = periods.findIndex((p) => !p.recorded);
    if (firstGhost > -1) {
      const gx = pad.left + firstGhost * slot;
      const defs = el('defs');
      const pattern = el('pattern', {
        id: 'afxHatch',
        width: 7,
        height: 7,
        patternUnits: 'userSpaceOnUse',
        patternTransform: 'rotate(45)',
      });
      pattern.appendChild(el('rect', { width: 7, height: 7, fill: colors.ghost, opacity: 0.55 }));
      pattern.appendChild(
        el('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: colors.inkSoft, 'stroke-width': 1, opacity: 0.3 })
      );
      defs.appendChild(pattern);
      svg.appendChild(defs);

      svg.appendChild(
        el('rect', {
          x: gx,
          y: pad.top,
          width: Math.max(0, width - pad.right - gx),
          height: plotH,
          fill: 'url(#afxHatch)',
          class: 'afx-ghost-zone',
        })
      );
      if (width - pad.right - gx > 150) {
        const note = el('text', {
          x: gx + (width - pad.right - gx) / 2,
          y: pad.top + plotH / 2,
          'text-anchor': 'middle',
          class: 'afx-ghost-text',
          fill: colors.inkSoft,
        });
        note.textContent = 'No activity recorded yet';
        svg.appendChild(note);
      }
    }

    /* Bars */
    const barNodes = [];
    periods.forEach((p, i) => {
      if (!p.recorded) return;
      const cx = pad.left + i * slot + slot / 2;
      const series = [];
      if (visible('revenue')) series.push(['revenue', p.revenue, colors.revenue]);
      if (visible('expense')) series.push(['expense', p.expense, colors.expense]);

      const totalW = series.length * barW + (series.length - 1) * gap;
      series.forEach(([key, value, fill], idx) => {
        const bx = cx - totalW / 2 + idx * (barW + gap);
        const bh = Math.max(1, plotH - (y(value) - pad.top));
        const rect = el('rect', {
          x: bx,
          y: y(value),
          width: barW,
          height: bh,
          rx: Math.min(4, barW / 2),
          fill,
          class: `afx-bar afx-bar-${key}`,
        });
        svg.appendChild(rect);
        barNodes.push(rect);
      });
    });

    /* Net line across recorded periods */
    if (visible('net')) {
      const pts = periods
        .map((p, i) => (p.recorded ? [pad.left + i * slot + slot / 2, y(p.net)] : null))
        .filter(Boolean);

      if (pts.length > 1) {
        const path = el('polyline', {
          points: pts.map(([px, py]) => `${px},${py}`).join(' '),
          fill: 'none',
          stroke: colors.net,
          'stroke-width': 2.5,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          class: 'afx-net-line',
        });
        svg.appendChild(path);

        if (!reduceMotion()) {
          const len = path.getTotalLength();
          path.style.strokeDasharray = `${len}`;
          path.animate(
            [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
            { duration: 900, delay: 250, easing: 'ease-out', fill: 'none' }
          );
        }
      }

      pts.forEach(([px, py]) => {
        svg.appendChild(
          el('circle', {
            cx: px,
            cy: py,
            r: 4.5,
            fill: token('--surface', '#fff'),
            stroke: colors.net,
            'stroke-width': 2.5,
            class: 'afx-net-dot',
          })
        );
      });
    }

    /* Month axis */
    periods.forEach((p, i) => {
      const cx = pad.left + i * slot + slot / 2;
      // Drop alternate labels when the axis gets crowded.
      if (slot < 34 && i % 2 === 1 && !p.recorded) return;
      const t = el('text', {
        x: cx,
        y: height - 12,
        'text-anchor': 'middle',
        class: p.recorded ? 'afx-axis-month is-recorded' : 'afx-axis-month',
        fill: p.recorded ? token('--ink-secondary', '#57627B') : colors.inkSoft,
      });
      t.textContent = p.label;
      svg.appendChild(t);
    });

    /* Hover / focus bands — one per period, covering the full plot height. */
    periods.forEach((p, i) => {
      const bx = pad.left + i * slot;
      const band = el('rect', {
        x: bx,
        y: pad.top,
        width: slot,
        height: plotH,
        fill: 'transparent',
        class: 'afx-band',
        tabindex: 0,
        role: 'button',
      });

      const title = `${p.label} 20${p.year}`;
      const label = p.recorded
        ? `${title}: revenue ${money(p.revenue)}, expense ${money(p.expense)}, net ${money(p.net)}`
        : `${title}: no activity recorded`;
      band.setAttribute('aria-label', label);

      const body = p.recorded
        ? `<div class="afx-tip-head">${title}</div>
           <div class="afx-tip-row"><span class="afx-dot" style="background:${colors.revenue}"></span>Revenue<b>${money(p.revenue)}</b></div>
           <div class="afx-tip-row"><span class="afx-dot" style="background:${colors.expense}"></span>Expense<b>${money(p.expense)}</b></div>
           <div class="afx-tip-row is-total"><span class="afx-dot" style="background:${colors.net}"></span>Net<b>${money(p.net)}</b></div>`
        : `<div class="afx-tip-head">${title}</div>
           <div class="afx-tip-note">No activity recorded</div>`;

      const show = () => {
        band.classList.add('is-active');
        tooltip.show(body, bx + slot / 2, Math.max(8, pad.top - 4));
      };
      const hide = () => {
        band.classList.remove('is-active');
        tooltip.hide();
      };

      band.addEventListener('mouseenter', show);
      band.addEventListener('mouseleave', hide);
      band.addEventListener('focus', show);
      band.addEventListener('blur', hide);
      if (opts.onSelect) {
        band.addEventListener('click', () => opts.onSelect(p));
        band.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            opts.onSelect(p);
          }
        });
      }
      svg.appendChild(band);
    });

    /* Entry animation: bars rise from the baseline, staggered.
       Driven by the Web Animations API rather than a CSS transition, so the
       element's resting state is the finished one — if the animation never
       runs, the bar is still drawn. */
    if (!reduceMotion() && barNodes.length) {
      barNodes.forEach((rect, i) => {
        rect.style.transformBox = 'fill-box';
        rect.style.transformOrigin = '50% 100%';
        rect.animate(
          [
            { transform: 'scaleY(0)', opacity: 0 },
            { transform: 'scaleY(1)', opacity: 1 },
          ],
          { duration: 550, delay: i * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'none' }
        );
      });
    }
  }

  return {
    update(data) {
      periods = data.periods || [];
      hidden = new Set(data.hidden || []);
      teardown();
      render();
      teardown = observe(container, render);
    },
    destroy() {
      teardown();
      if (tooltip) tooltip.destroy();
      container.textContent = '';
    },
  };
}

/* ======================================================================== */
/* Receivables ageing — interactive donut                                   */
/* ======================================================================== */

export function ageingDonut(container, opts = {}) {
  const height = opts.height || 210;
  let buckets = [];
  let active = null;
  let teardown = () => {};
  const listeners = new Set();

  function render() {
    const base = prepare(container, height);
    if (!base) return;
    const { svg, width } = base;

    if (!buckets.length) return;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 10;
    const thickness = Math.max(14, radius * 0.25);
    const inner = radius - thickness;

    const total = buckets.reduce((s, b) => s + b.value, 0);
    svg.setAttribute('aria-label', `Receivables ageing distribution, total ${money(total)}.`);

    let angle = -Math.PI / 2;
    const arcs = [];

    buckets.forEach((b) => {
      const sweep = (b.value / total) * Math.PI * 2;
      const end = angle + sweep;
      // A 2px visual gap between segments, expressed in radians.
      const padAngle = Math.min(0.03, sweep / 6);
      const a0 = angle + padAngle / 2;
      const a1 = end - padAngle / 2;

      const large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const [x0, y0] = p(radius, a0);
      const [x1, y1] = p(radius, a1);
      const [x2, y2] = p(inner, a1);
      const [x3, y3] = p(inner, a0);

      const path = el('path', {
        d: `M${x0},${y0} A${radius},${radius} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${inner},${inner} 0 ${large} 0 ${x3},${y3} Z`,
        fill: token(`--chart-age-${b.tone}`, '#1E39D6'),
        class: `afx-arc${b.critical ? ' is-critical' : ''}`,
        tabindex: 0,
        role: 'button',
        'aria-label': `${b.label} ${b.qualifier}: ${money(b.value)}, ${share(b.share)} of outstanding`,
      });

      path.addEventListener('mouseenter', () => setActive(b.id));
      path.addEventListener('mouseleave', () => setActive(null));
      path.addEventListener('focus', () => setActive(b.id));
      path.addEventListener('blur', () => setActive(null));
      if (opts.onSelect) path.addEventListener('click', () => opts.onSelect(b));

      svg.appendChild(path);
      arcs.push({ id: b.id, path });
      angle = end;
    });

    /* Centre readout, which doubles as the hover detail surface. */
    const centre = el('g', { class: 'afx-donut-centre' });
    const capTop = el('text', {
      x: cx,
      y: cy - 12,
      'text-anchor': 'middle',
      class: 'afx-donut-cap',
      fill: token('--ink-muted', '#828FA6'),
    });
    const valueText = el('text', {
      x: cx,
      y: cy + 10,
      'text-anchor': 'middle',
      class: 'afx-donut-value',
      fill: token('--ink', '#111528'),
    });
    const subText = el('text', {
      x: cx,
      y: cy + 28,
      'text-anchor': 'middle',
      class: 'afx-donut-sub',
      fill: token('--ink-secondary', '#57627B'),
    });
    centre.append(capTop, valueText, subText);
    svg.appendChild(centre);

    function paint() {
      const b = active ? buckets.find((x) => x.id === active) : null;
      capTop.textContent = b ? b.label : 'Total Outstanding';
      valueText.textContent = b ? compact(b.value) : compact(total);
      subText.textContent = b ? `${share(b.share)} of outstanding` : `${buckets.length} ageing bands`;
      arcs.forEach((a) => a.path.classList.toggle('is-dim', Boolean(active) && a.id !== active));
    }

    function setActive(id) {
      active = id;
      paint();
      listeners.forEach((fn) => fn(id));
    }

    paint();

    if (!reduceMotion()) {
      arcs.forEach((a, i) => {
        a.path.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 400,
          delay: i * 70,
          easing: 'ease-out',
          fill: 'none',
        });
      });
    }

    container._setActive = setActive;
  }

  return {
    update(data) {
      buckets = data.buckets || [];
      teardown();
      render();
      teardown = observe(container, render);
    },
    /** Let an external legend drive the donut's highlight. */
    highlight(id) {
      if (container._setActive) container._setActive(id);
    },
    onHighlight(fn) {
      listeners.add(fn);
    },
    destroy() {
      teardown();
      listeners.clear();
      container.textContent = '';
    },
  };
}

/* ======================================================================== */
/* Liquidity — area chart crossing a zero baseline                          */
/* ======================================================================== */

export function liquidityChart(container, opts = {}) {
  const height = opts.height || 240;
  let points = [];
  let teardown = () => {};
  let tooltip = null;

  function render() {
    if (tooltip) tooltip.destroy();
    const base = prepare(container, height);
    if (!base) return;
    const { wrapper, svg, width } = base;
    tooltip = createTooltip(wrapper);

    if (!points.length) {
      emptyState(wrapper, 'No liquidity history available');
      return;
    }

    const pad = { top: 18, right: 16, bottom: 30, left: 52 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    if (plotW < 40) return;

    const vals = points.map((p) => p.value);
    const scale = niceScale(Math.min(...vals, 0), Math.max(...vals, 0), 4);
    const { top, bottom } = scale;

    const y = (v) => pad.top + plotH - ((v - bottom) / (top - bottom)) * plotH;
    const x = (i) => pad.left + (plotW / Math.max(1, points.length - 1)) * i;
    const zeroY = y(0);

    svg.setAttribute(
      'aria-label',
      `Bank liquidity over ${points.length} months, closing at ${money(points[points.length - 1].value)}.`
    );

    const brand = token('--chart-1', '#1E39D6');
    const neg = token('--neg', '#D32727');
    const grid = token('--border-subtle', '#EDF1F7');

    /* Gridlines */
    for (let v = bottom; v <= top + 1; v += scale.step) {
      const gy = y(v);
      svg.appendChild(
        el('line', { x1: pad.left, y1: gy, x2: width - pad.right, y2: gy, stroke: grid })
      );
      const t = el('text', {
        x: pad.left - 10,
        y: gy + 3.5,
        'text-anchor': 'end',
        class: 'afx-axis-text',
        fill: token('--ink-muted', '#828FA6'),
      });
      t.textContent = axisLabel(v);
      svg.appendChild(t);
    }

    /* Zero baseline, emphasised — it is the solvency line. */
    svg.appendChild(
      el('line', {
        x1: pad.left,
        y1: zeroY,
        x2: width - pad.right,
        y2: zeroY,
        stroke: token('--border-strong', '#CBD3E2'),
        'stroke-width': 1.5,
      })
    );

    /* Split fills above / below zero so an overdraft reads as a deficit. */
    const defs = el('defs');
    const mkGrad = (id, color, flip) => {
      const g = el('linearGradient', { id, x1: 0, y1: flip ? 1 : 0, x2: 0, y2: flip ? 0 : 1 });
      g.append(
        el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': 0.26 }),
        el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 })
      );
      return g;
    };
    defs.append(mkGrad('afxLiqPos', brand, false), mkGrad('afxLiqNeg', neg, true));
    svg.appendChild(defs);

    const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');

    const clipAbove = el('clipPath', { id: 'afxClipAbove' });
    clipAbove.appendChild(
      el('rect', { x: pad.left, y: pad.top, width: plotW, height: Math.max(0, zeroY - pad.top) })
    );
    const clipBelow = el('clipPath', { id: 'afxClipBelow' });
    clipBelow.appendChild(
      el('rect', { x: pad.left, y: zeroY, width: plotW, height: Math.max(0, pad.top + plotH - zeroY) })
    );
    defs.append(clipAbove, clipBelow);

    const areaPath = `${line.split(' ').map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(' ')} L${x(points.length - 1)},${zeroY} L${pad.left},${zeroY} Z`;
    svg.appendChild(el('path', { d: areaPath, fill: 'url(#afxLiqPos)', 'clip-path': 'url(#afxClipAbove)' }));
    svg.appendChild(el('path', { d: areaPath, fill: 'url(#afxLiqNeg)', 'clip-path': 'url(#afxClipBelow)' }));

    const poly = el('polyline', {
      points: line,
      fill: 'none',
      stroke: brand,
      'stroke-width': 2.6,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      class: 'afx-liq-line',
    });
    svg.appendChild(poly);

    if (!reduceMotion()) {
      const len = poly.getTotalLength();
      poly.style.strokeDasharray = `${len}`;
      poly.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: 1100, easing: 'ease-out', fill: 'none' }
      );
    }

    /* Closing marker */
    const last = points.length - 1;
    svg.appendChild(
      el('circle', {
        cx: x(last),
        cy: y(points[last].value),
        r: 5,
        fill: points[last].value < 0 ? neg : brand,
        stroke: token('--surface', '#fff'),
        'stroke-width': 2,
      })
    );

    /* Month axis — thinned to avoid collisions on narrow screens */
    const every = plotW / points.length < 44 ? 3 : 1;
    points.forEach((p, i) => {
      if (i % every !== 0 && i !== last) return;
      const t = el('text', {
        x: x(i),
        y: height - 10,
        'text-anchor': 'middle',
        class: 'afx-axis-month',
        fill: token('--ink-secondary', '#57627B'),
      });
      t.textContent = p.label;
      svg.appendChild(t);
    });

    /* Hover bands */
    const bandW = plotW / points.length;
    points.forEach((p, i) => {
      const band = el('rect', {
        x: Math.max(pad.left, x(i) - bandW / 2),
        y: pad.top,
        width: bandW,
        height: plotH,
        fill: 'transparent',
        class: 'afx-band',
        tabindex: 0,
        'aria-label': `${p.label}: ${money(p.value)}`,
      });
      const marker = el('circle', {
        cx: x(i),
        cy: y(p.value),
        r: 4,
        fill: p.value < 0 ? neg : brand,
        class: 'afx-liq-dot',
        opacity: 0,
      });
      svg.appendChild(marker);

      const show = () => {
        marker.setAttribute('opacity', '1');
        tooltip.show(
          `<div class="afx-tip-head">${p.label}</div>
           <div class="afx-tip-row is-total"><b class="${p.value < 0 ? 'is-neg' : ''}">${money(p.value)}</b></div>`,
          x(i),
          Math.max(8, y(p.value) - 56)
        );
      };
      const hide = () => {
        marker.setAttribute('opacity', '0');
        tooltip.hide();
      };
      band.addEventListener('mouseenter', show);
      band.addEventListener('mouseleave', hide);
      band.addEventListener('focus', show);
      band.addEventListener('blur', hide);
      svg.appendChild(band);
    });
  }

  return {
    update(data) {
      points = data.points || [];
      teardown();
      render();
      teardown = observe(container, render);
    },
    destroy() {
      teardown();
      if (tooltip) tooltip.destroy();
      container.textContent = '';
    },
  };
}
