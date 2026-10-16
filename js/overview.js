/**
 * AFINTRIX ERP — Financial Overview controller
 *
 * Renders the command-center dashboard from `data.js`. Every figure on screen
 * is read from that module, so the markup holds no financial literals and the
 * period control genuinely re-derives the headline rather than restyling a
 * button.
 */

import {
  AGEING,
  FLOW,
  LIQUIDITY,
  ORG,
  PERIOD_SCOPES,
  POSTINGS,
  TRAJECTORY,
  TRIAGE,
  compact,
  money,
  percent,
  plain,
  share,
} from './data.js';

import { ageingDonut, liquidityChart, trajectoryChart } from './charts.js';
import { cellBars, microBar } from './visuals.js';
import { countUpOnView, moveIndicator, prefersReducedMotion, revealOnScroll } from './motion.js';
import { initPageHeader } from './header.js';

const TRIAGE_ICONS = {
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.8v5"/><path d="M12 16.2h.01"/>',
  bank: '<path d="m3 9.5 9-5.5 9 5.5"/><path d="M4.5 9.5V18M9.5 9.5V18M14.5 9.5V18M19.5 9.5V18"/><path d="M2.5 20.5h19"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13.5h6M9 17h4"/>',
};

const icon = (name, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRIAGE_ICONS[name] || ''}</svg>`;

const ARROW =
  '<svg class="afx-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>';

const $ = (sel, root = document) => root.querySelector(sel);

/* ----------------------------------------------------------------------- */
/* Period scoping                                                           */
/* ----------------------------------------------------------------------- */

const SCOPE_CAPTION = {
  fy: 'YTD',
  q1: 'Q1 to date',
  month: 'Aug 2026',
};

/**
 * Re-derive the headline for a scope. Returns null totals when the scope
 * contains no recorded activity, so the UI can show an empty state instead of
 * a misleading zero.
 */
function derivePosition(scopeId) {
  const scope = PERIOD_SCOPES.find((s) => s.id === scopeId) || PERIOD_SCOPES[0];
  const inScope = scope.months
    ? TRAJECTORY.periods.filter((p) => scope.months.includes(p.key))
    : TRAJECTORY.periods;

  const recorded = inScope.filter((p) => p.recorded);
  if (!recorded.length) {
    return { empty: true, periods: inScope, caption: SCOPE_CAPTION[scope.id] };
  }

  const income = recorded.reduce((s, p) => s + p.revenue, 0);
  const expenses = recorded.reduce((s, p) => s + p.expense, 0);

  // Month-over-month compares the latest recorded month against the one
  // before it in the full series — not against the start of the scope.
  const all = TRAJECTORY.periods.filter((p) => p.recorded);
  const last = recorded[recorded.length - 1];
  const idx = all.findIndex((p) => p.key === last.key);
  const prev = idx > 0 ? all[idx - 1] : null;
  const mom = prev && prev.net !== 0 ? last.net / prev.net - 1 : null;

  return {
    empty: false,
    periods: inScope,
    caption: SCOPE_CAPTION[scope.id],
    income,
    expenses,
    net: income - expenses,
    mom,
    momBasis: prev ? `${last.label} vs ${prev.label}` : null,
  };
}

/* ----------------------------------------------------------------------- */
/* Position band                                                            */
/* ----------------------------------------------------------------------- */

function renderPosition(root, snapshot) {
  const total = snapshot.income + snapshot.expenses;
  const incomeShare = total ? (snapshot.income / total) * 100 : 0;

  if (snapshot.empty) {
    root.innerHTML = `
      <div class="afx-chart-empty" style="padding:32px 16px">
        <span>No activity recorded for this period</span>
      </div>`;
    return;
  }

  const deltaClass = snapshot.mom === null ? '' : snapshot.mom >= 0 ? 'is-up' : 'is-down';
  const deltaHtml =
    snapshot.mom === null
      ? ''
      : `<span class="afx-delta ${deltaClass}" title="Net operating surplus, ${snapshot.momBasis}">
           ${percent(snapshot.mom)} MoM
         </span>`;

  root.innerHTML = `
    <div class="afx-metric-label">
      <span>Net Operating Surplus (${snapshot.caption})</span>
      ${deltaHtml}
    </div>

    <div class="afx-headline-value">
      <span class="afx-sym">${ORG.currencySymbol}</span><span data-count-net>0.00</span>
    </div>

    <div class="afx-composition">
      <div class="afx-comp-bar" role="img"
           aria-label="Income ${money(snapshot.income)} against expenses ${money(snapshot.expenses)}">
        <span class="afx-comp-seg is-income" style="width:${incomeShare}%"></span>
        <span class="afx-comp-seg is-expense" style="width:${100 - incomeShare}%"></span>
      </div>
      <dl class="afx-comp-legend">
        <div class="afx-comp-item" style="--marker:var(--brand)">
          <dt>Income</dt>
          <dd>${money(snapshot.income)}</dd>
        </div>
        <div class="afx-comp-item" style="--marker:color-mix(in srgb, var(--ink-faint) 55%, transparent)">
          <dt>Expenses</dt>
          <dd>${money(snapshot.expenses)}</dd>
        </div>
      </dl>
    </div>`;

  const counter = $('[data-count-net]', root);
  if (counter) {
    countUpOnView(counter, snapshot.net, (v) => plain(v), { duration: 1.2 });
  }

  // Grow the composition bar from the left on first paint. WAAPI again, so a
  // dropped frame cannot leave the bar collapsed.
  if (!prefersReducedMotion()) {
    root.querySelectorAll('.afx-comp-seg').forEach((seg, i) => {
      seg.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
        duration: 700,
        delay: 120 + i * 90,
        easing: 'cubic-bezier(.16,1,.3,1)',
        fill: 'none',
      });
    });
  }
}

function renderInstruments(root) {
  // Bars compare the four flows against the largest of them. The basis is
  // named in the tooltip so the bar can't be read as a progress figure.
  const peak = Math.max(...FLOW.map((f) => f.value));

  root.innerHTML = FLOW.map(
    (f, i) => `
    <a class="afx-instrument ${f.tone === 'critical' ? 'is-critical' : ''} ${f.tone === 'positive' ? 'is-positive' : ''}"
       href="${f.href}" title="${f.hint}" data-reveal-item>
      <div class="afx-inst-label">${f.label}</div>
      <div class="afx-inst-value"><span data-flow-count="${i}">${f.display}</span></div>
      <div class="afx-inst-meta">${f.meta}${ARROW}</div>
      <div class="afx-figure-visual">
        ${microBar({
          value: f.value,
          max: peak,
          tone: f.tone === 'critical' ? 'gold' : f.tone === 'positive' ? 'pos' : 'brand',
          basis: 'the largest flow shown',
          delay: 120 + i * 90,
        })}
      </div>
    </a>`
  ).join('');

  // Count each figure up in its own compact notation, matching how it reads
  // at rest ($3.63L, $47.00K).
  FLOW.forEach((f, i) => {
    const node = root.querySelector(`[data-flow-count="${i}"]`);
    if (node) countUpOnView(node, f.value, (v) => compact(v), { duration: 1, delay: i * 0.08 });
  });
}

/* ----------------------------------------------------------------------- */
/* Trajectory                                                               */
/* ----------------------------------------------------------------------- */

function setupTrajectory(scopeId) {
  const host = $('[data-chart="trajectory"]');
  const legend = $('[data-legend="trajectory"]');
  if (!host) return null;

  const hidden = new Set();
  const chart = trajectoryChart(host, { height: 430 });

  const draw = (id) => {
    const { periods } = derivePosition(id);
    chart.update({ periods, hidden: Array.from(hidden) });
  };

  if (legend) {
    legend.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-series]');
      if (!btn) return;
      const key = btn.dataset.series;
      if (hidden.has(key)) hidden.delete(key);
      else hidden.add(key);
      // Never allow every series to be hidden at once.
      if (hidden.size === 3) {
        hidden.delete(key);
        return;
      }
      btn.setAttribute('aria-pressed', String(!hidden.has(key)));
      draw(currentScope);
    });
  }

  let currentScope = scopeId;
  draw(currentScope);

  return {
    setScope(id) {
      currentScope = id;
      draw(id);
    },
  };
}

/* ----------------------------------------------------------------------- */
/* Receivables                                                              */
/* ----------------------------------------------------------------------- */

function setupAgeing() {
  const host = $('[data-chart="ageing"]');
  const list = $('[data-ageing-list]');
  if (!host) return;

  const donut = ageingDonut(host, { height: 190 });
  donut.update({ buckets: AGEING.buckets });

  if (!list) return;

  list.innerHTML = AGEING.buckets
    .map(
      (b) => `
      <a class="afx-ageing-row ${b.critical ? 'is-critical' : ''}"
         href="report.html"
         data-bucket="${b.id}"
         title="${b.hint}"
         style="--swatch:var(--chart-age-${b.tone})">
        <span class="afx-ageing-swatch"></span>
        <span>
          <span class="afx-ageing-name">${b.label}</span>
          <span class="afx-ageing-qual">${b.qualifier}</span>
        </span>
        <span class="afx-ageing-amount">
          <b>${money(b.value)}</b>
          <span>${share(b.share)}</span>
        </span>
      </a>`
    )
    .join('');

  // Hovering a row drives the donut, and vice versa.
  list.querySelectorAll('[data-bucket]').forEach((row) => {
    const id = row.dataset.bucket;
    row.addEventListener('mouseenter', () => donut.highlight(id));
    row.addEventListener('mouseleave', () => donut.highlight(null));
    row.addEventListener('focus', () => donut.highlight(id));
    row.addEventListener('blur', () => donut.highlight(null));
  });

  donut.onHighlight((id) => {
    list.querySelectorAll('[data-bucket]').forEach((row) => {
      row.classList.toggle('is-active', row.dataset.bucket === id);
    });
  });
}

function renderAgeingMatrix() {
  const host = $('[data-ageing-matrix]');
  if (!host) return;

  let cumulative = 0;
  host.innerHTML = AGEING.buckets
    .map((b) => {
      cumulative += b.value;
      const cum = cumulative;
      return `
      <div class="afx-ageing-tile ${b.critical ? 'is-critical' : ''}"
           style="--swatch:var(--chart-age-${b.tone})" data-reveal-item>
        <span class="afx-ageing-tile-bar"></span>
        <div class="afx-inst-label" style="${b.critical ? 'color:var(--gold-ink)' : ''}">
          ${b.label} &middot; ${b.qualifier}
        </div>
        <div class="afx-inst-value" style="${b.critical ? 'color:var(--gold-ink)' : ''}">
          ${money(b.value)}
        </div>
        <div class="afx-inst-meta" style="justify-content:space-between;${b.critical ? 'color:var(--gold-ink)' : ''}">
          <span class="afx-tile-share">${share(b.share)} of total</span>
          <span class="afx-tile-share">cum. ${compact(cum)}</span>
        </div>
      </div>`;
    })
    .join('');
}

/**
 * Liquidity summary. Every figure is computed from LIQUIDITY.points — opening,
 * peak and closing are actual observations, and the deficit count is simply
 * how many of those months sit below zero.
 */
function renderLiquidityStats() {
  const host = $('[data-liquidity-stats]');
  if (!host) return;

  const pts = LIQUIDITY.points;
  if (!pts.length) return;

  const opening = pts[0];
  const closing = pts[pts.length - 1];
  const peak = pts.reduce((best, p) => (p.value > best.value ? p : best), pts[0]);
  const deficitMonths = pts.filter((p) => p.value < 0);

  const tiles = [
    { label: 'Opening Position', value: money(opening.value), meta: opening.label, tone: '' },
    { label: 'Peak Position', value: money(peak.value), meta: peak.label, tone: 'is-positive' },
    { label: 'Closing Position', value: money(closing.value), meta: closing.label, tone: 'is-negative' },
    {
      label: 'Months in Deficit',
      value: String(deficitMonths.length),
      meta: deficitMonths.length
        ? `${deficitMonths[0].label} onward`
        : 'None in this window',
      tone: deficitMonths.length ? 'is-critical' : '',
    },
  ];

  host.innerHTML = tiles
    .map(
      (t) => `
      <div class="afx-instrument ${t.tone}" data-reveal-item>
        <div class="afx-inst-label">${t.label}</div>
        <div class="afx-inst-value">${t.value}</div>
        <div class="afx-inst-meta">${t.meta}</div>
      </div>`
    )
    .join('');
}

/**
 * Full-width ageing distribution. Segment widths are the real shares, so the
 * critical band's size on screen is its size in the ledger.
 */
function renderAgeingDistribution() {
  const host = $('[data-ageing-distribution]');
  if (!host) return;

  const pastTerms = AGEING.buckets
    .filter((b) => b.id !== 'b0')
    .reduce((sum, b) => sum + b.value, 0);

  host.innerHTML = `
    <div class="afx-dist-bar" role="img"
         aria-label="Ageing distribution: ${AGEING.buckets
           .map((b) => `${b.label} ${share(b.share)}`)
           .join(', ')}">
      ${AGEING.buckets
        .map(
          (b) => `<span class="afx-dist-seg${b.critical ? ' is-critical' : ''}"
                        style="width:${b.share * 100}%;background:var(--chart-age-${b.tone})"
                        title="${b.label}: ${money(b.value)}"></span>`
        )
        .join('')}
    </div>
    <div class="afx-dist-meta">
      <span><b>${share(pastTerms / AGEING.total)}</b> of outstanding is past agreed terms
        (<span class="num">${money(pastTerms)}</span>)</span>
      <span class="afx-dist-critical">${share(AGEING.buckets[3].share)} critical &middot;
        <span class="num">${money(AGEING.buckets[3].value)}</span></span>
    </div>`;
}

/* ----------------------------------------------------------------------- */
/* Triage & postings                                                        */
/* ----------------------------------------------------------------------- */

function renderTriage() {
  const host = $('[data-triage]');
  if (!host) return;

  host.innerHTML = TRIAGE.map(
    (t) => `
    <a class="afx-triage-item is-${t.tone}" href="${t.href}" data-reveal-item>
      <span class="afx-triage-icon">${icon(t.icon)}</span>
      <span class="afx-triage-text">
        <span class="afx-triage-title">${t.title}</span>
        <span class="afx-triage-detail">${t.detail}</span>
      </span>
      <span class="afx-triage-trail">${t.trailing}${ARROW}</span>
    </a>`
  ).join('');

  // The overdue row carries a real ratio — its share of total receivables.
  const overdue = host.querySelector('.afx-triage-item.is-critical .afx-triage-text');
  if (overdue) {
    overdue.insertAdjacentHTML(
      'beforeend',
      `<span class="afx-figure-visual">${microBar({
        value: AGEING.buckets[3].value,
        max: AGEING.total,
        tone: 'gold',
        basis: 'total receivables outstanding',
        delay: 240,
      })}</span>`
    );
  }
}

function renderPostings() {
  const body = $('[data-postings]');
  if (!body) return;

  body.innerHTML = POSTINGS.map(
    (p) => `
    <tr>
      <td class="primary-ref"><a href="form.html">${p.voucher}</a></td>
      <td>${p.account}</td>
      <td class="numeric">${p.date}</td>
      <td class="numeric">${plain(p.amount)}</td>
    </tr>`
  ).join('');

  // Relative magnitude behind the amount column, so the biggest postings are
  // visible without reading every digit.
  cellBars(body, 3, 'brand');
}

/* ----------------------------------------------------------------------- */
/* Controls: tabs + period scope                                            */
/* ----------------------------------------------------------------------- */

function setupTabs(onShow) {
  const tabs = $('[data-tabs]');
  if (!tabs) return;
  const indicator = $('.afx-tab-indicator', tabs);

  const activate = (btn, focus = false, pushUrl = true) => {
    tabs.querySelectorAll('button[role="tab"]').forEach((b) => {
      const selected = b === btn;
      b.setAttribute('aria-selected', String(selected));
      b.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(b.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    moveIndicator(indicator, btn);
    if (focus) btn.focus();
    // Reflect the view in the URL so a particular panel can be linked to.
    if (pushUrl) {
      history.replaceState(null, '', `#${btn.dataset.view}`);
    }
    if (onShow) onShow(btn.dataset.view);
  };

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[role="tab"]');
    if (btn) activate(btn);
  });

  // Roving focus: arrow keys move between tabs, per WAI-ARIA tabs pattern.
  tabs.addEventListener('keydown', (e) => {
    const list = Array.from(tabs.querySelectorAll('button[role="tab"]'));
    const i = list.indexOf(document.activeElement);
    if (i === -1) return;
    let next = null;
    if (e.key === 'ArrowRight') next = list[(i + 1) % list.length];
    if (e.key === 'ArrowLeft') next = list[(i - 1 + list.length) % list.length];
    if (e.key === 'Home') next = list[0];
    if (e.key === 'End') next = list[list.length - 1];
    if (next) {
      e.preventDefault();
      activate(next, true);
    }
  });

  const fromHash = () => {
    const view = location.hash.replace('#', '');
    return view ? tabs.querySelector(`button[data-view="${CSS.escape(view)}"]`) : null;
  };

  const initial =
    fromHash() || tabs.querySelector('button[aria-selected="true"]') || tabs.querySelector('button');
  if (initial) activate(initial, false, false);

  window.addEventListener('hashchange', () => {
    const btn = fromHash();
    if (btn && btn.getAttribute('aria-selected') !== 'true') activate(btn, false, false);
  });

  window.addEventListener('resize', () => {
    const current = tabs.querySelector('button[aria-selected="true"]');
    if (current) moveIndicator(indicator, current);
  });
}

function setupPeriodScope(onChange) {
  const seg = $('[data-period]');
  if (!seg) return PERIOD_SCOPES[0].id;
  const indicator = $('.afx-segment-indicator', seg);

  const activate = (btn) => {
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
    moveIndicator(indicator, btn);
    onChange(btn.dataset.scope);
  };

  seg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-scope]');
    if (btn) activate(btn);
  });

  const initial = seg.querySelector('button[aria-selected="true"]') || seg.querySelector('button');
  if (initial) requestAnimationFrame(() => moveIndicator(indicator, initial));

  window.addEventListener('resize', () => {
    const current = seg.querySelector('button[aria-selected="true"]');
    if (current) moveIndicator(indicator, current);
  });

  return initial ? initial.dataset.scope : PERIOD_SCOPES[0].id;
}

/* ----------------------------------------------------------------------- */
/* Boot                                                                     */
/* ----------------------------------------------------------------------- */

function boot() {
  const positionHost = $('[data-position]');
  const instrumentHost = $('[data-instruments]');
  if (!positionHost) return;

  let scopeId = 'fy';
  let trajectory = null;

  const paint = (id) => {
    scopeId = id;
    renderPosition(positionHost, derivePosition(id));
    if (trajectory) trajectory.setScope(id);
  };

  if (instrumentHost) renderInstruments(instrumentHost);
  renderTriage();
  renderPostings();
  setupAgeing();
  renderAgeingMatrix();
  renderAgeingDistribution();
  renderLiquidityStats();

  scopeId = setupPeriodScope(paint) || 'fy';
  renderPosition(positionHost, derivePosition(scopeId));
  trajectory = setupTrajectory(scopeId);

  // Liquidity chart is built lazily, the first time its tab is shown, so its
  // width is measured against a visible container rather than a hidden one.
  let liquidity = null;
  setupTabs((view) => {
    if (view === 'cash' && !liquidity) {
      const host = $('[data-chart="liquidity"]');
      if (host) {
        liquidity = liquidityChart(host, { height: 260 });
        liquidity.update({ points: LIQUIDITY.points });
      }
    }
  });

  revealOnScroll('[data-reveal]');
  initPageHeader();

  /**
   * Sync re-reads the data module and re-renders in place. Existing chart
   * instances are reused via their own update paths rather than rebuilt, so
   * repeated syncs cannot pile up resize/theme observers.
   */
  document.addEventListener('afx:refresh', (e) => {
    if (instrumentHost) renderInstruments(instrumentHost);
    renderTriage();
    renderPostings();
    renderAgeingMatrix();
    renderAgeingDistribution();
    renderLiquidityStats();
    paint(scopeId);
    if (e.detail) e.detail.done = Promise.resolve();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
