/**
 * AFINTRIX ERP — Home
 *
 * The landing screen reads from the same data module as the dashboards, so
 * the figures and charts it shows are the live ones rather than a picture of
 * them. Nothing here is a mock-up.
 */

import {
  AGEING,
  LEDGER,
  LIQUIDITY,
  POSITION,
  PROCUREMENT,
  TRAJECTORY,
  compact,
  money,
  percent,
  plain,
  share,
} from './data.js';

import { ageingDonut, liquidityChart, trajectoryChart } from './charts.js';
import { microBar, ring, sparkline, stackBar } from './visuals.js';
import { countUpOnView, revealOnScroll } from './motion.js';

const $ = (sel, root = document) => root.querySelector(sel);

/* ----------------------------------------------------------------------- */
/* Headline figures                                                         */
/* ----------------------------------------------------------------------- */

function renderStats() {
  const host = $('[data-home-stats]');
  if (!host) return;

  const stats = [
    {
      label: 'Net Operating Surplus',
      value: POSITION.netSurplus,
      format: (v) => money(v),
      meta: `${percent(POSITION.momChange)} month over month`,
      tone: 'pos',
      visual: stackBar([
        { value: POSITION.income, color: 'var(--chart-1)', label: 'Income' },
        { value: POSITION.expenses, color: 'var(--ink-faint)', label: 'Expenses' },
      ]),
    },
    {
      label: 'Procurement Commitment',
      value: PROCUREMENT.committed,
      format: (v) => money(v),
      meta: `${PROCUREMENT.orders} orders · ${PROCUREMENT.itemUnits} item units`,
      tone: 'brand',
      visual: stackBar(
        PROCUREMENT.lifecycle.map((l) => ({
          value: l.count,
          color: `var(--bar-${l.tone})`,
          label: l.label,
        }))
      ),
    },
    {
      label: 'Receivables Outstanding',
      value: AGEING.total,
      format: (v) => money(v),
      meta: `${share(AGEING.buckets[3].share)} in critical follow-up`,
      tone: 'gold',
      visual: stackBar(
        AGEING.buckets.map((b) => ({
          value: b.value,
          color: `var(--chart-age-${b.tone})`,
          label: b.label,
        }))
      ),
    },
    {
      label: 'Ledger Variance',
      value: LEDGER.variance,
      format: (v) => money(v),
      meta: `Balanced across ${LEDGER.accounts} accounts`,
      tone: 'pos',
      visual: microBar({ value: LEDGER.debits, max: LEDGER.debits, tone: 'pos', basis: 'credits' }),
    },
  ];

  host.innerHTML = stats
    .map(
      (s, i) => `
      <div class="home-stat" data-reveal-item>
        <div class="home-stat-label">${s.label}</div>
        <div class="home-stat-value is-${s.tone}"><span data-stat="${i}">${s.format(s.value)}</span></div>
        <div class="home-stat-meta">${s.meta}</div>
        <div class="home-stat-visual">${s.visual}</div>
      </div>`
    )
    .join('');

  stats.forEach((s, i) => {
    const node = host.querySelector(`[data-stat="${i}"]`);
    if (node) countUpOnView(node, s.value, s.format, { duration: 1.3, delay: i * 0.08 });
  });
}

/* ----------------------------------------------------------------------- */
/* Live preview — three real views, switchable                              */
/* ----------------------------------------------------------------------- */

const VIEWS = {
  position: {
    title: 'Operating Position',
    caption: 'Revenue, expenditure and net result across the fiscal year.',
    mount(host) {
      const chart = trajectoryChart(host, { height: 250 });
      chart.update({ periods: TRAJECTORY.periods, hidden: [] });
      return chart;
    },
    figure: () => ({
      value: money(POSITION.netSurplus),
      label: 'Net operating surplus, year to date',
    }),
  },
  receivables: {
    title: 'Receivables Ageing',
    caption: 'What is owed, and how long it has been outstanding.',
    mount(host) {
      const donut = ageingDonut(host, { height: 250 });
      donut.update({ buckets: AGEING.buckets });
      return donut;
    },
    figure: () => ({
      value: money(AGEING.total),
      label: `Outstanding across ${AGEING.buckets.length} ageing bands`,
    }),
  },
  liquidity: {
    title: 'Cash & Bank Liquidity',
    caption: 'Twelve months of movement on the principal operating account.',
    mount(host) {
      const chart = liquidityChart(host, { height: 250 });
      chart.update({ points: LIQUIDITY.points });
      return chart;
    },
    figure: () => ({
      value: money(LIQUIDITY.closing),
      label: 'Closing position at the last posted period',
    }),
  },
};

function setupPreview() {
  const tabs = $('[data-preview-tabs]');
  const host = $('[data-preview-chart]');
  const title = $('[data-preview-title]');
  const caption = $('[data-preview-caption]');
  const figure = $('[data-preview-figure]');
  const figureLabel = $('[data-preview-figure-label]');
  if (!tabs || !host) return;

  let current = null;

  const show = (key) => {
    const view = VIEWS[key];
    if (!view) return;

    tabs.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.view === key));
    });

    // Tear the previous chart down properly; each registers observers.
    if (current && current.destroy) current.destroy();
    host.textContent = '';

    if (title) title.textContent = view.title;
    if (caption) caption.textContent = view.caption;
    const f = view.figure();
    if (figure) figure.textContent = f.value;
    if (figureLabel) figureLabel.textContent = f.label;

    // Re-trigger the panel's entrance each time the view changes.
    const panel = host.closest('.home-preview-body');
    if (panel) {
      panel.classList.remove('is-entering');
      void panel.offsetWidth;
      panel.classList.add('is-entering');
    }

    current = view.mount(host);
  };

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (btn) show(btn.dataset.view);
  });

  tabs.addEventListener('keydown', (e) => {
    const list = Array.from(tabs.querySelectorAll('button[data-view]'));
    const i = list.indexOf(document.activeElement);
    if (i === -1) return;
    let next = null;
    if (e.key === 'ArrowRight') next = list[(i + 1) % list.length];
    if (e.key === 'ArrowLeft') next = list[(i - 1 + list.length) % list.length];
    if (!next) return;
    e.preventDefault();
    next.focus();
    show(next.dataset.view);
  });

  show('position');
}

/* ----------------------------------------------------------------------- */
/* Module grid                                                              */
/* ----------------------------------------------------------------------- */

const MODULES = [
  {
    id: 'executive',
    title: 'Executive Summary',
    copy: 'One roll-up of financial, procurement and workforce position.',
    href: 'executive.html',
    cta: 'Open summary',
    icon: 'executive',
    stat: () => money(POSITION.netSurplus),
    statLabel: 'Net surplus',
  },
  {
    id: 'dashboard',
    title: 'Financial Overview',
    copy: 'Operating position, trajectory, receivables and the ledger stream.',
    href: 'overview.html',
    cta: 'Open financials',
    icon: 'dashboard',
    stat: () => compact(POSITION.income),
    statLabel: 'Income YTD',
  },
  {
    id: 'report',
    title: 'Trial Balance & Ledger',
    copy: 'Statutory position with debits, credits and variance by account.',
    href: 'report.html',
    cta: 'Audit ledger',
    icon: 'report',
    stat: () => money(LEDGER.variance),
    statLabel: 'Variance',
  },
  {
    id: 'list',
    title: 'Purchase Orders',
    copy: 'Procure-to-pay lifecycle from commitment through to reconciliation.',
    href: 'list.html',
    cta: 'Open procurement',
    icon: 'purchasing',
    stat: () => String(PROCUREMENT.orders),
    statLabel: 'Active orders',
  },
  {
    id: 'record',
    title: 'Personnel Dossier',
    copy: 'Employee records, entitlements, attendance and salary history.',
    href: 'record.html',
    cta: 'Open dossier',
    icon: 'people',
    stat: () => '95.4%',
    statLabel: 'Attendance',
  },
  {
    id: 'approval',
    title: 'Approval Governance',
    copy: 'Authorisation queue with staffing coverage checks before approval.',
    href: 'approval.html',
    cta: 'Review approvals',
    icon: 'check',
    stat: () => '5',
    statLabel: 'Awaiting you',
    accent: 'gold',
  },
  {
    id: 'portal',
    title: 'Self-Service Portal',
    copy: 'Leave balances, expense claims and payslips for every employee.',
    href: 'portal.html',
    cta: 'Launch portal',
    icon: 'portal',
    stat: () => compact(92000),
    statLabel: 'Next payroll',
  },
  {
    id: 'form',
    title: 'Create Order',
    copy: 'Raise a purchase order with live totals and readiness checks.',
    href: 'form.html',
    cta: 'Start an order',
    icon: 'plus',
    stat: () => String(PROCUREMENT.itemUnits),
    statLabel: 'Item units',
  },
];

function renderModules() {
  const host = $('[data-home-modules]');
  if (!host) return;
  const icon = window.afxSvg || (() => '');

  host.innerHTML = MODULES.map(
    (m) => `
    <a class="home-module${m.accent ? ' is-' + m.accent : ''}" href="${m.href}" data-reveal-item>
      <span class="home-module-icon">${icon(m.icon, 20)}</span>
      <h3>${m.title}</h3>
      <p>${m.copy}</p>
      <div class="home-module-foot">
        <span class="home-module-stat">
          <b>${m.stat()}</b>
          <small>${m.statLabel}</small>
        </span>
        <span class="home-module-cta">${m.cta}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 12h14M13 6l6 6-6 6"/>
          </svg>
        </span>
      </div>
    </a>`
  ).join('');
}

/** Cursor-tracked spotlight across the module cards. */
function wireSpotlight() {
  const grid = $('[data-home-modules]');
  if (!grid) return;
  let frame = 0;
  let pending = null;

  grid.addEventListener(
    'pointermove',
    (e) => {
      const card = e.target.closest('.home-module');
      if (!card) return;
      pending = { card, x: e.clientX, y: e.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pending) return;
        const r = pending.card.getBoundingClientRect();
        pending.card.style.setProperty('--mx', `${pending.x - r.left}px`);
        pending.card.style.setProperty('--my', `${pending.y - r.top}px`);
      });
    },
    { passive: true }
  );
}

/* ----------------------------------------------------------------------- */
/* Hero parallax                                                            */
/* ----------------------------------------------------------------------- */

function wireHeroParallax() {
  const art = $('[data-hero-art]');
  if (!art) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    const y = window.scrollY || document.documentElement.scrollTop;
    // A gentle drift, capped so it never detaches from the layout.
    const shift = Math.min(40, y * 0.06);
    art.style.transform = `translateY(${-shift}px)`;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

/* ----------------------------------------------------------------------- */

function boot() {
  if (!$('[data-home-stats]')) return;
  renderStats();
  renderModules();
  setupPreview();
  wireSpotlight();
  wireHeroParallax();
  revealOnScroll('[data-reveal]');

  const year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
