/**
 * AFINTRIX ERP — Executive Summary controller
 *
 * A roll-up across every module: headline figures, charts and one summary
 * table. Deliberately carries no line-level detail — no vouchers, no invoice
 * rows, no individual requests. Each block links to the screen that owns the
 * detail instead.
 *
 * Every figure is read from data.js, which in turn mirrors what the other
 * screens state on their own summary cards.
 */

import {
  AGEING,
  LEDGER,
  LIQUIDITY,
  MODULE_SUMMARY,
  ORG,
  POSITION,
  PROCUREMENT,
  TRAJECTORY,
  WORKFORCE,
  compact,
  money,
  percent,
  share,
} from './data.js';

import { ageingDonut, liquidityChart, trajectoryChart } from './charts.js';
import { microBar, ring, sparkline, stackBar } from './visuals.js';
import { countUpOnView, revealOnScroll } from './motion.js';
import { initPageHeader } from './header.js';

const $ = (sel, root = document) => root.querySelector(sel);

const ARROW =
  '<svg class="afx-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg>';

/* ----------------------------------------------------------------------- */
/* Headline strip                                                           */
/* ----------------------------------------------------------------------- */

function renderHeadlines() {
  const host = $('[data-exec-headlines]');
  if (!host) return;

  const tiles = [
    {
      label: 'Net Operating Surplus',
      value: POSITION.netSurplus,
      count: true,
      meta: `${percent(POSITION.momChange)} MoM`,
      tone: 'is-positive',
      href: 'overview.html',
      hint: 'Year to date, postings recorded through August 2026.',
    },
    {
      label: 'Procurement Commitment',
      value: PROCUREMENT.committed,
      count: true,
      meta: `${PROCUREMENT.orders} active orders`,
      tone: '',
      href: 'list.html',
      hint: 'Total committed spend across all open purchase orders.',
    },
    {
      label: 'Receivables Outstanding',
      value: AGEING.total,
      count: true,
      meta: `${share(AGEING.buckets[3].share)} critical`,
      tone: 'is-critical',
      href: 'overview.html#rec',
      hint: 'Across all four ageing bands.',
    },
    {
      label: 'Closing Cash Position',
      value: LIQUIDITY.closing,
      count: true,
      meta: LIQUIDITY.facility,
      tone: 'is-negative',
      href: 'overview.html#cash',
      hint: 'Principal operating account at the last posted period.',
    },
  ];

  // Each tile's graphic is derived from that tile's own underlying series —
  // never a cross-tile comparison, which would put different units on one
  // scale.
  const visuals = [
    // Income against expenditure, the two figures the surplus is made of.
    stackBar([
      { value: POSITION.income, color: 'var(--chart-1)', label: 'Income' },
      { value: POSITION.expenses, color: 'var(--ink-faint)', label: 'Expenses' },
    ]),
    // Order lifecycle split across the committed spend.
    stackBar(
      PROCUREMENT.lifecycle.map((l) => ({
        value: l.count,
        color: `var(--bar-${l.tone})`,
        label: l.label,
      }))
    ),
    // The four ageing bands.
    stackBar(
      AGEING.buckets.map((b) => ({
        value: b.value,
        color: `var(--chart-age-${b.tone})`,
        label: b.label,
      }))
    ),
    // Twelve months of real readings.
    sparkline(LIQUIDITY.points.map((p) => p.value), {
      label: '12-month liquidity trend',
      width: 110,
      height: 26,
    }),
  ];

  host.innerHTML = tiles
    .map(
      (t, i) => `
      <a class="afx-instrument ${t.tone}" href="${t.href}" title="${t.hint}" data-reveal-item>
        <div class="afx-inst-label">${t.label}</div>
        <div class="afx-inst-value"><span data-exec-count="${i}">${money(t.value)}</span></div>
        <div class="afx-inst-meta">${t.meta}${ARROW}</div>
        <div class="afx-figure-visual">${visuals[i] || ''}</div>
      </a>`
    )
    .join('');

  tiles.forEach((t, i) => {
    const node = host.querySelector(`[data-exec-count="${i}"]`);
    if (node && t.count) countUpOnView(node, t.value, (v) => money(v), { duration: 1.1 });
  });
}

/* ----------------------------------------------------------------------- */
/* Procurement lifecycle — counts, so bars rather than a value chart        */
/* ----------------------------------------------------------------------- */

function renderProcurement() {
  const host = $('[data-exec-procurement]');
  if (!host) return;

  const total = PROCUREMENT.lifecycle.reduce((s, l) => s + l.count, 0);

  host.innerHTML = PROCUREMENT.lifecycle
    .map(
      (l) => `
      <div class="afx-barrow" data-reveal-item>
        <div class="afx-barrow-head">
          <span class="afx-barrow-label">
            <span class="afx-ageing-swatch" style="background:var(--bar-${l.tone})"></span>
            ${l.label}
          </span>
          <span class="afx-barrow-value">${l.count}<span class="afx-barrow-of"> / ${total}</span></span>
        </div>
        <div class="afx-barrow-track" role="img"
             aria-label="${l.label}: ${l.count} of ${total} orders">
          <span class="afx-barrow-fill" style="width:${(l.count / total) * 100}%;background:var(--bar-${l.tone})"></span>
        </div>
      </div>`
    )
    .join('');
}

/* ----------------------------------------------------------------------- */
/* Module roll-up table                                                     */
/* ----------------------------------------------------------------------- */

function renderModuleTable() {
  const body = $('[data-exec-modules]');
  if (!body) return;

  body.innerHTML = MODULE_SUMMARY.map(
    (m) => `
    <tr>
      <td class="primary-ref"><a href="${m.href}">${m.module}</a></td>
      <td>${m.metric}</td>
      <td class="numeric"><b>${m.value()}</b></td>
      <td><span class="afx-chip is-${m.tone}">${m.status}</span></td>
    </tr>`
  ).join('');
}

/* ----------------------------------------------------------------------- */
/* Workforce roll-up                                                        */
/* ----------------------------------------------------------------------- */

function renderWorkforce() {
  const host = $('[data-exec-workforce]');
  if (!host) return;

  const tiles = [
    {
      label: 'Attendance Rate',
      value: `${(WORKFORCE.attendanceRate * 100).toFixed(1)}%`,
      meta: WORKFORCE.attendanceDays,
      tone: 'is-positive',
      gauge: ring({
        pct: WORKFORCE.attendanceRate * 100,
        tone: 'pos',
        size: 52,
        caption: 'attendance',
        label: `${Math.round(WORKFORCE.attendanceRate * 100)}%`,
      }),
    },
    {
      label: 'Next Payroll (Gross)',
      value: money(WORKFORCE.nextPayrollGross),
      meta: WORKFORCE.payrollDate,
      tone: '',
      // Net take-home against deductions, both stated figures.
      visual: stackBar([
        { value: WORKFORCE.nextPayrollNet, color: 'var(--chart-1)', label: 'Net disbursed' },
        {
          value: WORKFORCE.nextPayrollGross - WORKFORCE.nextPayrollNet,
          color: 'var(--ink-faint)',
          label: 'Deductions',
        },
      ]),
    },
    {
      label: 'Awaiting Authorization',
      value: String(WORKFORCE.pendingApprovals),
      meta: 'Leave & expense requests',
      tone: 'is-critical',
    },
    {
      label: 'Leave Coverage',
      value: WORKFORCE.leaveCoverage,
      meta: `${WORKFORCE.headcount} staff in department`,
      tone: '',
    },
  ];

  host.innerHTML = tiles
    .map(
      (t) => `
      <div class="afx-instrument ${t.tone}" data-reveal-item>
        <div class="afx-figure-row">
          <div style="flex:1;min-width:0">
            <div class="afx-inst-label">${t.label}</div>
            <div class="afx-inst-value">${t.value}</div>
            <div class="afx-inst-meta">${t.meta}</div>
          </div>
          ${t.gauge || ''}
        </div>
        ${t.visual ? `<div class="afx-figure-visual">${t.visual}</div>` : ''}
      </div>`
    )
    .join('');
}

/* ----------------------------------------------------------------------- */
/* Ledger assurance strip                                                   */
/* ----------------------------------------------------------------------- */

function renderLedger() {
  const host = $('[data-exec-ledger]');
  if (!host) return;

  // Both bars share one scale, so equal debits and credits read as equal.
  const scale = Math.max(LEDGER.debits, LEDGER.credits) || 1;

  host.innerHTML = `
    <div class="afx-assure">
      <span class="afx-assure-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
      </span>
      <div class="afx-assure-text">
        <b>${LEDGER.status}</b>
        <span>Debits and credits agree across ${LEDGER.accounts} active ledger accounts
          &middot; ${LEDGER.periodStart} &rarr; ${LEDGER.periodEnd}</span>
      </div>
      <dl class="afx-assure-figures">
        <div>
          <dt>Total Debits</dt>
          <dd>${money(LEDGER.debits)}</dd>
          ${microBar({ value: LEDGER.debits, max: scale, tone: 'brand', basis: 'the larger side' })}
        </div>
        <div>
          <dt>Total Credits</dt>
          <dd>${money(LEDGER.credits)}</dd>
          ${microBar({ value: LEDGER.credits, max: scale, tone: 'brand', basis: 'the larger side', delay: 90 })}
        </div>
        <div>
          <dt>Variance</dt>
          <dd class="is-pos">${money(LEDGER.variance)}</dd>
          ${microBar({ value: Math.abs(LEDGER.variance), max: scale, tone: 'pos', basis: 'the larger side', delay: 180 })}
        </div>
      </dl>
    </div>`;
}

/* ----------------------------------------------------------------------- */
/* Boot                                                                     */
/* ----------------------------------------------------------------------- */

function boot() {
  if (!$('[data-exec-headlines]')) return;

  renderHeadlines();
  renderLedger();
  renderProcurement();
  renderWorkforce();
  renderModuleTable();

  const charts = [];

  const trajectoryHost = $('[data-chart="exec-trajectory"]');
  if (trajectoryHost) {
    const chart = trajectoryChart(trajectoryHost, { height: 260 });
    chart.update({ periods: TRAJECTORY.periods, hidden: [] });
    charts.push(() => chart.update({ periods: TRAJECTORY.periods, hidden: [] }));
  }

  const ageingHost = $('[data-chart="exec-ageing"]');
  if (ageingHost) {
    const donut = ageingDonut(ageingHost, { height: 200 });
    donut.update({ buckets: AGEING.buckets });
    charts.push(() => donut.update({ buckets: AGEING.buckets }));
  }

  const liquidityHost = $('[data-chart="exec-liquidity"]');
  if (liquidityHost) {
    const chart = liquidityChart(liquidityHost, { height: 230 });
    chart.update({ points: LIQUIDITY.points });
    charts.push(() => chart.update({ points: LIQUIDITY.points }));
  }

  // Stamp the as-of line from the data rather than hardcoding it in markup.
  const asOf = $('[data-exec-asof]');
  if (asOf) asOf.textContent = ORG.postedThrough;

  revealOnScroll('[data-reveal]');
  initPageHeader();

  // Sync re-reads the data module and re-renders every block in place.
  document.addEventListener('afx:refresh', (e) => {
    renderHeadlines();
    renderLedger();
    renderProcurement();
    renderWorkforce();
    renderModuleTable();
    charts.forEach((redraw) => redraw());
    if (e.detail) e.detail.done = Promise.resolve();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
