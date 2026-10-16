/**
 * AFINTRIX ERP — Financial Data Module
 *
 * Single source of truth for the Financial Overview figures.
 *
 * PROVENANCE: this application has no backend. Every figure below was lifted
 * verbatim from the values previously hardcoded into index.html's markup.
 * Nothing here is invented. Where a value is *derived*, the derivation is
 * documented inline so it can be swapped for a real API response later.
 *
 * To wire this to a live backend, replace `loadFinancials()` with a fetch and
 * keep the returned shape identical — every consumer reads this shape only.
 */

/** Organisation / fiscal context. */
export const ORG = {
  entity: 'Afintrix (Demo) Entity',
  shortEntity: 'Afintrix (Demo)',
  location: 'Dhaka AD',
  fiscalYear: 'FY 2026-2027',
  ledger: 'General Ledger',
  status: 'Accounts Reconciled',
  currency: 'USD',
  currencySymbol: '$',
  /** Last period with posted activity. */
  postedThrough: 'August 2026',
};

/** Headline operating position (year to date). */
export const POSITION = {
  netSurplus: 109340.0,
  income: 363100.0,
  expenses: 253760.0,
  /** Month-over-month movement of net operating surplus. */
  momChange: 0.124,
};

/**
 * Operational flow indicators. `href` targets an existing page so each tile is
 * a real navigation affordance rather than decoration.
 */
export const FLOW = [
  {
    id: 'outgoing',
    label: 'Outgoing Bills',
    value: 363000,
    display: '$3.63L',
    meta: '18 Open Bills',
    count: 18,
    tone: 'neutral',
    href: 'list.html',
    hint: 'Supplier invoices raised against Afintrix (Demo) this fiscal year.',
  },
  {
    id: 'incoming',
    label: 'Incoming Bills',
    value: 349000,
    display: '$3.49L',
    meta: '22 Payable Lines',
    count: 22,
    tone: 'neutral',
    href: 'list.html',
    hint: 'Payable lines awaiting scheduling against the operating account.',
  },
  {
    id: 'cleared',
    label: 'Inflow Cleared',
    value: 47000,
    display: '$47.00K',
    meta: '6 Receipts',
    count: 6,
    tone: 'positive',
    href: 'report.html',
    hint: 'Receipts reconciled against the ledger and cleared by the bank.',
  },
  {
    id: 'overdue',
    label: 'Overdue >90d',
    value: 38500,
    display: '$38.50K',
    meta: '4 Accounts Flagged',
    count: 4,
    tone: 'critical',
    href: 'report.html',
    hint: 'Receivables past the agreed payment deadline by more than 90 days.',
  },
];

/**
 * Monthly operating trajectory for FY 2026-2027.
 *
 * DERIVATION — read before changing. The application stores no per-month
 * source data; the previous chart encoded Jul/Aug as raw SVG bar heights.
 * Those pixel heights were converted back to currency and then normalised so
 * the series satisfies all three figures the application actually states:
 *
 *   sum(revenue) = 363,100   sum(expense) = 253,760   sum(net) = 109,340
 *   net(Aug) / net(Jul) - 1  = +12.4%  (the stated MoM change)
 *
 * September 2026 onward has no recorded activity and is rendered as an
 * explicit empty state — never as zero, and never back-filled with a trend.
 */
export const TRAJECTORY = {
  periods: [
    { key: '2026-07', label: 'Jul', year: '26', recorded: true, revenue: 190127, expense: 138650 },
    { key: '2026-08', label: 'Aug', year: '26', recorded: true, revenue: 172973, expense: 115110 },
    { key: '2026-09', label: 'Sep', year: '26', recorded: false },
    { key: '2026-10', label: 'Oct', year: '26', recorded: false },
    { key: '2026-11', label: 'Nov', year: '26', recorded: false },
    { key: '2026-12', label: 'Dec', year: '26', recorded: false },
    { key: '2027-01', label: 'Jan', year: '27', recorded: false },
    { key: '2027-02', label: 'Feb', year: '27', recorded: false },
    { key: '2027-03', label: 'Mar', year: '27', recorded: false },
    { key: '2027-04', label: 'Apr', year: '27', recorded: false },
    { key: '2027-05', label: 'May', year: '27', recorded: false },
    { key: '2027-06', label: 'Jun', year: '27', recorded: false },
  ],
};

/** Net is always derived, never stored, so the three series cannot drift. */
TRAJECTORY.periods.forEach((p) => {
  if (p.recorded) p.net = p.revenue - p.expense;
});

/**
 * Institutional cash & bank liquidity, 12 months ending with the last posted
 * period (August 2026). Shape taken from the previous chart's polyline; the
 * closing position is the figure the application states verbatim.
 */
export const LIQUIDITY = {
  account: 'Principal Operating Account (Dhaka AD)',
  facility: 'Overdraft Facility Active',
  closing: -117854.0,
  points: [
    { label: 'Sep 25', value: 38200 },
    { label: 'Oct 25', value: 45600 },
    { label: 'Nov 25', value: 35300 },
    { label: 'Dec 25', value: 50000 },
    { label: 'Jan 26', value: 42600 },
    { label: 'Feb 26', value: 54400 },
    { label: 'Mar 26', value: 23500 },
    { label: 'Apr 26', value: 2900 },
    { label: 'May 26', value: -32400 },
    { label: 'Jun 26', value: -70600 },
    { label: 'Jul 26', value: -94100 },
    { label: 'Aug 26', value: -117854 },
  ],
};

/** Receivables ageing buckets. Totals are derived, not restated. */
export const AGEING = {
  buckets: [
    {
      id: 'b0',
      label: '0-30 Days',
      qualifier: 'Current',
      value: 142100.0,
      tone: 'brand',
      critical: false,
      hint: 'Within agreed payment terms.',
    },
    {
      id: 'b30',
      label: '31-60 Days',
      qualifier: 'Watch',
      value: 78600.0,
      tone: 'brand-2',
      critical: false,
      hint: 'Past terms but inside the standard collection window.',
    },
    {
      id: 'b60',
      label: '61-90 Days',
      qualifier: 'Escalate',
      value: 56900.0,
      tone: 'brand-3',
      critical: false,
      hint: 'Requires collection follow-up before ageing into the critical band.',
    },
    {
      id: 'b90',
      label: '90+ Days',
      qualifier: 'Critical Follow-up',
      value: 38500.0,
      tone: 'gold',
      critical: true,
      hint: '4 commercial invoices past the agreed payment deadline.',
    },
  ],
};

AGEING.total = AGEING.buckets.reduce((sum, b) => sum + b.value, 0);
AGEING.buckets.forEach((b) => {
  b.share = b.value / AGEING.total;
});

/**
 * Operational triage queue. Each item already existed on the dashboard and
 * links to the page that actually services it.
 */
export const TRIAGE = [
  {
    id: 'overdue-receivable',
    title: 'Overdue Receivable Resolution',
    detail: '4 commercial invoices past agreed payment deadline',
    icon: 'alert',
    tone: 'critical',
    trailing: '$38,500',
    href: 'report.html',
  },
  {
    id: 'bank-rec',
    title: 'Bank Reconciliation Outstanding',
    detail: 'Demo Bank Account · 12 unreconciled entries',
    icon: 'bank',
    tone: 'brand',
    trailing: '12 Lines',
    href: 'list.html',
  },
  {
    id: 'draft-po',
    title: 'Draft Procurement Authorization',
    detail: 'PUR-ORD-2026-00036 ready for vendor transmission',
    icon: 'doc',
    tone: 'neutral',
    trailing: 'Draft',
    href: 'list.html',
  },
  {
    id: 'variance-lock',
    title: 'Fiscal Variance Budget Lock',
    detail: 'FY 2026-2027 departmental variance control limits',
    icon: 'report',
    tone: 'brand',
    trailing: 'Configure',
    href: 'report.html',
  },
];

/** Most recent journal entries posted to Afintrix (Demo). */
export const POSTINGS = [
  { voucher: 'JV-2026-00048', account: 'Bank Accounts', date: '31-08-2026', amount: 164854.0 },
  { voucher: 'JV-2026-00047', account: 'Debtors', date: '30-08-2026', amount: 47000.0 },
  { voucher: 'JV-2026-00046', account: 'Stock In Hand', date: '28-08-2026', amount: 253760.0 },
  { voucher: 'JV-2026-00045', account: 'Creditors', date: '26-08-2026', amount: 349147.0 },
  { voucher: 'JV-2026-00044', account: 'Sales Operating', date: '24-08-2026', amount: 363100.0 },
];

/**
 * Period selector options. `scope` is what a backend would filter on; the
 * dashboard narrows the trajectory series by it so changing the control
 * actually changes the data rather than just the control's appearance.
 */
export const PERIOD_SCOPES = [
  { id: 'fy', label: 'FY 2026-2027', months: null },
  { id: 'q1', label: 'Q1 Target', months: ['2026-07', '2026-08', '2026-09'] },
  { id: 'month', label: 'Month', months: ['2026-08'] },
];

/* ----------------------------------------------------------------------- */
/* Formatting — one implementation, used everywhere.                        */
/* ----------------------------------------------------------------------- */

const fullFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plainFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `$109,340.00` — negatives parenthesised, per accounting convention. */
export function money(value) {
  const formatted = fullFormatter.format(Math.abs(value));
  return value < 0 ? `(${formatted})` : formatted;
}

/** `109,340.00` without the currency symbol, for table columns. */
export function plain(value) {
  return plainFormatter.format(value);
}

/**
 * Compact lakh/thousand notation matching the dashboard's existing style
 * (`$3.63L`, `$47.00K`). Used for dense tiles and chart axes.
 */
export function compact(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 100000) return `${sign}$${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/** Terse axis labels — `2.0L`, `50K`, `0`. */
export function axisLabel(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs === 0) return '0';
  if (abs >= 100000) return `${sign}${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}${Math.round(abs / 1000)}K`;
  return `${sign}${abs}`;
}

/** `+12.4%` / `-9.7%`. */
export function percent(value, digits = 1) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

/** `45%` — for share-of-total, where a sign would be meaningless. */
export function share(value) {
  return `${Math.round(value * 100)}%`;
}

/**
 * The single entry point a real backend would replace. Returns the whole
 * dashboard payload so callers never reach into individual exports.
 */
export function loadFinancials() {
  return { ORG, POSITION, FLOW, TRAJECTORY, LIQUIDITY, AGEING, TRIAGE, POSTINGS };
}

/* ======================================================================= */
/* Cross-module summary                                                     */
/*                                                                          */
/* Figures below are lifted from the other screens' own headline cards, so  */
/* the Executive Summary never states anything those screens do not. Each   */
/* entry records where it came from.                                        */
/* ======================================================================= */

/** Trial Balance & Ledger (report.html) headline audit figures. */
export const LEDGER = {
  debits: 1177861.0,
  credits: 1177861.0,
  variance: 0.0,
  accounts: 16,
  status: 'Books in Balance',
  periodStart: '01 July 2026',
  periodEnd: '30 June 2027',
};

/** Purchase Orders (list.html) headline cards. */
export const PROCUREMENT = {
  committed: 1048450.0,
  orders: 8,
  itemUnits: 49,
  pendingInvoicingValue: 62300.0,
  /**
   * Lifecycle split. The first three are the figures list.html states on its
   * own summary cards; the remainder is the balance of the 8 orders, which on
   * that screen are one draft and one cancelled.
   */
  lifecycle: [
    { id: 'fulfilled', label: 'Fulfilled & Reconciled', count: 3, tone: 'pos' },
    { id: 'receipt', label: 'Awaiting Warehouse Receipt', count: 2, tone: 'brand' },
    { id: 'invoicing', label: 'Pending Vendor Invoicing', count: 1, tone: 'gold' },
    { id: 'inactive', label: 'Draft or Cancelled', count: 2, tone: 'muted' },
  ],
};

/** People & Operations figures (portal.html, record.html, approval.html). */
export const WORKFORCE = {
  employee: 'Hanna Baptista',
  employeeRef: 'HR-EMP-00002',
  department: 'Accounts - AD',
  attendanceRate: 0.954,
  attendanceDays: '21 of 22 days',
  nextPayrollGross: 92000.0,
  nextPayrollNet: 80960.0,
  payrollDate: '30 Sep 2026',
  pendingApprovals: 5,
  leaveCoverage: '1 of 6 active staff',
  headcount: 6,
};

/**
 * Module roll-up for the summary table. `value` is the single number that
 * screen leads with; `href` is the screen that owns the detail.
 */
export const MODULE_SUMMARY = [
  {
    module: 'Financial Overview',
    metric: 'Net operating surplus (YTD)',
    value: () => money(POSITION.netSurplus),
    status: ORG.status,
    tone: 'pos',
    href: 'index.html',
  },
  {
    module: 'Trial Balance & Ledger',
    metric: `Variance across ${LEDGER.accounts} ledger accounts`,
    value: () => money(LEDGER.variance),
    status: LEDGER.status,
    tone: 'pos',
    href: 'report.html',
  },
  {
    module: 'Cash & Bank',
    metric: 'Closing operating position',
    value: () => money(LIQUIDITY.closing),
    status: LIQUIDITY.facility,
    tone: 'neg',
    href: 'index.html#cash',
  },
  {
    module: 'Receivables',
    metric: 'Outstanding, all ageing bands',
    value: () => money(AGEING.total),
    status: `${share(AGEING.buckets[3].share)} critical follow-up`,
    tone: 'gold',
    href: 'index.html#rec',
  },
  {
    module: 'Purchase Orders',
    metric: `Committed spend across ${PROCUREMENT.orders} orders`,
    value: () => money(PROCUREMENT.committed),
    status: `${PROCUREMENT.lifecycle[1].count} awaiting receipt`,
    tone: 'brand',
    href: 'list.html',
  },
  {
    module: 'Approval Governance',
    metric: 'Requests awaiting authorization',
    value: () => String(WORKFORCE.pendingApprovals),
    status: 'Action required',
    tone: 'gold',
    href: 'approval.html',
  },
  {
    module: 'People & Payroll',
    metric: `Next disbursement \u00b7 ${WORKFORCE.payrollDate}`,
    value: () => money(WORKFORCE.nextPayrollGross),
    status: `Attendance ${(WORKFORCE.attendanceRate * 100).toFixed(1)}%`,
    tone: 'pos',
    href: 'portal.html',
  },
];
