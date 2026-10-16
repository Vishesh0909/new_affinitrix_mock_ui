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
import { countUpOnView, revealOnScroll } from './motion.js';

const $ = (sel, root = document) => root.querySelector(sel);

const ARROW =
  '<svg class="afx-arrow" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';

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
      href: 'index.html',
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
      href: 'index.html#rec',
      hint: 'Across all four ageing bands.',
    },
    {
      label: 'Closing Cash Position',
      value: LIQUIDITY.closing,
      count: true,
      meta: LIQUIDITY.facility,
      tone: 'is-negative',
      href: 'index.html#cash',
      hint: 'Principal operating account at the last posted period.',
    },
  ];

  host.innerHTML = tiles
    .map(
      (t, i) => `
      <a class="afx-instrument ${t.tone}" href="${t.href}" title="${t.hint}" data-reveal-item>
        <div class="afx-inst-label">${t.label}</div>
        <div class="afx-inst-value"><span data-exec-count="${i}">${money(t.value)}</span></div>
        <div class="afx-inst-meta">${t.meta}${ARROW}</div>
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
    },
    {
      label: 'Next Payroll (Gross)',
      value: money(WORKFORCE.nextPayrollGross),
      meta: WORKFORCE.payrollDate,
      tone: '',
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
        <div class="afx-inst-label">${t.label}</div>
        <div class="afx-inst-value">${t.value}</div>
        <div class="afx-inst-meta">${t.meta}</div>
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

  host.innerHTML = `
    <div class="afx-assure">
      <span class="afx-assure-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </span>
      <div class="afx-assure-text">
        <b>${LEDGER.status}</b>
        <span>Debits and credits agree across ${LEDGER.accounts} active ledger accounts
          &middot; ${LEDGER.periodStart} &rarr; ${LEDGER.periodEnd}</span>
      </div>
      <dl class="afx-assure-figures">
        <div><dt>Total Debits</dt><dd>${money(LEDGER.debits)}</dd></div>
        <div><dt>Total Credits</dt><dd>${money(LEDGER.credits)}</dd></div>
        <div><dt>Variance</dt><dd class="is-pos">${money(LEDGER.variance)}</dd></div>
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

  const trajectoryHost = $('[data-chart="exec-trajectory"]');
  if (trajectoryHost) {
    const chart = trajectoryChart(trajectoryHost, { height: 260 });
    chart.update({ periods: TRAJECTORY.periods, hidden: [] });
  }

  const ageingHost = $('[data-chart="exec-ageing"]');
  if (ageingHost) {
    const donut = ageingDonut(ageingHost, { height: 200 });
    donut.update({ buckets: AGEING.buckets });
  }

  const liquidityHost = $('[data-chart="exec-liquidity"]');
  if (liquidityHost) {
    const chart = liquidityChart(liquidityHost, { height: 230 });
    chart.update({ points: LIQUIDITY.points });
  }

  // Stamp the as-of line from the data rather than hardcoding it in markup.
  const asOf = $('[data-exec-asof]');
  if (asOf) asOf.textContent = ORG.postedThrough;

  revealOnScroll('[data-reveal]');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
